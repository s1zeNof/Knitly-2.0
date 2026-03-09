import React from 'react';
import { Link }        from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import BotsContentUk   from './content/uk/bots';
import BotsContentEn   from './content/en/bots';
import '../../styles/DocsPage.css';

export default function DocsBotsPage() {
    const { language } = useLanguage();

    return (
        <div>
            <div className="dp-hero">
                <nav className="dp-breadcrumb" aria-label="Breadcrumbs">
                    <Link to="/">Knitly</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <Link to="/developers">{language === 'uk' ? 'Документація' : 'Docs'}</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <span>{language === 'uk' ? 'Боти' : 'Bots'}</span>
                </nav>
                <p className="dp-badge">Reference</p>
                <h1 className="dp-title">{language === 'uk' ? 'Боти' : 'Bots'}</h1>
                <p className="dp-description">
                    {language === 'uk'
                        ? 'Боти — це автоматизовані агенти, які взаємодіють із Knitly від імені вашого застосунку. Цей розділ описує реєстрацію, керування та налаштування бота.'
                        : 'Bots are automated agents that interact with Knitly on behalf of your application. This section covers bot registration, management, and configuration.'}
                </p>
            </div>
            {language === 'uk' ? <BotsContentUk /> : <BotsContentEn />}
        </div>
    );
}
