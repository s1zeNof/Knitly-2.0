import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import TracksContentUk from './content/uk/tracks';
import TracksContentEn from './content/en/tracks';
import '../../styles/DocsPage.css';

export default function DocsTracksPage() {
    const { language } = useLanguage();

    return (
        <div>
            <div className="dp-hero">
                <nav className="dp-breadcrumb" aria-label="Breadcrumbs">
                    <Link to="/">Knitly</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <Link to="/developers">{language === 'uk' ? 'Документація' : 'Docs'}</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <span>{language === 'uk' ? 'Треки' : 'Tracks'}</span>
                </nav>
                <p className="dp-badge">Reference</p>
                <h1 className="dp-title">{language === 'uk' ? 'Треки' : 'Tracks'}</h1>
                <p className="dp-description">
                    {language === 'uk'
                        ? 'Публічний API треків дозволяє ботам читати метадані треків та переглядати каталог музики Knitly.'
                        : 'The public tracks API allows bots to read track metadata and browse the Knitly music catalogue.'}
                </p>
            </div>
            {language === 'uk' ? <TracksContentUk /> : <TracksContentEn />}
        </div>
    );
}
