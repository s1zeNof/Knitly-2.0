import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import GuidelinesContentUk from './content/GuidelinesContentUk';
import GuidelinesContentEn from './content/GuidelinesContentEn';
import './LegalPage.css';

export default function GuidelinesPage() {
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
                    <span>{t('nav.guidelines')}</span>
                </nav>
                <p className="lp-badge">{language === 'uk' ? 'Правила спільноти' : 'Community Guidelines'}</p>
                <h1 className="lp-title">{t('nav.guidelines')}</h1>
                <div className="lp-meta">
                    <span className="lp-meta-item">
                        {language === 'uk' ? 'Набирають чинності: 1 березня 2025 р.' : 'Effective Date: March 1, 2025'}
                    </span>
                    <span className="lp-meta-item">
                        {language === 'uk' ? 'Оновлено: 1 березня 2025 р.' : 'Last Updated: March 1, 2025'}
                    </span>
                    <span className="lp-meta-item">
                        {language === 'uk' ? 'Для всіх учасників спільноти' : 'For all community members'}
                    </span>
                </div>
            </div>

            {language === 'uk' ? <GuidelinesContentUk /> : <GuidelinesContentEn />}
        </div>
    );
}

