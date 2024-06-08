import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Виправлено: Додано імпорт setDoc

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [followingCount, setFollowingCount] = useState(0); // Додаємо стан для відстеження кількості підписок

    const refreshUser = async () => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUser({ ...user, ...userData });
                // Оновлюємо стан кількості підписок
                setFollowingCount(userData.following ? userData.following.length : 0);
            }
        }
        
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                const userRef = doc(db, 'users', authUser.uid);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser({ ...userData, uid: authUser.uid });
                    // Оновлюємо стан кількості підписок
                    setFollowingCount(userData.following ? userData.following.length : 0);
                } else {
                    // Якщо користувача немає в Firestore, створюємо новий документ
                    await setDoc(userRef, {
                        uid: authUser.uid,
                        displayName: authUser.displayName,
                        email: authUser.email,
                        photoURL: authUser.photoURL,
                        following: [], // Починаємо з порожнього масиву
                    });
                    setUser({
                        uid: authUser.uid,
                        displayName: authUser.displayName,
                        email: authUser.email,
                        photoURL: authUser.photoURL,
                        following: [],
                    });
                    setFollowingCount(0);
                }
            } else {
                setUser(null);
                setFollowingCount(0);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, refreshUser, followingCount }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);
