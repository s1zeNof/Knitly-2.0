import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './GuestPrompt.css';

/* Pages where GuestPrompt should NOT appear */
const HIDDEN_PATHS = new Set(['/login', '/register']);
const POPUP_DELAY_MS = 20000; // 20 seconds

const GuestPrompt = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showPopup, setShowPopup] = useState(false);
    const [popupDismissed, setPopupDismissed] = useState(false);

    const isHiddenPage = HIDDEN_PATHS.has(location.pathname);

    useEffect(() => {
        if (isHiddenPage || popupDismissed) return;
        const timer = setTimeout(() => setShowPopup(true), POPUP_DELAY_MS);
        return () => clearTimeout(timer);
    }, [isHiddenPage, popupDismissed]);

    // Reset popup timer when navigating to a new page
    useEffect(() => {
        if (popupDismissed) return;
        setShowPopup(false);
        if (isHiddenPage) return;
        const timer = setTimeout(() => setShowPopup(true), POPUP_DELAY_MS);
        return () => clearTimeout(timer);
    }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDismissPopup = () => {
        setShowPopup(false);
        setPopupDismissed(true);
    };

    if (isHiddenPage) return null;

    return (
        <>
            {/* ── Bottom banner (always visible) ── */}
            <div className="guest-banner">
                <div className="guest-banner-content">
                    <div className="guest-banner-text">
                        <span className="guest-banner-title">Не пропусти нічого на Knitly</span>
                        <span className="guest-banner-sub">Слухай музику, стежи за виконавцями та спілкуйся</span>
                    </div>
                    <div className="guest-banner-actions">
                        <button className="guest-btn-login" onClick={() => navigate('/login')}>Увійти</button>
                        <button className="guest-btn-signup" onClick={() => navigate('/register')}>Реєстрація</button>
                    </div>
                </div>
            </div>

            {/* ── 20-second popup ── */}
            {showPopup && (
                <div className="guest-popup-overlay" onClick={handleDismissPopup}>
                    <div className="guest-popup" onClick={e => e.stopPropagation()}>
                        <button className="guest-popup-close" onClick={handleDismissPopup} aria-label="Закрити">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>

                        {/* Decorative equalizer icon */}
                        <div className="guest-popup-icon">
                            <div className="guest-eq-bar" />
                            <div className="guest-eq-bar" />
                            <div className="guest-eq-bar" />
                            <div className="guest-eq-bar" />
                            <div className="guest-eq-bar" />
                        </div>

                        <h2 className="guest-popup-title">Продовж відкривати Knitly</h2>
                        <p className="guest-popup-desc">
                            Реєструйся, щоб слухати музику без обмежень, підписуватись на виконавців, залишати коментарі та багато іншого.
                        </p>

                        <div className="guest-popup-actions">
                            <button className="guest-popup-signup" onClick={() => navigate('/register')}>
                                Створити акаунт
                            </button>
                            <button className="guest-popup-login" onClick={() => navigate('/login')}>
                                Вже маю акаунт
                            </button>
                        </div>

                        <p className="guest-popup-terms">
                            Реєструючись, ти погоджуєшся з нашими{' '}
                            <span className="guest-popup-link">Умовами</span> та{' '}
                            <span className="guest-popup-link">Політикою конфіденційності</span>.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default GuestPrompt;
