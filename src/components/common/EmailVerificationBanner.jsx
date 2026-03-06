import React, { useState, useEffect } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useUserContext } from '../../contexts/UserContext';
import './EmailVerificationBanner.css';

/**
 * EmailVerificationBanner — compact sticky bar shown at the top of main content
 * when the signed-in user hasn't verified their email yet.
 *
 * - Reads emailVerified from UserContext (comes from Firebase Auth, not Firestore).
 * - Auto-hides the moment the user verifies: listens to visibilitychange so
 *   if they verify in another tab and switch back, the banner disappears.
 * - Passes continueUrl so Firebase redirects back to the app after verification.
 */
const EmailVerificationBanner = ({ user }) => {
    const { refreshEmailVerified } = useUserContext();

    const [dismissed, setDismissed] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    // When user switches back to this tab — reload Firebase Auth token
    // so emailVerified is up to date.
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                refreshEmailVerified?.();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [refreshEmailVerified]);

    // Don't render if email is verified or banner was dismissed
    if (!user || user.emailVerified || dismissed) return null;

    const handleResend = async () => {
        if (sending || sent) return;
        setSending(true);
        setError('');
        try {
            const continueUrl = `${window.location.origin}/email-verified`;
            await sendEmailVerification(auth.currentUser, { url: continueUrl });
            setSent(true);
        } catch (err) {
            if (err.code === 'auth/too-many-requests') {
                setError('Надто багато запитів. Спробуйте пізніше.');
            } else {
                setError('Помилка. Спробуйте ще раз.');
            }
            setTimeout(() => setError(''), 4000);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="evb-bar" role="alert" aria-live="polite">
            <svg className="evb-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
            </svg>

            <span className="evb-text">
                {error
                    ? error
                    : sent
                        ? 'Лист надіслано — перевірте скриньку та папку «Спам»'
                        : <>Підтвердьте пошту <strong>{user.email}</strong></>
                }
            </span>

            {!sent && !error && (
                <button
                    className="evb-btn"
                    onClick={handleResend}
                    disabled={sending}
                    aria-label="Надіслати лист підтвердження"
                >
                    {sending ? 'Надсилаємо…' : 'Надіслати'}
                </button>
            )}

            <button
                className="evb-close"
                onClick={() => setDismissed(true)}
                aria-label="Закрити"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default EmailVerificationBanner;
