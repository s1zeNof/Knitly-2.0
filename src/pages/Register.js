import React, { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const GoogleIcon = () => (
    <svg viewBox="0 0 48 48" width="20" height="20">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.999,36.526,44,30.861,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

const Register = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Паролі не співпадають.');
            return;
        }
        if (!termsAccepted) {
            setError('Будь ласка, прийміть Умови використання, щоб продовжити.');
            return;
        }

        setIsLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // marketingConsent can be stored in user profile later
            navigate('/');
        } catch (err) {
            console.error('Registration error:', err.code);
            if (err.code === 'auth/email-already-in-use') {
                setError('Ця електронна пошта вже використовується.');
            } else if (err.code === 'auth/weak-password') {
                setError('Пароль занадто слабкий. Мінімум 6 символів.');
            } else {
                setError('Не вдалося зареєструватися. Спробуйте ще раз.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        setError('');
        setIsLoading(true);
        try {
            await signInWithPopup(auth, provider);
            navigate('/');
        } catch (err) {
            console.error('Google sign-in error:', err.code);
            if (err.code !== 'auth/popup-closed-by-user') {
                setError('Не вдалося увійти через Google. Спробуйте ще раз.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-fullscreen">

            {/* ── LEFT: Branding panel ── */}
            <div className="auth-brand-panel">
                <div className="auth-brand-content">
                    <div className="auth-brand-logo">Knitly</div>
                    <p className="auth-brand-tagline">
                        Твоя музична<br />
                        спільнота чекає.
                    </p>

                    {/* Animated equalizer */}
                    <div className="auth-bars">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="auth-bar" />
                        ))}
                    </div>

                    <div className="auth-brand-features">
                        <div className="auth-brand-feature">
                            <div className="auth-brand-feature-dot" />
                            <span>Безкоштовний акаунт назавжди</span>
                        </div>
                        <div className="auth-brand-feature">
                            <div className="auth-brand-feature-dot" />
                            <span>Завантажуйте необмежено треків</span>
                        </div>
                        <div className="auth-brand-feature">
                            <div className="auth-brand-feature-dot" />
                            <span>Знаходьте та підтримуйте авторів</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Form panel ── */}
            <div className="auth-form-panel">
                <div className="auth-form-inner">
                    {/* Mobile-only logo */}
                    <div className="auth-mobile-logo">Knitly</div>

                    <h1 className="auth-title">Приєднатись до Knitly</h1>
                    <p className="auth-subtitle">Безкоштовно. Назавжди.</p>

                    {error && <div className="auth-error-banner">{error}</div>}

                    {/* Google */}
                    <button
                        className="auth-google-btn"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                    >
                        <GoogleIcon />
                        Зареєструватись з Google
                    </button>

                    <div className="auth-divider"><span>або</span></div>

                    {/* Registration form */}
                    <form onSubmit={handleRegister} className="auth-form">
                        <div className="auth-input-group">
                            <label htmlFor="reg-email">Електронна пошта</label>
                            <input
                                id="reg-email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="example@mail.com"
                                autoComplete="email"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="auth-input-group">
                            <label htmlFor="reg-password">Пароль</label>
                            <input
                                id="reg-password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Мінімум 6 символів"
                                autoComplete="new-password"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="auth-input-group">
                            <label htmlFor="reg-confirm">Підтвердіть пароль</label>
                            <input
                                id="reg-confirm"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Повторіть пароль"
                                autoComplete="new-password"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* ── Consent section ── */}
                        <div className="auth-consent">
                            <label className="auth-consent-label">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={e => setTermsAccepted(e.target.checked)}
                                    disabled={isLoading}
                                />
                                <span>
                                    Я погоджуюся з{' '}
                                    <a href="/terms" target="_blank" rel="noopener noreferrer">
                                        Умовами використання
                                    </a>{' '}
                                    та{' '}
                                    <a href="/privacy" target="_blank" rel="noopener noreferrer">
                                        Політикою конфіденційності
                                    </a>{' '}
                                    Knitly. <strong style={{ color: 'rgba(255,255,255,0.55)' }}>Обов'язково</strong>
                                </span>
                            </label>

                            <label className="auth-consent-label">
                                <input
                                    type="checkbox"
                                    checked={marketingConsent}
                                    onChange={e => setMarketingConsent(e.target.checked)}
                                    disabled={isLoading}
                                />
                                <span>
                                    Я хочу отримувати новини, оновлення та пропозиції від Knitly на свою електронну пошту. Ви можете відписатися будь-коли.
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={isLoading}
                            style={{ marginTop: '0.5rem' }}
                        >
                            {isLoading ? 'Створення акаунту...' : 'Створити акаунт'}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Вже маєте акаунт?{' '}
                        <Link to="/login">Увійти</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
