import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import TermsContentUk from './content/TermsContentUk';
import TermsContentEn from './content/TermsContentEn';
import './LegalPage.css';

export default function TermsPage() {
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
                    <span>{t('nav.terms')}</span>
                </nav>
                <p className="lp-badge">{language === 'uk' ? 'Юридичний документ' : 'Legal Document'}</p>
                <h1 className="lp-title">{t('nav.terms')}</h1>
                <div className="lp-meta">
                    <span className="lp-meta-item">
                        {language === 'uk' ? 'Набирають чинності: 1 березня 2025 р.' : 'Effective Date: March 1, 2025'}
                    </span>
                    <span className="lp-meta-item">
                        {language === 'uk' ? 'Оновлено: 1 березня 2025 р.' : 'Last Updated: March 1, 2025'}
                    </span>
                    <span className="lp-meta-item">
                        {language === 'uk' ? 'Чинні для: knitly.app' : 'Applies to: knitly.app'}
                    </span>
                </div>
            </div>

            {language === 'uk' ? <TermsContentUk /> : <TermsContentEn />}
        </div>
    );
}

