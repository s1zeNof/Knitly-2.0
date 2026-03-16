import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, reload } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { cacheAnimatedPackId } from '../utils/emojiPackCache';
import { diag } from '../utils/diagnostics';

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
                setUser(prev => ({
                    uid: auth.currentUser.uid,
                    emailVerified: auth.currentUser.emailVerified,
                    ...userData,
                    chatFolders: userData.chatFolders || [],
                    subscribedPackIds: userData.subscribedPackIds || []
                }));
                await fetchAndCacheUserEmojiPacks(auth.currentUser.uid);
            }
        } catch (error) {
            console.error("Error refreshing user:", error);
        }
    };

    // Reload Firebase Auth token and update emailVerified in context.
    // Called by EmailVerificationBanner when user returns to the tab.
    const refreshEmailVerified = async () => {
        if (!auth?.currentUser) return;
        try {
            await reload(auth.currentUser);
            if (auth.currentUser.emailVerified) {
                setUser(prev => prev ? { ...prev, emailVerified: true } : prev);
            }
        } catch (e) {
            // non-critical
        }
    };

    useEffect(() => {
        let userDocUnsubscribe = null;

        const authUnsubscribe = onAuthStateChanged(auth, (authUser) => {
            // Cleanup previous listener if exists
            if (userDocUnsubscribe) {
                userDocUnsubscribe();
                userDocUnsubscribe = null;
            }

            if (authUser) {
                setAuthLoading(true);
                const userRef = doc(db, 'users', authUser.uid);

                // ── Ensure Firestore doc exists, then subscribe ───────────────
                // IMPORTANT: user doc creation uses a one-time getDoc, NOT onSnapshot.
                // onSnapshot can fire with !exists() on transient network issues, and
                // calling setDoc inside it would wipe all data (likedTracks, followers,
                // gifts…) with empty defaults — a critical, hard-to-reproduce data loss.
                (async () => {
                    try {
                        const initialSnap = await getDoc(userRef);
                        if (!initialSnap.exists()) {
                            // Truly new user — create doc exactly once
                            let baseSlug = '';
                            if (authUser.displayName) {
                                baseSlug = authUser.displayName
                                    .toLowerCase()
                                    .replace(/[^a-z0-9\s]/g, '')
                                    .trim()
                                    .replace(/\s+/g, '-')
                                    .substring(0, 28);
                            } else if (authUser.email) {
                                baseSlug = authUser.email
                                    .split('@')[0]
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]/g, '-')
                                    .replace(/-+/g, '-')
                                    .replace(/^-|-$/g, '')
                                    .substring(0, 28);
                            }
                            if (!baseSlug) baseSlug = 'user';
                            const randomNum = Math.floor(Math.random() * 9000) + 1000;
                            const nickname = `${baseSlug}-${randomNum}`;
                            const newUserName = authUser.displayName || 'Новий Артист';
                            await setDoc(userRef, {
                                uid: authUser.uid,
                                displayName: newUserName,
                                displayName_lowercase: newUserName.toLowerCase(),
                                email: authUser.email,
                                photoURL: authUser.photoURL || null,
                                nickname,
                                followers: [],
                                following: [],
                                likedTracks: [],
                                createdAt: serverTimestamp(),
                                chatFolders: [],
                                subscribedPackIds: []
                            });
                        }
                    } catch (e) {
                        console.error('[UserContext] initial user doc check failed:', e);
                    }

                    userDocUnsubscribe = onSnapshot(userRef, async (userDoc) => {
                        diag('UserContext: onSnapshot fired — user doc changed');
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            setUser({
                                uid: authUser.uid,
                                // emailVerified comes from Firebase Auth, NOT Firestore
                                emailVerified: authUser.emailVerified,
                                ...userData,
                                chatFolders: userData.chatFolders || [],
                                subscribedPackIds: userData.subscribedPackIds || []
                            });
                            await fetchAndCacheUserEmojiPacks(authUser.uid);
                        } else {
                            // Doc missing — transient network issue. Do NOT recreate it
                            // here; that would wipe all user data with empty defaults.
                            console.warn('[UserContext] onSnapshot: user doc missing — ignoring to prevent data loss');
                        }
                        setAuthLoading(false);
                    });
                })();

            } else {
                setUser(null);
                setAuthLoading(false);
            }
        });

        return () => {
            if (userDocUnsubscribe) userDocUnsubscribe();
            authUnsubscribe();
        };
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

    const value = React.useMemo(() => ({
        user, setUser, authLoading, refreshUser, refreshEmailVerified,
        totalUnreadMessages, unreadNotificationsCount
    }), [user, authLoading, totalUnreadMessages, unreadNotificationsCount]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);