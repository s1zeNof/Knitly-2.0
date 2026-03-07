import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState('uk');

    useEffect(() => {
        const savedLang = localStorage.getItem('knitly_lang');
        if (savedLang && (savedLang === 'uk' || savedLang === 'en')) {
            setLanguageState(savedLang);
            return;
        }

        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang) {
            const langPrefix = browserLang.substring(0, 2).toLowerCase();
            if (['uk', 'ru', 'be'].includes(langPrefix)) {
                setLanguageState('uk');
            } else {
                setLanguageState('en');
            }
        }
    }, []);

    const setLanguage = (lang) => {
        if (lang === 'uk' || lang === 'en') {
            setLanguageState(lang);
            localStorage.setItem('knitly_lang', lang);
        }
    };

    const translations = {
        uk: {
            'nav.home': 'Knitly',
            'nav.legal': 'Правові документи',
            'nav.terms': 'Умови використання',
            'nav.privacy': 'Конфіденційність',
            'nav.copyright': 'Авторські права',
            'nav.guidelines': 'Правила спільноти',
            'lang.switcher.en': 'English',
            'lang.switcher.uk': 'Українська',
            'nav.feed': 'Стрічка',
            'nav.music': 'Музика',
            'nav.forArtists': 'Для артистів',
            'nav.about': 'Про нас',
            'nav.soon': 'скоро',
            'nav.login': 'Увійти',
            'nav.register': 'Приєднатись',
            'nav.backToHome': 'На головну',
            'nav.copyrightDmca': 'Авторські права & DMCA',

            // Footer
            'footer.product': 'Продукт',
            'footer.nav.search': 'Пошук музики',
            'footer.nav.upload': 'Завантажити трек',
            'footer.nav.playlists': 'Плейлисти',
            'footer.nav.gifts': 'Подарунки',
            'footer.nav.apps': 'Міні-застосунки',
            'footer.legal': 'Правові',
            'footer.nav.cookies': 'Політика кукі',
            'footer.company': 'Компанія',
            'footer.nav.about': 'Про Knitly',
            'footer.nav.blog': 'Блог',
            'footer.nav.careers': 'Вакансії',
            'footer.nav.contact': 'Контакти',
            'footer.nav.help': 'Допомога',
            'footer.tagline': "Соціальна мережа для музикантів.\nДе нові артисти з'являються першими.",
            'footer.rights': 'Всі права захищені.',
            'footer.short.terms': 'Умови',
            'footer.short.privacy': 'Конфіденційність',
            'footer.short.copyright': 'Авторські права',
            'lang.name': '🇺🇦 Українська'
        },
        en: {
            'nav.home': 'Knitly',
            'nav.legal': 'Legal Documents',
            'nav.terms': 'Terms of Service',
            'nav.privacy': 'Privacy Policy',
            'nav.copyright': 'Copyright',
            'nav.guidelines': 'Community Guidelines',
            'lang.switcher.en': 'English',
            'lang.switcher.uk': 'Українська',
            'nav.feed': 'Feed',
            'nav.music': 'Music',
            'nav.forArtists': 'For Artists',
            'nav.about': 'About',
            'nav.soon': 'soon',
            'nav.login': 'Login',
            'nav.register': 'Sign Up',
            'nav.backToHome': 'Back to Home',
            'nav.copyrightDmca': 'Copyright & DMCA',

            // Footer
            'footer.product': 'Product',
            'footer.nav.search': 'Search Music',
            'footer.nav.upload': 'Upload Track',
            'footer.nav.playlists': 'Playlists',
            'footer.nav.gifts': 'Gifts',
            'footer.nav.apps': 'Mini Apps',
            'footer.legal': 'Legal',
            'footer.nav.cookies': 'Cookies Policy',
            'footer.company': 'Company',
            'footer.nav.about': 'About Knitly',
            'footer.nav.blog': 'Blog',
            'footer.nav.careers': 'Careers',
            'footer.nav.contact': 'Contact',
            'footer.nav.help': 'Help',
            'footer.tagline': "Social network for musicians.\nWhere new artists emerge first.",
            'footer.rights': 'All rights reserved.',
            'footer.short.terms': 'Terms',
            'footer.short.privacy': 'Privacy',
            'footer.short.copyright': 'Copyright',
            'lang.name': '🇬🇧 English'
        }
    };

    const t = (key) => {
        return translations[language]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
