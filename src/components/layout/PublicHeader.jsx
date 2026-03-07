import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import './PublicHeader.css';

const LEGAL_PATHS = ['/terms', '/privacy', '/copyright', '/guidelines'];

export default function PublicHeader() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const { t } = useLanguage();

    const NAV_LINKS = [
        { label: t('nav.feed'), to: '/' },
        { label: t('nav.music'), to: '/search' },
        { label: t('nav.forArtists'), to: '/upload' },
        { label: t('nav.about'), to: '/about', soon: true },
    ];

    const isLegalPage = LEGAL_PATHS.includes(location.pathname);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => { setMenuOpen(false); }, [location.pathname]);

    return (
        <header className={`ph-root ${scrolled ? 'ph-scrolled' : ''}`}>
            <div className="ph-inner">

                {/* ── Logo ── */}
                <Link to="/" className="ph-logo" aria-label={t('nav.home')}>
                    <span className="ph-logo-icon" aria-hidden="true">🧶</span>
                    <span className="ph-logo-text">
                        <span className="ph-logo-k">K</span>nitly
                    </span>
                    <span className="ph-logo-badge">beta</span>
                </Link>

                {/* ── Desktop nav ── */}
                <nav className="ph-nav" aria-label="Main Navigation">
                    {NAV_LINKS.map(({ label, to, soon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`ph-nav-link ${location.pathname === to ? 'ph-nav-active' : ''} ${soon ? 'ph-nav-soon' : ''}`}
                        >
                            {label}
                            {soon && <span className="ph-nav-soon-tag">{t('nav.soon')}</span>}
                        </Link>
                    ))}
                    {isLegalPage && (
                        <span className="ph-nav-link ph-nav-active ph-nav-legal-indicator">
                            {t('nav.legal')}
                        </span>
                    )}
                </nav>

                {/* ── CTA buttons & Language ── */}
                <div className="ph-cta">
                    <LanguageSwitcher />
                    <Link to="/login" className="ph-btn-ghost">{t('nav.login')}</Link>
                    <Link to="/register" className="ph-btn-primary">
                        {t('nav.register')}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" style={{ marginLeft: 6 }}>
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* ── Hamburger ── */}
                <button
                    className={`ph-hamburger ${menuOpen ? 'ph-hamburger-open' : ''}`}
                    onClick={() => setMenuOpen(v => !v)}
                    aria-label={menuOpen ? 'Close Menu' : 'Open Menu'}
                    aria-expanded={menuOpen}
                >
                    <span /><span /><span />
                </button>
            </div>

            {/* ── Mobile drawer ── */}
            <div className={`ph-mobile-drawer ${menuOpen ? 'ph-mobile-drawer-open' : ''}`}>
                <nav className="ph-mobile-nav">
                    {NAV_LINKS.map(({ label, to, soon }) => (
                        <Link key={to} to={to} className="ph-mobile-link">
                            {label}
                            {soon && <span className="ph-nav-soon-tag">{t('nav.soon')}</span>}
                        </Link>
                    ))}
                </nav>
                <div className="ph-mobile-cta">
                    <div className="ph-mobile-lang">
                        <LanguageSwitcher />
                    </div>
                    <Link to="/login" className="ph-btn-ghost ph-btn-full">{t('nav.login')}</Link>
                    <Link to="/register" className="ph-btn-primary ph-btn-full">{t('nav.register')} →</Link>
                </div>
            </div>
        </header>
    );
}
