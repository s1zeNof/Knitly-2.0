import React from 'react';
import { Link }        from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import WebhooksContentUk from './content/uk/webhooks';
import WebhooksContentEn from './content/en/webhooks';
import '../../styles/DocsPage.css';

export default function DocsWebhooksPage() {
    const { language } = useLanguage();

    return (
        <div>
            <div className="dp-hero">
                <nav className="dp-breadcrumb" aria-label="Breadcrumbs">
                    <Link to="/">Knitly</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <Link to="/developers">{language === 'uk' ? 'Документація' : 'Docs'}</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <span>{language === 'uk' ? 'Вебхуки' : 'Webhooks'}</span>
                </nav>
                <p className="dp-badge">Reference</p>
                <h1 className="dp-title">{language === 'uk' ? 'Вебхуки' : 'Webhooks'}</h1>
                <p className="dp-description">
                    {language === 'uk'
                        ? 'Вебхуки дозволяють вашому серверу отримувати події Knitly в реальному часі без постійного опитування (polling).'
                        : 'Webhooks let your server receive Knitly events in real time without constant polling.'}
                </p>
            </div>
            {language === 'uk' ? <WebhooksContentUk /> : <WebhooksContentEn />}
        </div>
    );
}
