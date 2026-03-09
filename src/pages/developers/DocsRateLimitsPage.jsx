import React from 'react';
import { Link }        from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import RateLimitsContentUk from './content/uk/rate-limits';
import RateLimitsContentEn from './content/en/rate-limits';
import '../../styles/DocsPage.css';

export default function DocsRateLimitsPage() {
    const { language } = useLanguage();

    return (
        <div>
            <div className="dp-hero">
                <nav className="dp-breadcrumb" aria-label="Breadcrumbs">
                    <Link to="/">Knitly</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <Link to="/developers">{language === 'uk' ? 'Документація' : 'Docs'}</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <span>{language === 'uk' ? 'Ліміти запитів' : 'Rate Limits'}</span>
                </nav>
                <p className="dp-badge">Policies</p>
                <h1 className="dp-title">{language === 'uk' ? 'Ліміти запитів' : 'Rate Limits'}</h1>
                <p className="dp-description">
                    {language === 'uk'
                        ? 'Knitly Bot API застосовує ліміти для забезпечення стабільності платформи та справедливого розподілу ресурсів.'
                        : 'The Knitly Bot API enforces rate limits to ensure platform stability and fair resource distribution.'}
                </p>
            </div>
            {language === 'uk' ? <RateLimitsContentUk /> : <RateLimitsContentEn />}
        </div>
    );
}
