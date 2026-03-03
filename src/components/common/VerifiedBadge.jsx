import React from 'react';
import './VerifiedBadge.css';

/**
 * VerifiedBadge — верифікаційна галочка-бейдж після імені юзера.
 *
 * Форма: 8-кутна зірка-печать (Telegram-стиль), фіолетовий акцент Knitly.
 * Не використовує складних SVG-фільтрів — стабільно рендериться у всіх браузерах.
 *
 * Розміри:
 *   xs  — 13px  (автор допису, коментарі, сповіщення, чат-список)
 *   sm  — 16px  (списки юзерів, сайдбар)
 *   md  — 20px  (картки юзерів, підписники)
 *   lg  — 26px  (заголовок профілю)
 *
 * Використання:
 *   {user.roles?.includes('verified') && <VerifiedBadge size="sm" />}
 *
 * Архітектура (для нових бейджів у майбутньому):
 *   Черговість: [Ім'я] [🔮 кастомні емоджі] [VerifiedBadge] [інші бейджі]
 *   Для нових типів — новий компонент за тим самим шаблоном.
 */
const VerifiedBadge = ({ size = 'sm', className = '' }) => {
    const px = { xs: 13, sm: 16, md: 20, lg: 26 }[size] ?? 16;

    /*
     * 8-кутна зірка-печать (outer r=9, inner r=5.5, center 10,10).
     * Точки розраховані рівномірно через 45° (outer) та 22.5° (inner).
     * Фіолетовий градієнт Knitly: #a78bfa → #6d28d9.
     */
    return (
        <span
            className={`verified-badge-icon verified-badge-icon--${size} ${className}`}
            title="Верифікований акаунт"
            aria-label="Верифікований акаунт"
        >
            <svg
                viewBox="0 0 20 20"
                fill="none"
                width={px}
                height={px}
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="vb-knitly-grad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#6d28d9" />
                    </linearGradient>
                </defs>

                {/* 8-кутна зірка-печать */}
                {/** <path
                    d="M10,1 L12.11,4.92 L16.36,3.64 L15.08,7.89 L19,10
                       L15.08,12.11 L16.36,16.36 L12.11,15.08 L10,19
                       L7.89,15.08 L3.64,16.36 L4.92,12.11 L1,10
                       L4.92,7.89 L3.64,3.64 L7.89,4.92 Z"
                    fill="url(#vb-knitly-grad)"
                /> **/}
                <path
                    d="M10,2 L13,3 L16,4 L17,7 L18,10
     L17,13 L16,16 L13,17 L10,18
     L7,17 L4,16 L3,13 L2,10
     L3,7 L4,4 L7,3 Z"
                    fill="url(#vb-knitly-grad)"
                />

                {/* Біла галочка */}
                <path
                    d="M6.5 10.5l2.5 2.5 4.5-4.5"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
};

export default VerifiedBadge;
