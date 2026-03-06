import React from 'react';
import { AlertTriangle, Info, CheckCircle, Zap, Star, Shield, Award } from 'lucide-react';
import './UploadLimitBanner.css';

const PLAN_DEFAULTS = {
    free: 10,
    premium: 100,
};

const BADGE_LABELS = {
    'early-adopter': 'Early Adopter',
    'beta-tester': 'Beta Tester',
    'creator-plus': 'Creator+',
    'vip': 'VIP',
};

const BADGE_ICONS = {
    'early-adopter': Star,
    'beta-tester': Shield,
    'creator-plus': Zap,
    'vip': Award,
};

export const getEffectiveLimit = (user) => {
    if (!user) return PLAN_DEFAULTS.free;
    const planDefault = PLAN_DEFAULTS[user.plan ?? 'free'] ?? PLAN_DEFAULTS.free;

    if (user.uploadLimitOverride != null) {
        const expiry = user.uploadLimitOverrideExpiry;
        if (!expiry) return user.uploadLimitOverride;
        const expiryMs = expiry?.toMillis ? expiry.toMillis() : new Date(expiry).getTime();
        if (Date.now() <= expiryMs) return user.uploadLimitOverride;
    }

    return planDefault;
};

export const getCurrentMonthUsage = (user) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (!user?.monthlyUploads || user.monthlyUploads.month !== currentMonth) return 0;
    return user.monthlyUploads.count ?? 0;
};

const UploadLimitBanner = ({ user }) => {
    if (!user) return null;

    const used = getCurrentMonthUsage(user);
    const limit = getEffectiveLimit(user);
    const remaining = Math.max(0, limit - used);
    const isOverride = user.uploadLimitOverride != null && (() => {
        const expiry = user.uploadLimitOverrideExpiry;
        if (!expiry) return true;
        const expiryMs = expiry?.toMillis ? expiry.toMillis() : new Date(expiry).getTime();
        return Date.now() <= expiryMs;
    })();
    const badges = user.badges ?? [];

    const pct = Math.min(100, (used / limit) * 100);
    const isLimitReached = used >= limit;
    const isApproaching = !isLimitReached && remaining <= 2;

    let variant = 'normal';
    if (isLimitReached) variant = 'blocked';
    else if (isApproaching) variant = 'warning';
    else if (isOverride) variant = 'override';

    const expiryLabel = (() => {
        if (!isOverride || !user.uploadLimitOverrideExpiry) return null;
        const expiry = user.uploadLimitOverrideExpiry;
        const ms = expiry?.toMillis ? expiry.toMillis() : new Date(expiry).getTime();
        return new Date(ms).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    })();

    const monthName = new Date().toLocaleString('uk-UA', { month: 'long' });

    return (
        <div className={`ulb-root ulb--${variant}`}>
            <div className="ulb-left">
                {variant === 'blocked' && <AlertTriangle size={15} className="ulb-icon" />}
                {variant === 'warning' && <AlertTriangle size={15} className="ulb-icon" />}
                {variant === 'override' && <Info size={15} className="ulb-icon" />}
                {variant === 'normal' && <CheckCircle size={15} className="ulb-icon" />}

                <span className="ulb-text">
                    {variant === 'blocked' && <>Ліміт <strong>{limit}</strong> треків/місяць досягнуто. Оновіться до Premium.</>}
                    {variant === 'warning' && <>Залишилось <strong>{remaining}</strong> з <strong>{limit}</strong> завантажень цього місяця ({monthName}).</>}
                    {variant === 'override' && <>Спеціальний ліміт: <strong>{used}/{limit}</strong> треків{expiryLabel ? ` · діє до ${expiryLabel}` : ' · без обмеження часу'}.</>}
                    {variant === 'normal' && <><strong>{used}</strong> з <strong>{limit}</strong> завантажень використано цього місяця ({monthName}).</>}
                </span>
            </div>

            <div className="ulb-right">
                {badges.map(badge => {
                    const Icon = BADGE_ICONS[badge];
                    return (
                        <span key={badge} className={`ulb-badge ulb-badge--${badge}`}>
                            {Icon && <Icon size={11} />}
                            {BADGE_LABELS[badge] ?? badge}
                        </span>
                    );
                })}

                <div className="ulb-progress-wrap">
                    <div className="ulb-progress-track">
                        <div
                            className="ulb-progress-fill"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <span className="ulb-count">{used}/{limit}</span>
                </div>
            </div>
        </div>
    );
};

export default UploadLimitBanner;
