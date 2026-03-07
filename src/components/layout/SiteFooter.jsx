import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import './SiteFooter.css';

const SOCIAL_LINKS = [
    {
        label: 'Instagram',
        href: 'https://instagram.com/',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
        ),
    },
    {
        label: 'Twitter / X',
        href: 'https://twitter.com/',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        label: 'TikTok',
        href: 'https://tiktok.com/',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.24 8.24 0 0 0 4.82 1.54V6.78a4.85 4.85 0 0 1-1.05-.09z" />
            </svg>
        ),
    },
    {
        label: 'Telegram',
        href: 'https://t.me/',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
        ),
    },
];

export default function SiteFooter() {
    const year = new Date().getFullYear();
    const { t } = useLanguage();

    const FOOTER_COLUMNS = [
        {
            heading: t('footer.product'),
            links: [
                { label: t('nav.feed'), to: '/' },
                { label: t('footer.nav.search'), to: '/search' },
                { label: t('footer.nav.upload'), to: '/upload' },
                { label: t('footer.nav.playlists'), to: '/', soon: true },
                { label: t('nav.forArtists'), to: '/studio' },
                { label: t('footer.nav.gifts'), to: '/gifts' },
                { label: t('footer.nav.apps'), to: '/apps' },
            ],
        },
        {
            heading: t('footer.legal'),
            links: [
                { label: t('nav.terms'), to: '/terms' },
                { label: t('nav.privacy'), to: '/privacy' },
                { label: t('nav.copyrightDmca'), to: '/copyright' },
                { label: t('nav.guidelines'), to: '/guidelines' },
                { label: t('footer.nav.cookies'), to: '/privacy#cookies' },
            ],
        },
        {
            heading: t('footer.company'),
            links: [
                { label: t('footer.nav.about'), to: '/about', soon: true },
                { label: t('footer.nav.blog'), to: '/blog', soon: true },
                { label: t('footer.nav.careers'), to: '/careers', soon: true },
                { label: t('footer.nav.contact'), to: '/contact', soon: true },
                { label: t('footer.nav.help'), to: '/help', soon: true },
            ],
        },
    ];

    return (
        <footer className="sf-root">
            {/* ── Top divider ── */}
            <div className="sf-divider" aria-hidden="true" />

            <div className="sf-inner">

                {/* ── Brand column ── */}
                <div className="sf-brand">
                    <Link to="/" className="sf-logo" aria-label={t('nav.home')}>
                        <span className="sf-logo-icon">🧶</span>
                        <span className="sf-logo-text">
                            <span className="sf-logo-k">K</span>nitly
                        </span>
                    </Link>
                    <p className="sf-tagline">
                        {t('footer.tagline').split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                                {line}<br />
                            </React.Fragment>
                        ))}
                    </p>

                    {/* Social icons */}
                    <div className="sf-social" role="list">
                        {SOCIAL_LINKS.map(({ label, href, icon }) => (
                            <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sf-social-link"
                                aria-label={label}
                                role="listitem"
                            >
                                {icon}
                            </a>
                        ))}
                    </div>
                </div>

                {/* ── Link columns ── */}
                <div className="sf-columns">
                    {FOOTER_COLUMNS.map(({ heading, links }) => (
                        <div key={heading} className="sf-col">
                            <h3 className="sf-col-heading">{heading}</h3>
                            <ul className="sf-col-list">
                                {links.map(({ label, to, soon }) => (
                                    <li key={label}>
                                        {soon ? (
                                            <span className="sf-link sf-link-soon">
                                                {label}
                                                <span className="sf-soon-tag">{t('nav.soon')}</span>
                                            </span>
                                        ) : (
                                            <Link to={to} className="sf-link">{label}</Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Bottom bar ── */}
            <div className="sf-bottom">
                <div className="sf-bottom-inner">
                    <span className="sf-copyright">
                        © {year} Knitly. {t('footer.rights')}
                    </span>
                    <div className="sf-bottom-links">
                        <Link to="/terms" className="sf-bottom-link">{t('footer.short.terms')}</Link>
                        <Link to="/privacy" className="sf-bottom-link">{t('footer.short.privacy')}</Link>
                        <Link to="/copyright" className="sf-bottom-link">{t('footer.short.copyright')}</Link>
                    </div>
                    <span className="sf-lang">{t('lang.name')}</span>
                </div>
            </div>
        </footer>
    );
}
