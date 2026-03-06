import React, { useState, useEffect } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { X, Upload, Star, Shield, Zap, Award, TrendingUp } from 'lucide-react';
import { getEffectiveLimit, getCurrentMonthUsage } from '../upload/UploadLimitBanner';
import './UserLimitsModal.css';

const PLAN_DEFAULTS = { free: 10, premium: 100 };

const BADGES = [
    { id: 'early-adopter',  label: 'Early Adopter',  icon: Star,   desc: 'Перші користувачі платформи' },
    { id: 'beta-tester',    label: 'Beta Tester',    icon: Shield, desc: 'Тестували бета-версію' },
    { id: 'creator-plus',   label: 'Creator+',       icon: Zap,    desc: 'Активний творець' },
    { id: 'vip',            label: 'VIP',            icon: Award,  desc: 'VIP-учасник' },
];

const formatDate = (ts) => {
    if (!ts) return '';
    const ms = ts?.toMillis ? ts.toMillis() : new Date(ts).getTime();
    return new Date(ms).toISOString().slice(0, 10);
};

const monthName = (offset = 0) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d.toLocaleString('uk-UA', { month: 'long', year: 'numeric' });
};

const UserLimitsModal = ({ user, onClose, onSaved }) => {
    const effectiveLimit = getEffectiveLimit(user);
    const used = getCurrentMonthUsage(user);

    const hasOverride = user.uploadLimitOverride != null && (() => {
        const expiry = user.uploadLimitOverrideExpiry;
        if (!expiry) return true;
        const ms = expiry?.toMillis ? expiry.toMillis() : new Date(expiry).getTime();
        return Date.now() <= ms;
    })();

    /* ── Local state ── */
    const [limitValue, setLimitValue]   = useState(String(user.uploadLimitOverride ?? PLAN_DEFAULTS[user.plan ?? 'free']));
    const [neverExpires, setNeverExpires] = useState(!user.uploadLimitOverrideExpiry);
    const [expiryDate, setExpiryDate]   = useState(formatDate(user.uploadLimitOverrideExpiry));
    const [badges, setBadges]           = useState(user.badges ?? []);
    const [saving, setSaving]           = useState(false);
    const [saved, setSaved]             = useState(false);
    const [error, setError]             = useState('');

    /* ── Close on Escape ── */
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const toggleBadge = (id) => {
        setBadges(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
    };

    const handleSave = async () => {
        const numLimit = parseInt(limitValue, 10);
        if (isNaN(numLimit) || numLimit < 0) {
            setError('Введіть коректне число ≥ 0');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const userRef = doc(db, 'users', user.id);
            let expiry = null;
            if (!neverExpires && expiryDate) {
                expiry = Timestamp.fromDate(new Date(expiryDate + 'T23:59:59'));
            }

            await updateDoc(userRef, {
                uploadLimitOverride: numLimit,
                uploadLimitOverrideExpiry: expiry,
                badges,
            });

            setSaved(true);
            setTimeout(() => {
                onSaved?.();
                onClose();
            }, 800);
        } catch (e) {
            setError(`Помилка: ${e.message}`);
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setSaving(true);
        setError('');
        try {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
                uploadLimitOverride: null,
                uploadLimitOverrideExpiry: null,
            });
            setLimitValue(String(PLAN_DEFAULTS[user.plan ?? 'free']));
            setNeverExpires(true);
            setExpiryDate('');
            setSaved(true);
            setTimeout(() => { onSaved?.(); onClose(); }, 700);
        } catch (e) {
            setError(`Помилка: ${e.message}`);
            setSaving(false);
        }
    };

    const pct = Math.min(100, (used / effectiveLimit) * 100);

    return (
        <div className="ulm-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ulm-modal" role="dialog" aria-modal="true">

                {/* Header */}
                <div className="ulm-header">
                    <div className="ulm-header-info">
                        {user.photoURL
                            ? <img src={user.photoURL} alt="" className="ulm-avatar" />
                            : <div className="ulm-avatar ulm-avatar--placeholder">{user.displayName?.[0]?.toUpperCase()}</div>
                        }
                        <div>
                            <p className="ulm-name">{user.displayName}</p>
                            <p className="ulm-nick">@{user.nickname}</p>
                        </div>
                    </div>
                    <button className="ulm-close" onClick={onClose} aria-label="Закрити">
                        <X size={18} />
                    </button>
                </div>

                <div className="ulm-body">

                    {/* Usage */}
                    <div className="ulm-card">
                        <div className="ulm-card-header">
                            <TrendingUp size={14} />
                            Використання цього місяця ({monthName()})
                        </div>
                        <div className="ulm-usage-row">
                            <span className="ulm-usage-num">
                                <strong>{used}</strong>/{effectiveLimit}
                            </span>
                            <span className="ulm-usage-label">
                                {hasOverride ? 'Спеціальний ліміт' : `Plan: ${user.plan ?? 'free'}`}
                            </span>
                        </div>
                        <div className="ulm-progress-track">
                            <div
                                className={`ulm-progress-fill ${pct >= 100 ? 'ulm-progress-fill--full' : ''}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <p className="ulm-usage-hint">
                            Стандарт: free = {PLAN_DEFAULTS.free} треків/міс · premium = {PLAN_DEFAULTS.premium} треків/міс
                        </p>
                    </div>

                    {/* Limit override */}
                    <div className="ulm-card">
                        <div className="ulm-card-header">
                            <Upload size={14} />
                            Кастомний місячний ліміт
                        </div>

                        <div className="ulm-limit-row">
                            <div className="ulm-limit-input-wrap">
                                <label className="ulm-label">Треків / місяць</label>
                                <input
                                    type="number"
                                    className="ulm-input"
                                    value={limitValue}
                                    onChange={e => setLimitValue(e.target.value)}
                                    min={0}
                                    max={9999}
                                    disabled={saving}
                                />
                            </div>

                            <div className="ulm-expiry-wrap">
                                <label className="ulm-label">Термін дії</label>
                                <label className="ulm-check-inline">
                                    <input
                                        type="checkbox"
                                        checked={neverExpires}
                                        onChange={e => setNeverExpires(e.target.checked)}
                                        disabled={saving}
                                    />
                                    Без обмеження
                                </label>
                                {!neverExpires && (
                                    <input
                                        type="date"
                                        className="ulm-date-input"
                                        value={expiryDate}
                                        onChange={e => setExpiryDate(e.target.value)}
                                        min={new Date().toISOString().slice(0, 10)}
                                        disabled={saving}
                                    />
                                )}
                            </div>
                        </div>

                        {hasOverride && (
                            <button
                                type="button"
                                className="ulm-reset-btn"
                                onClick={handleReset}
                                disabled={saving}
                            >
                                Скинути до стандарту ({PLAN_DEFAULTS[user.plan ?? 'free']}/міс)
                            </button>
                        )}
                    </div>

                    {/* Badges */}
                    <div className="ulm-card">
                        <div className="ulm-card-header">
                            <Star size={14} />
                            Значки
                        </div>
                        <div className="ulm-badges-grid">
                            {BADGES.map(({ id, label, icon: Icon, desc }) => (
                                <button
                                    key={id}
                                    type="button"
                                    className={`ulm-badge-btn ulm-badge-btn--${id} ${badges.includes(id) ? 'ulm-badge-btn--active' : ''}`}
                                    onClick={() => toggleBadge(id)}
                                    disabled={saving}
                                >
                                    <Icon size={15} />
                                    <div className="ulm-badge-info">
                                        <span className="ulm-badge-label">{label}</span>
                                        <span className="ulm-badge-desc">{desc}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="ulm-error">{error}</p>}
                </div>

                {/* Footer */}
                <div className="ulm-footer">
                    <button className="ulm-btn ulm-btn--cancel" onClick={onClose} disabled={saving}>
                        Скасувати
                    </button>
                    <button
                        className="ulm-btn ulm-btn--save"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saved ? 'Збережено!' : saving ? 'Збереження...' : 'Зберегти'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserLimitsModal;
