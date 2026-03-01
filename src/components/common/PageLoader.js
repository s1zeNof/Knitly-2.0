import React from 'react';
import './PageLoader.css';

/**
 * PageLoader — centered equalizer animation
 * Usage: <PageLoader /> or <PageLoader text="Завантаження профілю..." />
 */
const PageLoader = ({ text }) => (
    <div className="page-loader">
        <div className="page-loader-eq">
            <div className="pl-bar" />
            <div className="pl-bar" />
            <div className="pl-bar" />
            <div className="pl-bar" />
            <div className="pl-bar" />
        </div>
        {text && <p className="page-loader-text">{text}</p>}
    </div>
);

export default PageLoader;
