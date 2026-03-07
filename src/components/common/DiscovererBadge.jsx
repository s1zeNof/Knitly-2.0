import React from 'react';
import './VerifiedBadge.css'; // Перевикористовуємо стилі позиціювання бейджа

/**
 * DiscovererBadge — бейдж, що видається користувачу-першовідкривачу.
 *
 * Форма: Преміальна неонова іконка-компас з 3D-світінням
 */
const DiscovererBadge = ({ size = 'sm', className = '' }) => {
    const px = { xs: 13, sm: 16, md: 20, lg: 26 }[size] ?? 16;

    return (
        <span
            className={`verified-badge-icon verified-badge-icon--${size} ${className}`}
            title="Discoverer (Першовідкривач)"
            aria-label="Discoverer (Першовідкривач)"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                verticalAlign: 'middle',
                marginLeft: '4px',
                filter: 'drop-shadow(0 0 5px rgba(45, 212, 191, 0.45))'
            }}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                width={px}
                height={px}
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="disc-bg" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#2dd4bf" />
                        <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                    <linearGradient id="disc-ring" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ccfbf1" />
                        <stop offset="100%" stopColor="#0f766e" />
                    </linearGradient>
                    <linearGradient id="disc-star" x1="8" y1="8" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#a7f3d0" />
                    </linearGradient>
                </defs>

                {/* Base circle background */}
                <circle cx="12" cy="12" r="11" fill="url(#disc-bg)" />

                {/* 3D Inner ring */}
                <circle cx="12" cy="12" r="10" fill="none" stroke="url(#disc-ring)" strokeWidth="1.2" opacity="0.9" />

                {/* Radar / Globe lines for exploration theme */}
                <path d="M12 2 C15.5 2 18 6.5 18 12 C18 17.5 15.5 22 12 22 C8.5 22 6 17.5 6 12 C6 6.5 8.5 2 12 2 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
                <path d="M2 12 C2 12 6.5 9 12 9 C17.5 9 22 12 22 12 C22 12 17.5 15 12 15 C6.5 15 2 12 2 12 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />

                {/* Premium Navigation Star */}
                <path d="M12 3.5 L13.5 10.5 L20.5 12 L13.5 13.5 L12 20.5 L10.5 13.5 L3.5 12 L10.5 10.5 Z" fill="url(#disc-star)" />

                {/* Center of the star */}
                <circle cx="12" cy="12" r="2.5" fill="#ffffff" />
                <circle cx="12" cy="12" r="1.5" fill="#047857" />

                {/* Floating discovery sparks */}
                <circle cx="17.5" cy="6.5" r="1" fill="#ffffff" opacity="0.9" />
                <circle cx="6.5" cy="17.5" r="1" fill="#ffffff" opacity="0.6" />
                <circle cx="6" cy="7" r="0.5" fill="#ffffff" opacity="0.7" />
                <circle cx="18" cy="17" r="0.8" fill="#ffffff" opacity="0.5" />
            </svg>
        </span>
    );
};

export default DiscovererBadge;
