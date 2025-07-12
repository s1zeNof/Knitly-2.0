// src/components/common/InAppBrowser.js
import React, { useState, useRef } from 'react';
import './InAppBrowser.css';

const ExternalLinkIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const LockIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;

const InAppBrowser = ({ initialUrl, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const iframeRef = useRef(null);

    const openInNewTab = () => {
        window.open(initialUrl, '_blank', 'noopener,noreferrer');
    };

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    return (
        <div className="in-app-browser-overlay">
            <div className="in-app-browser-container">
                <header className="browser-header">
                    <div className="address-bar">
                        <LockIcon />
                        <input type="text" value={initialUrl} readOnly />
                    </div>
                    <button onClick={openInNewTab} className="browser-action-btn" title="Відкрити в новій вкладці">
                        <ExternalLinkIcon />
                    </button>
                    <button onClick={onClose} className="browser-close-btn">&times;</button>
                </header>
                <div className="browser-content-area">
                    {isLoading && (
                        <div className="browser-loader-container">
                            <div className="browser-loader"></div>
                            <p>Завантаження...</p>
                        </div>
                    )}
                    <div className="browser-fallback-message">
                        <h4>Не вдається відобразити сторінку</h4>
                        <p>Деякі сайти, як-от {new URL(initialUrl).hostname}, забороняють вбудовування на інших ресурсах з міркувань безпеки.</p>
                        <button onClick={openInNewTab} className="fallback-open-button">
                            <ExternalLinkIcon />
                            Відкрити в новій вкладці
                        </button>
                    </div>
                    <iframe
                        ref={iframeRef}
                        src={initialUrl}
                        onLoad={handleIframeLoad}
                        sandbox="allow-scripts allow-popups allow-forms"
                        className="browser-iframe"
                        title="Knitly In-App Browser"
                    />
                </div>
            </div>
        </div>
    );
};

export default InAppBrowser;