import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, ShieldCheck, Copyright, Users } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import PublicHeader from './PublicHeader';
import SiteFooter from './SiteFooter';
import './LegalLayout.css';

export default function LegalLayout({ children }) {
    const { pathname } = useLocation();
    const { t } = useLanguage();

    const LEGAL_NAV = [
        { to: '/terms', label: t('nav.terms'), Icon: FileText },
        { to: '/privacy', label: t('nav.privacy'), Icon: ShieldCheck },
        { to: '/copyright', label: t('nav.copyrightDmca'), Icon: Copyright },
        { to: '/guidelines', label: t('nav.guidelines'), Icon: Users },
    ];

    // Scroll to top when navigating between legal pages
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [pathname]);

    return (
        <div className="ll-root">
            <PublicHeader />

            <div className="ll-body">
                {/* ── Sidebar nav ── */}
                <aside className="ll-sidebar" aria-label={t('nav.legal')}>
                    <p className="ll-sidebar-label">{t('nav.legal')}</p>
                    <nav>
                        {LEGAL_NAV.map(({ to, label, Icon }) => (
                            <Link
                                key={to}
                                to={to}
                                className={`ll-sidebar-link ${pathname === to ? 'll-sidebar-active' : ''}`}
                            >
                                <Icon className="ll-sidebar-icon" size={15} aria-hidden="true" />
                                {label}
                            </Link>
                        ))}
                    </nav>

                    <div className="ll-sidebar-back">
                        <Link to="/" className="ll-back-link">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                <path d="M19 12H5M12 5l-7 7 7 7" />
                            </svg>
                            {t('nav.backToHome')}
                        </Link>
                    </div>
                </aside>

                {/* ── Main content ── */}
                <main className="ll-main">
                    {children}
                </main>
            </div>

            <SiteFooter />
        </div>
    );
}
