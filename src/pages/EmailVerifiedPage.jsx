import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import './EmailVerifiedPage.css';

/**
 * EmailVerifiedPage — shown after user clicks the email verification link.
 * Firebase redirects here via continueUrl.
 * Reloads Firebase Auth token so emailVerified becomes true in context,
 * then auto-redirects to home after 3s.
 */
const EmailVerifiedPage = () => {
    const navigate = useNavigate();
    const { refreshEmailVerified } = useUserContext();

    useEffect(() => {
        // Reload Firebase Auth so emailVerified = true propagates to context
        refreshEmailVerified?.();

        // Auto-redirect to home after 3.5s
        const timer = setTimeout(() => navigate('/'), 3500);
        return () => clearTimeout(timer);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="evp-page">
            <div className="evp-card">
                {/* Animated checkmark */}
                <div className="evp-check-wrap">
                    <svg className="evp-check-svg" viewBox="0 0 52 52" fill="none">
                        <circle className="evp-check-circle" cx="26" cy="26" r="24" />
                        <path className="evp-check-mark" d="M14 27l9 9 15-18" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                <h1 className="evp-title">Пошту підтверджено!</h1>
                <p className="evp-sub">
                    Твій акаунт тепер повністю активовано.<br />
                    Переходимо на головну…
                </p>

                <div className="evp-progress">
                    <div className="evp-progress-fill" />
                </div>

                <button className="evp-btn" onClick={() => navigate('/')}>
                    На головну
                </button>
            </div>

            {/* Background blobs */}
            <div className="evp-blob evp-blob--1" aria-hidden="true" />
            <div className="evp-blob evp-blob--2" aria-hidden="true" />
        </div>
    );
};

export default EmailVerifiedPage;
