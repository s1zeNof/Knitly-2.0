import React from 'react';
import { Link }        from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import ChangelogContentUk from './content/uk/changelog';
import ChangelogContentEn from './content/en/changelog';
import '../../styles/DocsPage.css';

export default function DocsChangelogPage() {
    const { language } = useLanguage();

    return (
        <div>
            <div className="dp-hero">
                <nav className="dp-breadcrumb" aria-label="Breadcrumbs">
                    <Link to="/">Knitly</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <Link to="/developers">{language === 'uk' ? 'Документація' : 'Docs'}</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <span>{language === 'uk' ? 'Список змін' : 'Changelog'}</span>
                </nav>
                <p className="dp-badge">Updates</p>
                <h1 className="dp-title">{language === 'uk' ? 'Список змін' : 'Changelog'}</h1>
                <p className="dp-description">
                    {language === 'uk'
                        ? 'Усі значущі зміни в Knitly Bot API документуються тут. Дотримуємось семантичного версіонування (SemVer).'
                        : 'All notable changes to the Knitly Bot API are documented here. We follow Semantic Versioning (SemVer).'}
                </p>
            </div>
            {language === 'uk' ? <ChangelogContentUk /> : <ChangelogContentEn />}
        </div>
    );
}
