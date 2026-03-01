import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import knitlyLogo from '../img/Knitly-Logo.svg';
import './Auth.css';

const GoogleIcon = () => (
    <svg viewBox="0 0 48 48" width="20" height="20">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.999,36.526,44,30.861,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const canGoBack = location.state?.canGoBack;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate(canGoBack ? -1 : '/');
        } catch (err) {
            console.error('Login error:', err.code);
            setError('Неправильна електронна пошта або пароль.');
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
            navigate(canGoBack ? -1 : '/');
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
                    <img src={knitlyLogo} alt="Knitly" className="auth-brand-logo-img" />
                    <p className="auth-brand-tagline">
                        Творіть.<br />
                        Діліться.<br />
                        Відкривайте.
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
                            <span>Завантажуйте та діліться треками</span>
                        </div>
                        <div className="auth-brand-feature">
                            <div className="auth-brand-feature-dot" />
                            <span>Підписуйтесь на улюблених авторів</span>
                        </div>
                        <div className="auth-brand-feature">
                            <div className="auth-brand-feature-dot" />
                            <span>Плейлісти, спільноти, пости</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Form panel ── */}
            <div className="auth-form-panel">
                {canGoBack && (
                    <button className="auth-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeftIcon />
                        <span>Назад</span>
                    </button>
                )}

                <div className="auth-form-inner">
                    {/* Mobile-only logo */}
                    <div className="auth-mobile-logo">
                        <img src={knitlyLogo} alt="Knitly" />
                    </div>

                    <h1 className="auth-title">
                        {canGoBack ? 'Додати обліковий запис' : 'Вхід у Knitly'}
                    </h1>
                    <p className="auth-subtitle">
                        {canGoBack
                            ? 'Увійдіть в інший акаунт. Поточний залишиться активним.'
                            : 'Раді бачити вас знову.'}
                    </p>

                    {error && <div className="auth-error-banner">{error}</div>}

                    {/* Google */}
                    <button
                        className="auth-google-btn"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                    >
                        <GoogleIcon />
                        Продовжити з Google
                    </button>

                    <div className="auth-divider"><span>або</span></div>

                    {/* Email + password form */}
                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="auth-input-group">
                            <label htmlFor="login-email">Електронна пошта</label>
                            <input
                                id="login-email"
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
                            <label htmlFor="login-password">Пароль</label>
                            <input
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                            {isLoading ? 'Завантаження...' : 'Увійти'}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Немає акаунту?{' '}
                        <Link to="/register">Зареєструватися</Link>
                    </p>

                    <p className="auth-legal-note">
                        Продовжуючи, ви приймаєте наші{' '}
                        <a href="/terms" target="_blank" rel="noopener noreferrer">Умови використання</a>{' '}
                        та підтверджуєте, що ознайомились з нашою{' '}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer">Політикою конфіденційності</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
