import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { language, setLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleSelect = (lang) => {
        setLanguage(lang);
        setIsOpen(false);
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get display label for current language
    const currentLabel = language === 'uk' ? 'УКР' : 'EN';

    return (
        <div className="lang-switcher" ref={dropdownRef}>
            <button
                className="lang-switcher-btn"
                onClick={toggleDropdown}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <Globe size={16} />
                <span>{currentLabel}</span>
                <ChevronDown size={14} className={`lang-switcher-caret ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <ul className="lang-switcher-menu" role="listbox">
                    <li
                        role="option"
                        aria-selected={language === 'uk'}
                        className={`lang-switcher-item ${language === 'uk' ? 'active' : ''}`}
                        onClick={() => handleSelect('uk')}
                    >
                        <span className="lang-switcher-flag">🇺🇦</span>
                        {t('lang.switcher.uk')}
                    </li>
                    <li
                        role="option"
                        aria-selected={language === 'en'}
                        className={`lang-switcher-item ${language === 'en' ? 'active' : ''}`}
                        onClick={() => handleSelect('en')}
                    >
                        <span className="lang-switcher-flag">🇺🇸</span>
                        {t('lang.switcher.en')}
                    </li>
                </ul>
            )}
        </div>
    );
};

export default LanguageSwitcher;
