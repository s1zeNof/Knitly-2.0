import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import CopyrightContentUk from './content/CopyrightContentUk';
import CopyrightContentEn from './content/CopyrightContentEn';
import './LegalPage.css';

export default function CopyrightPage() {
    const { language, t } = useLanguage();

    return (
        <div>
            {/* ── Hero ── */}
            <div className="lp-hero">
                <nav className="lp-breadcrumb" aria-label={language === 'uk' ? 'Хлібні крихти' : 'Breadcrumbs'}>
                    <Link to="/">{t('nav.home')}</Link>
                    <span className="lp-breadcrumb-sep" aria-hidden="true">›</span>
                    <span>{t('nav.legal')}</span>
                    <span className="lp-breadcrumb-sep" aria-hidden="true">›</span>
                    <span>{t('nav.copyright')}</span>
                </nav>
                <p className="lp-badge">{language === 'uk' ? 'Авторські права та DMCA' : 'Copyright & DMCA'}</p>
                <h1 className="lp-title">{t('nav.copyright')}</h1>
                <div className="lp-meta">
                    <span className="lp-meta-item">
                        {language === 'uk' ? 'Набирає чинності: 1 березня 2025 р.' : 'Effective Date: March 1, 2025'}
                    </span>
                    <span className="lp-meta-item">
                        {language === 'uk' ? 'Оновлено: 1 березня 2025 р.' : 'Last Updated: March 1, 2025'}
                    </span>
                    <span className="lp-meta-item">DMCA / Safe Harbor</span>
                </div>
            </div>

            {language === 'uk' ? <CopyrightContentUk /> : <CopyrightContentEn />}
        </div>
    );
}

