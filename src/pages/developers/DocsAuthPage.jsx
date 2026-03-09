import React from 'react';
import { Link }        from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import AuthContentUk   from './content/uk/auth';
import AuthContentEn   from './content/en/auth';
import '../../styles/DocsPage.css';

export default function DocsAuthPage() {
    const { language } = useLanguage();

    return (
        <div>
            <div className="dp-hero">
                <nav className="dp-breadcrumb" aria-label="Breadcrumbs">
                    <Link to="/">Knitly</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <Link to="/developers">{language === 'uk' ? 'Документація' : 'Docs'}</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <span>{language === 'uk' ? 'Автентифікація' : 'Authentication'}</span>
                </nav>
                <p className="dp-badge">Security</p>
                <h1 className="dp-title">
                    {language === 'uk' ? 'Автентифікація' : 'Authentication'}
                </h1>
                <p className="dp-description">
                    {language === 'uk'
                        ? 'Knitly Bot API використовує токени-носії (Bearer tokens) для автентифікації всіх запитів. Токени прив\'язані до бота та ніколи не зберігаються у відкритому вигляді.'
                        : 'The Knitly Bot API uses Bearer tokens to authenticate every request. Tokens are tied to a single bot and are never stored in plaintext.'}
                </p>
            </div>

            {language === 'uk' ? <AuthContentUk /> : <AuthContentEn />}
        </div>
    );
}
