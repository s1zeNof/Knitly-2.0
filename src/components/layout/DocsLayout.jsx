import React, { useState, useEffect } from 'react';
import { Link, useLocation }          from 'react-router-dom';
import {
    BookOpen, Key, Gift, Music, Webhook,
    Gauge, Clock, ChevronRight, ExternalLink,
    AlertCircle, Menu, X,
} from 'lucide-react';
import { useLanguage }   from '../../contexts/LanguageContext';
import PublicHeader      from './PublicHeader';
import SiteFooter        from './SiteFooter';
import './DocsLayout.css';

// ─── Sidebar navigation structure ─────────────────────────────────────────────

const DOCS_NAV = [
    {
        groupKey: 'gettingStarted',
        items: [
            { to: '/developers',              labelKey: 'docs.nav.overview',      Icon: BookOpen },
            { to: '/developers/authentication', labelKey: 'docs.nav.auth',        Icon: Key      },
        ],
    },
    {
        groupKey: 'reference',
        items: [
            { to: '/developers/bots',      labelKey: 'docs.nav.bots',      Icon: BookOpen, badge: null },
            { to: '/developers/gifts',     labelKey: 'docs.nav.gifts',     Icon: Gift             },
            { to: '/developers/tracks',    labelKey: 'docs.nav.tracks',    Icon: Music            },
            { to: '/developers/webhooks',  labelKey: 'docs.nav.webhooks',  Icon: Webhook          },
        ],
    },
    {
        groupKey: 'policies',
        items: [
            { to: '/developers/rate-limits', labelKey: 'docs.nav.rateLimits', Icon: Gauge },
        ],
    },
    {
        groupKey: 'updates',
        items: [
            { to: '/developers/changelog', labelKey: 'docs.nav.changelog', Icon: Clock },
        ],
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocsLayout({ children }) {
    const { pathname }          = useLocation();
    const { t }                 = useLanguage();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Close mobile drawer on navigation
    useEffect(() => {
        setDrawerOpen(false);
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [pathname]);

    // Lock body scroll when drawer is open
    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [drawerOpen]);

    const Sidebar = () => (
        <aside className="dl-sidebar" aria-label={t('docs.nav.aria')}>
            {/* API version badge */}
            <div className="dl-sidebar-brand">
                <span className="dl-sidebar-brand-name">Bot API</span>
                <span className="dl-sidebar-version">v1.0</span>
                <span className="dl-sidebar-stable">{t('docs.nav.stable')}</span>
            </div>

            <nav className="dl-sidebar-nav">
                {DOCS_NAV.map(({ groupKey, items }) => (
                    <div key={groupKey} className="dl-nav-group">
                        <p className="dl-nav-group-label">{t(`docs.nav.group.${groupKey}`)}</p>
                        {items.map(({ to, labelKey, Icon, badge }) => {
                            const isActive = pathname === to;
                            return (
                                <Link
                                    key={to}
                                    to={to}
                                    className={`dl-nav-link ${isActive ? 'dl-nav-link--active' : ''}`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <Icon className="dl-nav-icon" size={15} aria-hidden="true" />
                                    <span>{t(labelKey)}</span>
                                    {badge && <span className="dl-nav-badge">{badge}</span>}
                                    {isActive && (
                                        <ChevronRight className="dl-nav-chevron" size={12} aria-hidden="true" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Footer links */}
            <div className="dl-sidebar-footer">
                <a
                    href="https://github.com/knitly"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dl-sidebar-ext-link"
                >
                    <ExternalLink size={13} aria-hidden="true" />
                    {t('docs.nav.github')}
                </a>
                <a
                    href="mailto:developers@knitly.app"
                    className="dl-sidebar-ext-link"
                >
                    <AlertCircle size={13} aria-hidden="true" />
                    {t('docs.nav.reportIssue')}
                </a>
                <Link to="/terms" className="dl-sidebar-ext-link dl-sidebar-ext-link--muted">
                    {t('docs.nav.legal')}
                </Link>
            </div>
        </aside>
    );

    return (
        <div className="dl-root">
            <PublicHeader />

            {/* Mobile toolbar */}
            <div className="dl-mobile-toolbar">
                <button
                    className="dl-mobile-menu-btn"
                    onClick={() => setDrawerOpen(true)}
                    aria-label={t('docs.nav.openMenu')}
                >
                    <Menu size={20} />
                </button>
                <span className="dl-mobile-title">Bot API v1.0</span>
            </div>

            {/* Mobile drawer */}
            {drawerOpen && (
                <div className="dl-drawer-overlay" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
            )}
            <div className={`dl-drawer ${drawerOpen ? 'dl-drawer--open' : ''}`} aria-hidden={!drawerOpen}>
                <button
                    className="dl-drawer-close"
                    onClick={() => setDrawerOpen(false)}
                    aria-label={t('docs.nav.closeMenu')}
                >
                    <X size={20} />
                </button>
                <Sidebar />
            </div>

            {/* Main layout */}
            <div className="dl-body">
                <Sidebar />
                <main className="dl-main" id="main-content">
                    {children}
                </main>
            </div>

            <SiteFooter />
        </div>
    );
}
