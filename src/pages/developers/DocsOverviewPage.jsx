import React from 'react';
import { Link }          from 'react-router-dom';
import { useLanguage }   from '../../contexts/LanguageContext';
import OverviewContentUk from './content/uk/overview';
import OverviewContentEn from './content/en/overview';
import '../../styles/DocsPage.css';

export default function DocsOverviewPage() {
    const { language } = useLanguage();

    return (
        <div>
            <div className="dp-hero">
                <nav className="dp-breadcrumb" aria-label="Breadcrumbs">
                    <Link to="/">Knitly</Link>
                    <span className="dp-breadcrumb-sep" aria-hidden="true">›</span>
                    <span>{language === 'uk' ? 'Документація' : 'Docs'}</span>
                </nav>
                <p className="dp-badge">Bot API</p>
                <h1 className="dp-title">
                    {language === 'uk' ? 'Огляд' : 'Overview'}
                </h1>
                <p className="dp-description">
                    {language === 'uk'
                        ? 'Knitly Bot API дозволяє автоматизувати взаємодії на платформі — надсилати подарунки, читати публічні треки та отримувати події через вебхуки.'
                        : 'The Knitly Bot API lets you automate interactions on the platform — send gifts, read public tracks, and receive real-time events via webhooks.'}
                </p>
                <div className="dp-meta">
                    <span className="dp-meta-item">
                        {language === 'uk' ? 'Версія: 1.0.0' : 'Version: 1.0.0'}
                    </span>
                    <span className="dp-meta-item">
                        {language === 'uk' ? 'Статус: Стабільний' : 'Status: Stable'}
                    </span>
                    <span className="dp-meta-item">
                        {language === 'uk' ? 'Базовий URL: /api/v1' : 'Base URL: /api/v1'}
                    </span>
                </div>
            </div>

            {language === 'uk' ? <OverviewContentUk /> : <OverviewContentEn />}
        </div>
    );
}
