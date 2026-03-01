import React, { useState, useEffect, useCallback } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import knitlyLogo from '../img/Knitly-Logo.svg';
import './Auth.css';

/* ---- Icons ---- */
const GoogleIcon = () => (
    <svg viewBox="0 0 48 48" width="20" height="20">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.999,36.526,44,30.861,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);
const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const XIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const EyeOnIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
);
const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const NICK_RE = /^[a-z0-9_.]+$/;

const Register = () => {
    const navigate = useNavigate();

    /* ── step machine ── */
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    /* ── step 1 ── */
    const [email, setEmail] = useState('');

    /* ── step 2 ── */
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [pwdTouched, setPwdTouched] = useState(false);

    /* ── step 3 ── */
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [nickname, setNickname] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [nickStatus, setNickStatus] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);

    /* ── password validation ── */
    const pwdCheck = {
        hasLetter: /[a-zA-Zа-яА-ЯёЁіІїЇєЄ]/.test(password),
        hasNumberOrSpecial: /[0-9#?!&@$%^*()_+=\-]/.test(password),
        hasLength: password.length >= 10,
    };
    const pwdValid = pwdCheck.hasLetter && pwdCheck.hasNumberOrSpecial && pwdCheck.hasLength;
    const pwdMatch = password === confirmPassword && confirmPassword.length > 0;

    /* ── nickname availability (debounced 600ms) ── */
    const nickFormatOk = nickname.length >= 3 && nickname.length <= 20 && NICK_RE.test(nickname);

    const checkNickname = useCallback(async (value) => {
        if (!value || !NICK_RE.test(value) || value.length < 3) {
            setNickStatus(value.length > 0 ? 'invalid' : null);
            return;
        }
        setNickStatus('checking');
        try {
            const snap = await getDocs(query(collection(db, 'users'), where('nickname', '==', value)));
            setNickStatus(snap.empty ? 'available' : 'taken');
        } catch {
            setNickStatus(null);
        }
    }, []);

    useEffect(() => {
        if (!nickname) { setNickStatus(null); return; }
        const t = setTimeout(() => checkNickname(nickname), 600);
        return () => clearTimeout(t);
    }, [nickname, checkNickname]);

    /* ── handlers ── */
    const goStep1 = (e) => {
        e.preventDefault();
        setError('');
        setStep(2);
    };

    const goStep2 = (e) => {
        e.preventDefault();
        if (!pwdValid) { setError('Пароль не відповідає вимогам безпеки.'); return; }
        if (!pwdMatch) { setError('Паролі не співпадають.'); return; }
        setError('');
        setStep(3);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (!firstName.trim()) { setError("Введіть ваше ім'я."); return; }
        if (!nickFormatOk || nickStatus !== 'available') { setError('Оберіть доступний нікнейм.'); return; }
        if (!termsAccepted) { setError('Прийміть Умови використання, щоб продовжити.'); return; }

        setIsLoading(true);
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const uid = cred.user.uid;
            const displayName = lastName.trim()
                ? `${firstName.trim()} ${lastName.trim()}`
                : firstName.trim();

            await setDoc(doc(db, 'users', uid), {
                uid,
                email,
                firstName: firstName.trim(),
                lastName: lastName.trim() || '',
                displayName,
                displayName_lowercase: displayName.toLowerCase(),
                nickname,
                birthDate: birthDate || '',
                photoURL: null,
                followers: [],
                following: [],
                likedTracks: [],
                createdAt: serverTimestamp(),
                chatFolders: [],
                subscribedPackIds: [],
                marketingConsent,
            });

            navigate('/');
        } catch (err) {
            console.error('Registration error:', err.code);
            if (err.code === 'auth/email-already-in-use') {
                setError('Ця адреса вже використовується. Спробуйте увійти.');
                setStep(1);
            } else {
                setError('Не вдалося зареєструватися. Спробуйте ще раз.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError('');
        setIsLoading(true);
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
            navigate('/');
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError('Не вдалося увійти через Google. Спробуйте ще раз.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const back = () => { setStep(s => s - 1); setError(''); };

    /* ── step config ── */
    const stepConfig = [
        { title: 'Приєднатись до Knitly', subtitle: 'Введіть вашу електронну пошту.' },
        { title: 'Придумайте пароль', subtitle: email },
        { title: 'Розкажіть про себе', subtitle: 'Майже готово!' },
    ];

    /* ── step renders ── */
    const renderStep1 = () => (
        <form onSubmit={goStep1} className="auth-form">
            <div className="auth-input-group">
                <label htmlFor="reg-email">Електронна пошта</label>
                <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    autoComplete="email"
                    autoFocus
                    required
                    disabled={isLoading}
                />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                Продовжити
            </button>
        </form>
    );

    const renderStep2 = () => (
        <form onSubmit={goStep2} className="auth-form">
            <div className="auth-input-group">
                <label>Пароль</label>
                <div className="auth-password-wrapper">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setPwdTouched(true); }}
                        placeholder="Придумайте пароль"
                        autoComplete="new-password"
                        autoFocus
                        required
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(v => !v)}
                        tabIndex={-1}
                        aria-label="Показати/приховати пароль"
                    >
                        {showPassword ? <EyeOffIcon /> : <EyeOnIcon />}
                    </button>
                </div>
            </div>

            {/* Password checklist */}
            <div className="auth-pwd-checklist">
                <p className="auth-pwd-title">Пароль має містити принаймні:</p>
                {[
                    { key: 'letter', label: '1 літеру', ok: pwdCheck.hasLetter },
                    { key: 'num', label: '1 цифру або спеціальний символ (# ? ! &)', ok: pwdCheck.hasNumberOrSpecial },
                    { key: 'len', label: '10 символів', ok: pwdCheck.hasLength },
                ].map(({ key, label, ok }) => (
                    <div key={key} className={`auth-pwd-item${pwdTouched ? (ok ? ' valid' : ' invalid') : ''}`}>
                        {pwdTouched ? (ok ? <CheckIcon /> : <XIcon />) : <span className="auth-pwd-dot" />}
                        <span>{label}</span>
                    </div>
                ))}
            </div>

            <div className="auth-input-group">
                <label>Підтвердіть пароль</label>
                <div className="auth-password-wrapper">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Повторіть пароль"
                        autoComplete="new-password"
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>

            <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading || !pwdValid || !pwdMatch}
            >
                Продовжити
            </button>
        </form>
    );

    const renderStep3 = () => (
        <form onSubmit={handleRegister} className="auth-form">
            <div className="auth-row-2col">
                <div className="auth-input-group">
                    <label>Ім&apos;я</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Ім'я"
                        autoFocus
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="auth-input-group">
                    <label>Прізвище <span className="auth-optional">необов&apos;язково</span></label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Прізвище"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="auth-input-group">
                <label>Нікнейм</label>
                <div className="auth-nickname-wrapper">
                    <input
                        type="text"
                        value={nickname}
                        onChange={e => setNickname(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                        placeholder="your_nickname"
                        maxLength={20}
                        disabled={isLoading}
                    />
                    <div className="auth-nick-indicator">
                        {nickStatus === 'checking' && <span className="auth-nick-loading" />}
                        {nickStatus === 'available' && <span className="auth-nick-ok"><CheckIcon /></span>}
                        {(nickStatus === 'taken' || nickStatus === 'invalid') && (
                            <span className="auth-nick-err"><XIcon /></span>
                        )}
                    </div>
                </div>
                <span className={`auth-input-hint ${nickStatus || ''}`}>
                    {nickStatus === 'available' && 'Нікнейм доступний ✓'}
                    {nickStatus === 'taken' && 'Цей нікнейм вже зайнятий'}
                    {nickStatus === 'invalid' && 'Від 3 до 20 символів: a–z, 0–9, _ та .'}
                    {!nickStatus && 'Від 3 до 20 символів: a–z, 0–9, _ та .'}
                </span>
            </div>

            <div className="auth-input-group">
                <label>Дата народження <span className="auth-optional">необов&apos;язково</span></label>
                <input
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    disabled={isLoading}
                />
            </div>

            {/* Consent */}
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
                        <a href="/terms" target="_blank" rel="noopener noreferrer">Умовами використання</a>{' '}
                        та{' '}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer">Політикою конфіденційності</a>{' '}
                        Knitly.{' '}
                        <strong style={{ color: 'rgba(255,255,255,0.55)' }}>Обов&apos;язково</strong>
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
                        Я хочу отримувати новини та пропозиції від Knitly на свою електронну пошту. Ви можете відписатися будь-коли.
                    </span>
                </label>
            </div>

            <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading || !firstName.trim() || nickStatus !== 'available' || !termsAccepted}
                style={{ marginTop: '0.5rem' }}
            >
                {isLoading ? 'Створення акаунту...' : 'Створити акаунт'}
            </button>
        </form>
    );

    return (
        <div className="auth-fullscreen">

            {/* ── LEFT: Branding panel ── */}
            <div className="auth-brand-panel">
                <div className="auth-brand-content">
                    <img src={knitlyLogo} alt="Knitly" className="auth-brand-logo-img" />
                    <p className="auth-brand-tagline">
                        Твоя музична<br />
                        спільнота чекає.
                    </p>
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
                    {/* Mobile logo */}
                    <div className="auth-mobile-logo">
                        <img src={knitlyLogo} alt="Knitly" />
                    </div>

                    {/* Step progress dots */}
                    <div className="auth-steps">
                        {[1, 2, 3].map((n, i) => (
                            <React.Fragment key={n}>
                                <div className={`auth-step-dot${step === n ? ' active' : step > n ? ' done' : ''}`} />
                                {i < 2 && <div className={`auth-step-line${step > n ? ' done' : ''}`} />}
                            </React.Fragment>
                        ))}
                    </div>

                    <h1 className="auth-title">{stepConfig[step - 1].title}</h1>
                    <p className="auth-subtitle">{stepConfig[step - 1].subtitle}</p>

                    {error && <div className="auth-error-banner">{error}</div>}

                    {/* Google only on step 1 */}
                    {step === 1 && (
                        <>
                            <button className="auth-google-btn" onClick={handleGoogle} disabled={isLoading}>
                                <GoogleIcon />
                                Зареєструватись з Google
                            </button>
                            <div className="auth-divider"><span>або</span></div>
                        </>
                    )}

                    {/* Back arrow between steps */}
                    {step > 1 && (
                        <button type="button" className="auth-step-back" onClick={back}>
                            ← Назад
                        </button>
                    )}

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}

                    {step === 1 && (
                        <p className="auth-switch">
                            Вже маєте акаунт?{' '}
                            <Link to="/login">Увійти</Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
