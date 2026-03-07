import React, { useState, useRef }    from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { generateSecret, verifySync }  from 'otplib';
import { QRCodeSVG }                  from 'qrcode.react';
import { auth, db }                   from '../firebase.js';
import { useAdminAuth }               from '../contexts/AdminAuthContext.jsx';

// ── Хелпер: будуємо otpauth:// URI вручну (otplib v13 не має keyuri) ──────────
const buildOtpauthUri = (email, secret) => {
    const issuer  = 'Knitly Admin';
    const account = encodeURIComponent(`${issuer}:${email}`);
    return `otpauth://totp/${account}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
};

// ── Хелпер: верифікація з ±30с допуском ─────────────────────────────────────
const verifyTotp = (token, secret) => {
    const result = verifySync({ secret, type: 'totp', token, window: 1 });
    return !!(result && result.valid);
};

// ── Іконки ────────────────────────────────────────────────────────────────────
const IconShield = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.47-2.34 6.71-6 7.93-3.66-1.22-6-4.46-6-7.93V7.67L12 5z" />
    </svg>
);
const IconLock = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
);
const IconQr = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2zM15 19h2v2h-2zM13 21h2v2h-2z"/>
    </svg>
);
const IconCheck = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
    </svg>
);

// ── Кроки ─────────────────────────────────────────────────────────────────────
const STEP = {
    CREDENTIALS: 'credentials',
    TOTP_VERIFY:  'totp-verify',
    TOTP_ENROLL:  'totp-enroll',
};

function StepBar({ step }) {
    const done = step !== STEP.CREDENTIALS;
    return (
        <div className="login-steps">
            <div className={`login-step ${done ? 'login-step--done' : 'login-step--active'}`}>
                <span className="login-step-num">{done ? <IconCheck /> : '1'}</span>
                <span>Вхід</span>
            </div>
            <div className="login-step-line" />
            <div className="login-step login-step--active">
                <span className="login-step-num">2</span>
                <span>{step === STEP.TOTP_ENROLL ? 'Налаштування 2FA' : 'Підтвердження 2FA'}</span>
            </div>
        </div>
    );
}

// ── Головний компонент ────────────────────────────────────────────────────────
export default function LoginPage() {
    const { confirmTotpVerified } = useAdminAuth();

    const [step,      setStep]      = useState(STEP.CREDENTIALS);
    const [email,     setEmail]     = useState('');
    const [password,  setPassword]  = useState('');
    const [totpCode,  setTotpCode]  = useState('');
    const [error,     setError]     = useState('');
    const [loading,   setLoading]   = useState(false);
    const [qrUrl,     setQrUrl]     = useState('');
    const [secretKey, setSecretKey] = useState('');

    // Зберігаємо secret між кроками (не в state, щоб не потрапив у DevTools/рендер)
    const totpSecretRef = useRef(null);
    // UID поточного юзера для запису в Firestore
    const uidRef = useRef(null);

    // ── Крок 1: email + пароль ───────────────────────────────────────────────
    const handleCredentials = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            uidRef.current = cred.user.uid;

            // Читаємо Firestore для перевірки ролі та стану TOTP
            const snap = await getDoc(doc(db, 'users', cred.user.uid));
            const data = snap.data();

            if (!data?.roles?.includes('admin')) {
                await auth.signOut();
                setError('Доступ заборонено. Цей інструмент тільки для адміністраторів.');
                return;
            }

            if (data?.adminTotp?.enrolled) {
                // TOTP вже налаштовано — переходимо до верифікації
                totpSecretRef.current = data.adminTotp.secret;
                setStep(STEP.TOTP_VERIFY);
            } else {
                // Перший вхід — генеруємо secret та показуємо QR
                const secret     = generateSecret();
                const otpauthUrl = buildOtpauthUri(email, secret);

                totpSecretRef.current = secret;
                setQrUrl(otpauthUrl);
                setSecretKey(secret);
                setStep(STEP.TOTP_ENROLL);
            }

        } catch (err) {
            console.error('[LoginPage]', err.code);
            switch (err.code) {
                case 'auth/invalid-credential':
                case 'auth/wrong-password':
                    setError('Невірний email або пароль.');
                    break;
                case 'auth/user-not-found':
                    setError('Користувача з таким email не знайдено.');
                    break;
                case 'auth/too-many-requests':
                    setError('Забагато спроб. Зачекайте кілька хвилин.');
                    break;
                case 'auth/user-disabled':
                    setError('Цей акаунт заблоковано.');
                    break;
                default:
                    setError(`Помилка входу: ${err.code}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Крок 2a: верифікація TOTP (наступні входи) ──────────────────────────
    const handleTotpVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const isValid = verifyTotp(totpCode.trim(), totpSecretRef.current);

            if (!isValid) {
                setError('Невірний код. Перевірте застосунок та спробуйте знову.');
                setTotpCode('');
                return;
            }

            // Код правильний — відкриваємо доступ до адмінки
            confirmTotpVerified();

        } catch (err) {
            console.error('[LoginPage TOTP verify]', err);
            setError('Помилка верифікації. Спробуйте ще раз.');
        } finally {
            setLoading(false);
        }
    };

    // ── Крок 2b: enrollment TOTP (перший вхід) ──────────────────────────────
    const handleTotpEnroll = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const isValid = verifyTotp(totpCode.trim(), totpSecretRef.current);

            if (!isValid) {
                setError('Невірний код. Перевірте застосунок та спробуйте знову.');
                setTotpCode('');
                return;
            }

            // Код правильний — зберігаємо secret у Firestore
            await updateDoc(doc(db, 'users', uidRef.current), {
                adminTotp: {
                    secret:     totpSecretRef.current,
                    enrolled:   true,
                    enrolledAt: serverTimestamp(),
                },
            });

            // Відкриваємо доступ
            confirmTotpVerified();

        } catch (err) {
            console.error('[LoginPage TOTP enroll]', err);
            setError('Помилка збереження 2FA. Спробуйте ще раз.');
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (e) =>
        setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6));

    const goBack = () => {
        setStep(STEP.CREDENTIALS);
        setError('');
        setTotpCode('');
        auth.signOut().catch(() => {});
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="login-wrap">
            <div className={`login-card${step === STEP.TOTP_ENROLL ? ' login-card--wide' : ''}`}>

                {/* Logo */}
                <div className="login-logo">
                    <span className="login-logo-icon"><IconShield /></span>
                    <div>
                        <h1 className="login-title">Knitly Admin</h1>
                        <p className="login-subtitle">Панель управління платформою</p>
                    </div>
                </div>

                {/* Step indicator */}
                {step !== STEP.CREDENTIALS && <StepBar step={step} />}

                {/* ── STEP 1: Credentials ────────────────────────────────── */}
                {step === STEP.CREDENTIALS && (
                    <form onSubmit={handleCredentials} className="login-form" autoComplete="off">
                        <div className="login-field">
                            <label className="login-label" htmlFor="lp-email">Email</label>
                            <input
                                id="lp-email" type="email" className="login-input"
                                placeholder="admin@knitly.app"
                                value={email} onChange={e => setEmail(e.target.value)}
                                required autoFocus
                            />
                        </div>
                        <div className="login-field">
                            <label className="login-label" htmlFor="lp-pass">Пароль</label>
                            <input
                                id="lp-pass" type="password" className="login-input"
                                placeholder="••••••••"
                                value={password} onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <div className="login-error" role="alert">{error}</div>}
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? <span className="adm-spinner" /> : 'Увійти'}
                        </button>
                    </form>
                )}

                {/* ── STEP 2a: TOTP Verify ───────────────────────────────── */}
                {step === STEP.TOTP_VERIFY && (
                    <form onSubmit={handleTotpVerify} className="login-form">
                        <div className="login-totp-banner">
                            <div className="login-totp-banner-icon"><IconLock /></div>
                            <p className="login-totp-banner-text">
                                Відкрийте Google Authenticator або Authy і введіть поточний 6-значний код
                            </p>
                        </div>
                        <div className="login-field">
                            <label className="login-label" htmlFor="lp-totp">Код підтвердження</label>
                            <input
                                id="lp-totp" type="text" inputMode="numeric" pattern="[0-9]*"
                                className="login-input login-input--code"
                                placeholder="000 000"
                                value={totpCode} onChange={handleCodeChange}
                                maxLength={6} autoFocus autoComplete="one-time-code" required
                            />
                            <span className="login-code-hint">Оновлюється кожні 30 секунд</span>
                        </div>
                        {error && <div className="login-error" role="alert">{error}</div>}
                        <button type="submit" className="login-btn" disabled={loading || totpCode.length < 6}>
                            {loading ? <span className="adm-spinner" /> : 'Підтвердити'}
                        </button>
                        <button type="button" className="login-back-link" onClick={goBack}>
                            ← Повернутися до входу
                        </button>
                    </form>
                )}

                {/* ── STEP 2b: TOTP Enroll ───────────────────────────────── */}
                {step === STEP.TOTP_ENROLL && (
                    <form onSubmit={handleTotpEnroll} className="login-form">
                        <div className="login-enroll-info">
                            <div className="login-totp-banner-icon"><IconQr /></div>
                            <div>
                                <h3 className="login-enroll-title">Налаштування двофакторної автентифікації</h3>
                                <p className="login-enroll-desc">
                                    Відскануйте QR-код у Google Authenticator або Authy,
                                    потім введіть 6-значний код для підтвердження.
                                </p>
                            </div>
                        </div>

                        {/* QR code */}
                        <div className="login-qr-wrap">
                            {qrUrl && (
                                <QRCodeSVG
                                    value={qrUrl}
                                    size={180}
                                    bgColor="transparent"
                                    fgColor="#f4f4f5"
                                    level="M"
                                />
                            )}
                        </div>

                        {/* Manual key entry */}
                        <details className="login-manual-entry">
                            <summary>Ввести ключ вручну</summary>
                            <div className="login-secret-box">
                                <code className="login-secret-key">{secretKey}</code>
                                <span className="login-secret-hint">
                                    Тип: Time-based (TOTP)
                                </span>
                            </div>
                        </details>

                        <div className="login-field">
                            <label className="login-label" htmlFor="lp-enroll">
                                Код із застосунку для підтвердження
                            </label>
                            <input
                                id="lp-enroll" type="text" inputMode="numeric" pattern="[0-9]*"
                                className="login-input login-input--code"
                                placeholder="000 000"
                                value={totpCode} onChange={handleCodeChange}
                                maxLength={6} autoComplete="one-time-code" required
                            />
                        </div>

                        {error && <div className="login-error" role="alert">{error}</div>}

                        <button type="submit" className="login-btn" disabled={loading || totpCode.length < 6}>
                            {loading ? <span className="adm-spinner" /> : 'Активувати 2FA та увійти'}
                        </button>

                        <p className="login-enroll-notice">
                            Збережіть ключ відновлення у безпечному місці.
                            Без застосунку-аутентифікатора ви не зможете увійти.
                        </p>
                    </form>
                )}

                {step === STEP.CREDENTIALS && (
                    <p className="login-footer-note">
                        Доступ лише для авторизованого персоналу Knitly.
                    </p>
                )}
            </div>
        </div>
    );
}
