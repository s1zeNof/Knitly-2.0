// src/components/common/InAppBrowser.js
import React, { useState, useRef, useEffect } from 'react';
import './InAppBrowser.css';

const BackIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>;
const ForwardIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>;
const ExternalLinkIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const LockIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;


const InAppBrowser = ({ initialUrl, onClose }) => {
    const [currentUrl, setCurrentUrl] = useState(initialUrl);
    const [displayUrl, setDisplayUrl] = useState(initialUrl);
    const iframeRef = useRef(null);

    const handleNavigation = () => {
        try {
            const newUrl = iframeRef.current.contentWindow.location.href;
            if (newUrl !== "about:blank") {
                setDisplayUrl(newUrl);
            }
        } catch (error) {
            // Cross-origin error, can't access iframe content. This is expected.
        }
    };
    
    return (
        <div className="in-app-browser-overlay">
            <div className="in-app-browser-container">
                <header className="browser-header">
                    <div className="address-bar">
                        <LockIcon />
                        <input type="text" value={displayUrl} readOnly />
                    </div>
                    <button onClick={onClose} className="browser-close-btn">&times;</button>
                </header>
                <iframe
                    ref={iframeRef}
                    src={currentUrl}
                    onLoad={handleNavigation}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    className="browser-iframe"
                    title="Knitly In-App Browser"
                />
            </div>
        </div>
    );
};

export default InAppBrowser;