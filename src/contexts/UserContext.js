import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { cacheAnimatedPackId } from '../utils/emojiPackCache';

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
    const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

    const refreshUser = async () => {
        if (!auth?.currentUser?.uid) return;
        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUser({ 
                    uid: auth.currentUser.uid, 
                    ...userData,
                    chatFolders: userData.chatFolders || [],
                    subscribedPackIds: userData.subscribedPackIds || []
                });
                await fetchAndCacheUserEmojiPacks(auth.currentUser.uid);
            }
        } catch (error) {
            console.error("Error refreshing user:", error);
        }
    };

    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, (authUser) => {
            if (authUser) {
                setAuthLoading(true);
                const userRef = doc(db, 'users', authUser.uid);

                const userDocUnsubscribe = onSnapshot(userRef, async (userDoc) => {
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUser({ 
                            uid: authUser.uid, 
                            ...userData,
                            chatFolders: userData.chatFolders || [],
                            subscribedPackIds: userData.subscribedPackIds || []
                        });
                        await fetchAndCacheUserEmojiPacks(authUser.uid);
                    } else {
                        const nickname = authUser.email ? authUser.email.split('@')[0].replace(/[^a-z0-9_.]/g, '') : `user${Date.now()}`;
                        const newUserName = authUser.displayName || 'Новий Артист';
                        const newUser = {
                            uid: authUser.uid, 
                            displayName: newUserName,
                            displayName_lowercase: newUserName.toLowerCase(),
                            email: authUser.email, 
                            photoURL: authUser.photoURL || null,
                            nickname: nickname, 
                            followers: [], 
                            following: [], 
                            likedTracks: [],
                            createdAt: serverTimestamp(), 
                            chatFolders: [], 
                            subscribedPackIds: []
                        };
                        await setDoc(userRef, newUser);
                        setUser(newUser);
                    }
                    setAuthLoading(false);
                });

                return () => userDocUnsubscribe();

            } else {
                setUser(null);
                setAuthLoading(false);
            }
        });

        return () => authUnsubscribe();
    }, []);

    useEffect(() => {
        if (!user?.uid) {
            setTotalUnreadMessages(0);
            return;
        }
        
        const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            let totalUnread = 0;
            querySnapshot.forEach(doc => {
                const chatData = doc.data();
                if (chatData.unreadCounts && chatData.unreadCounts[user.uid]) {
                    totalUnread += chatData.unreadCounts[user.uid];
                }
            });
            setTotalUnreadMessages(totalUnread);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    useEffect(() => {
        if (!user?.uid) {
            setUnreadNotificationsCount(0);
            return;
        }

        const q = query(collection(db, 'users', user.uid, 'notifications'), where('read', '==', false));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadNotificationsCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const value = {
        user, setUser, authLoading, refreshUser,
        totalUnreadMessages, unreadNotificationsCount
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);