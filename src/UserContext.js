import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const refreshUser = async () => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUser({ ...user, ...userData });
            }
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                const userRef = doc(db, 'users', authUser.uid);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    setUser({ ...userDoc.data(), uid: authUser.uid });
                } else {
                    const nickname = authUser.email ? authUser.email.split('@')[0] : `user${Date.now()}`;
                    const newUser = {
                        uid: authUser.uid,
                        displayName: authUser.displayName || 'New User',
                        email: authUser.email,
                        photoURL: authUser.photoURL,
                        nickname: nickname,
                        followers: [],
                        following: [],
                        likedTracks: [],
                        isPublicProfile: true,
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
        <UserContext.Provider value={{ user, authLoading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);