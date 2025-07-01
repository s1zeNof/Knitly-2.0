// src/UserContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { cacheAnimatedPackId } from './emojiPackCache';

const UserContext = createContext();

const fetchAndCacheUserEmojiPacks = async (userId) => {
    if (!userId) return;
    try {
        const packsQuery = query(collection(db, 'emoji_packs'), where('authorUid', '==', userId));
        const packsSnapshot = await getDocs(packsQuery);
        packsSnapshot.forEach(packDoc => {
            if (packDoc.data().isAnimated) {
                cacheAnimatedPackId(packDoc.id);
            }
        });
    } catch (error) {
        console.error("Помилка кешування емоджі-паків:", error);
    }
};

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
                    subscribedPackIds: userData.subscribedPackIds || [],
                    notesBalance: userData.notesBalance || 0 
                });
                await fetchAndCacheUserEmojiPacks(user.uid);
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
                
                await fetchAndCacheUserEmojiPacks(authUser.uid);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser({ 
                        uid: authUser.uid, 
                        ...userData,
                        chatFolders: userData.chatFolders || [],
                        subscribedPackIds: userData.subscribedPackIds || [],
                        notesBalance: userData.notesBalance || 0 
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
                        subscribedPackIds: [],
                        notesBalance: 0 
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