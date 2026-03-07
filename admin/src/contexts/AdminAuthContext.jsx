import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc }                from 'firebase/firestore';
import { auth, db }                   from '../firebase.js';

// sessionStorage-ключ: зберігає UID після успішного TOTP.
// Очищається при закритті вкладки або logout.
const TOTP_SESSION_KEY = 'knitly_admin_totp_ok';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
    const [adminUser,    setAdminUser]    = useState(null);
    const [pendingAdmin, setPendingAdmin] = useState(null); // адмін, але TOTP ще не пройдено
    const [authLoading,  setAuthLoading]  = useState(true);

    const pendingRef = useRef(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            // Юзер вийшов — очищаємо все
            if (!firebaseUser) {
                sessionStorage.removeItem(TOTP_SESSION_KEY);
                pendingRef.current = null;
                setPendingAdmin(null);
                setAdminUser(null);
                setAuthLoading(false);
                return;
            }

            try {
                const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
                const data = snap.data();

                if (!data?.roles?.includes('admin')) {
                    // Залогінений, але не адмін — виходимо
                    await signOut(auth);
                    sessionStorage.removeItem(TOTP_SESSION_KEY);
                    pendingRef.current = null;
                    setPendingAdmin(null);
                    setAdminUser(null);
                    setAuthLoading(false);
                    return;
                }

                const userData = { uid: firebaseUser.uid, email: firebaseUser.email, ...data };

                // Перевіряємо: чи вже був підтверджений TOTP у цій сесії?
                // (onAuthStateChanged може повторно спрацювати при refresh токена —
                //  без цієї перевірки юзера б викидало на логін кожного разу)
                const totpVerified = sessionStorage.getItem(TOTP_SESSION_KEY) === firebaseUser.uid;

                if (totpVerified) {
                    // TOTP вже пройдено в цій сесії — одразу пускаємо
                    setAdminUser(userData);
                    setPendingAdmin(null);
                    pendingRef.current = null;
                } else {
                    // Потрібно пройти TOTP (enrollment або verification)
                    pendingRef.current = userData;
                    setPendingAdmin(userData);
                    setAdminUser(null);
                }

            } catch {
                pendingRef.current = null;
                setPendingAdmin(null);
                setAdminUser(null);
            } finally {
                setAuthLoading(false);
            }
        });

        return unsub;
    }, []);

    /**
     * LoginPage викликає цю функцію після успішної верифікації або enrollment TOTP.
     * Зберігаємо UID в sessionStorage → захист від повторних onAuthStateChanged.
     */
    const confirmTotpVerified = useCallback(() => {
        const data = pendingRef.current;
        if (data) {
            sessionStorage.setItem(TOTP_SESSION_KEY, data.uid);
            setAdminUser(data);
            setPendingAdmin(null);
            pendingRef.current = null;
        }
    }, []);

    const logout = () => {
        sessionStorage.removeItem(TOTP_SESSION_KEY);
        pendingRef.current = null;
        setPendingAdmin(null);
        setAdminUser(null);
        signOut(auth);
    };

    return (
        <AdminAuthContext.Provider value={{ adminUser, pendingAdmin, authLoading, logout, confirmTotpVerified }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
