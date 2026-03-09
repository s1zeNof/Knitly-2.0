import React from 'react';
import { Link }        from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import GiftsContentUk  from './content/uk/gifts';
import GiftsContentEn  from './content/en/gifts';
import '../../styles/DocsPage.css';

export default function DocsGiftsPage() {
    const { language } = useLanguage();

    return (
        <div>
            <div className="dp-hero">
                <nav className="dp-breadcrumb" aria-label="Breadcrumbs">
                    <Link to="/">Knitly</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <Link to="/developers">{language === 'uk' ? 'Документація' : 'Docs'}</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <span>{language === 'uk' ? 'Подарунки' : 'Gifts'}</span>
                </nav>
                <p className="dp-badge">Reference</p>
                <h1 className="dp-title">{language === 'uk' ? 'Подарунки' : 'Gifts'}</h1>
                <p className="dp-description">
                    {language === 'uk'
                        ? 'API подарунків дозволяє ботам надсилати анімовані подарунки користувачам, прикріплювати їх до треків, та переглядати колекції.'
                        : 'The Gifts API allows bots to send animated gifts to users, attach them to tracks, and browse gift collections.'}
                </p>
            </div>
            {language === 'uk' ? <GiftsContentUk /> : <GiftsContentEn />}
        </div>
    );
}
