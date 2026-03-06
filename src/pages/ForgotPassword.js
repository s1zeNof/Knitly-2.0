import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Link, useNavigate } from 'react-router-dom';
import knitlyLogo from '../img/Knitly-Logo.svg';
import './Auth.css';

const ArrowLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);

const MailIcon = () => (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setError('');
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email.trim());
            setSent(true);
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                // Don't reveal whether email exists — security best practice
                setSent(true);
            } else if (err.code === 'auth/invalid-email') {
                setError('Невірний формат електронної пошти.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Забагато спроб. Зачекайте кілька хвилин і спробуйте знову.');
            } else {
                setError('Сталася помилка. Спробуйте ще раз.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-fullscreen">
            {/* LEFT: Branding panel */}
            <div className="auth-brand-panel">
                <div className="auth-brand-content">
                    <img src={knitlyLogo} alt="Knitly" className="auth-brand-logo-img" />
                    <p className="auth-brand-tagline">
                        Творіть.<br />
                        Діліться.<br />
                        Відкривайте.
                    </p>
                    <div className="auth-bars">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="auth-bar" />
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: Form panel */}
            <div className="auth-form-panel">
                <button className="auth-back-btn" onClick={() => navigate('/login')}>
                    <ArrowLeftIcon />
                    <span>Назад до входу</span>
                </button>

                <div className="auth-form-inner">
                    {/* Mobile logo */}
                    <div className="auth-mobile-logo">
                        <img src={knitlyLogo} alt="Knitly" />
                    </div>

                    {!sent ? (
                        <>
                            <h1 className="auth-title">Відновлення пароля</h1>
                            <p className="auth-subtitle">
                                Введіть свою електронну пошту — ми надішлемо посилання для скидання пароля.
                            </p>

                            {error && <div className="auth-error-banner">{error}</div>}

                            <form onSubmit={handleSubmit} className="auth-form">
                                <div className="auth-input-group">
                                    <label htmlFor="reset-email">Електронна пошта</label>
                                    <input
                                        id="reset-email"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="example@mail.com"
                                        autoComplete="email"
                                        required
                                        autoFocus
                                        disabled={isLoading}
                                    />
                                </div>
                                <button type="submit" className="auth-submit-btn" disabled={isLoading || !email.trim()}>
                                    {isLoading ? 'Надсилання...' : 'Надіслати посилання'}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Success state */
                        <div className="fp-success-state">
                            <div className="fp-success-icon">
                                <MailIcon />
                            </div>
                            <h1 className="auth-title">Перевірте пошту</h1>
                            <p className="auth-subtitle">
                                Якщо акаунт з адресою <strong>{email}</strong> існує —
                                ми надіслали лист з посиланням для скидання пароля.
                                Перевірте також папку «Спам».
                            </p>
                            <button
                                className="auth-submit-btn"
                                onClick={() => { setSent(false); setEmail(''); }}
                                style={{ marginTop: '8px' }}
                            >
                                Надіслати знову
                            </button>
                        </div>
                    )}

                    <p className="auth-switch" style={{ marginTop: '24px' }}>
                        Згадали пароль?{' '}
                        <Link to="/login">Увійти</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
