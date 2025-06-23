import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const refreshUser = async () => {
        if (!user) return;
        try {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUser({ 
                    uid: user.uid, 
                    ...userData,
                    chatFolders: userData.chatFolders || [],
                    subscribedPackIds: userData.subscribedPackIds || [] // Гарантуємо, що поле існує
                });
            }
        } catch (error) {
            console.error("Error refreshing user:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                const userRef = doc(db, 'users', authUser.uid);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser({ 
                        uid: authUser.uid, 
                        ...userData,
                        chatFolders: userData.chatFolders || [],
                        subscribedPackIds: userData.subscribedPackIds || [] // Для існуючих користувачів
                    });
                } else {
                    const nickname = authUser.email ? authUser.email.split('@')[0].replace(/[^a-z0-9_.]/g, '') : `user${Date.now()}`;
                    const newUser = {
                        uid: authUser.uid,
                        displayName: authUser.displayName || 'Новий Артист',
                        email: authUser.email,
                        photoURL: authUser.photoURL || null,
                        nickname: nickname,
                        followers: [],
                        following: [],
                        likedTracks: [],
                        createdAt: serverTimestamp(),
                        chatFolders: [],
                        subscribedPackIds: [] // <<< ДОДАНО НОВЕ ПОЛЕ ДЛЯ НОВИХ КОРИСТУВАЧІВ
                    };
                    await setDoc(userRef, newUser);
                    setUser(newUser);
                }
            } else {
                setUser(null);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, authLoading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);