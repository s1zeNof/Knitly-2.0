import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    doc, getDoc, updateDoc,
    collection, query, where, orderBy, limit as fsLimit, getDocs,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import toast from 'react-hot-toast';

// ── Limit helpers (mirrors main app logic) ─────────────────────────────────────
const PLAN_DEFAULTS = { free: 10, premium: 100 };

const getEffectiveLimit = (user) => {
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

const getCurrentMonthUsage = (user) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (!user?.monthlyUploads || user.monthlyUploads.month !== currentMonth) return 0;
    return user.monthlyUploads.count ?? 0;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
};

const toInputDate = (ts) => {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toISOString().slice(0, 10);
};

// ── SVG icons ──────────────────────────────────────────────────────────────────
const IcoArrowLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
const IcoMail = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
const IcoCalendar = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IcoUser = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IcoShield = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const IcoMusic = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
const IcoExternal = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>;
const IcoCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IcoCompass = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>;

// ── Constants ──────────────────────────────────────────────────────────────────
const ROLES_ALL = ['admin', 'moderator', 'verified', 'banned'];

const BADGE_DEFS = [
    { key: 'early-adopter', label: 'Early Adopter', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
    { key: 'beta-tester', label: 'Beta Tester', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
    { key: 'creator-plus', label: 'Creator+', color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)' },
    { key: 'vip', label: 'VIP', color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.35)' },
    { key: 'discoverer', label: 'Discoverer', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' },
];

const MAIN_APP_URL = 'https://knitly-demo.vercel.app';

// ── Component ──────────────────────────────────────────────────────────────────
export default function UserDetailPage() {
    const { uid } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Local editable state
    const [roles, setRoles] = useState([]);
    const [limitValue, setLimitValue] = useState('');
    const [neverExpires, setNeverExpires] = useState(true);
    const [limitExpiry, setLimitExpiry] = useState('');
    const [badges, setBadges] = useState([]);

    const [claimTrackId, setClaimTrackId] = useState('');
    const [claimingTrack, setClaimingTrack] = useState(false);

    // ── Load ───────────────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const uSnap = await getDoc(doc(db, 'users', uid));
                if (!uSnap.exists()) {
                    toast.error('Юзера не знайдено');
                    navigate('/users');
                    return;
                }
                const u = { id: uSnap.id, ...uSnap.data() };
                setUser(u);
                setRoles(u.roles || []);
                setBadges(u.badges || []);

                // Set limit fields
                if (u.uploadLimitOverride != null) {
                    setLimitValue(String(u.uploadLimitOverride));
                    const exp = u.uploadLimitOverrideExpiry;
                    if (exp) {
                        setNeverExpires(false);
                        setLimitExpiry(toInputDate(exp));
                    } else {
                        setNeverExpires(true);
                        setLimitExpiry('');
                    }
                } else {
                    setLimitValue('');
                    setNeverExpires(true);
                    setLimitExpiry('');
                }

                // Recent tracks
                try {
                    const tQ = query(
                        collection(db, 'tracks'),
                        where('authorId', '==', uid),
                        orderBy('createdAt', 'desc'),
                        fsLimit(6)
                    );
                    const tSnap = await getDocs(tQ);
                    setTracks(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                } catch {
                    // Index may not exist yet — silently skip
                    setTracks([]);
                }
            } catch (err) {
                toast.error('Помилка завантаження: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [uid, navigate]);

    // ── Roles ──────────────────────────────────────────────────────────────────
    const saveRoles = async (newRoles) => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', uid), { roles: newRoles });
            setRoles(newRoles);
            setUser(prev => ({ ...prev, roles: newRoles }));
            toast.success('Ролі оновлено');
        } catch (err) {
            toast.error('Помилка: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleRole = (role) => {
        const newRoles = roles.includes(role)
            ? roles.filter(r => r !== role)
            : [...roles, role];
        saveRoles(newRoles);
    };

    // ── Limits ─────────────────────────────────────────────────────────────────
    const saveLimits = async () => {
        const parsedLimit = limitValue.trim() !== '' ? parseInt(limitValue, 10) : null;
        if (parsedLimit !== null && (isNaN(parsedLimit) || parsedLimit < 0)) {
            toast.error('Введіть коректне число'); return;
        }
        setSaving(true);
        try {
            let expiryVal = null;
            if (parsedLimit !== null && !neverExpires && limitExpiry) {
                expiryVal = Timestamp.fromDate(new Date(limitExpiry + 'T23:59:59'));
            }
            await updateDoc(doc(db, 'users', uid), {
                uploadLimitOverride: parsedLimit,
                uploadLimitOverrideExpiry: expiryVal,
            });
            setUser(prev => ({ ...prev, uploadLimitOverride: parsedLimit, uploadLimitOverrideExpiry: expiryVal }));
            toast.success('Ліміт збережено');
        } catch (err) {
            toast.error('Помилка: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const resetLimits = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', uid), {
                uploadLimitOverride: null,
                uploadLimitOverrideExpiry: null,
            });
            setLimitValue('');
            setNeverExpires(true);
            setLimitExpiry('');
            setUser(prev => ({ ...prev, uploadLimitOverride: null, uploadLimitOverrideExpiry: null }));
            toast.success('Ліміт скинуто до стандартного');
        } catch (err) {
            toast.error('Помилка: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Badges ─────────────────────────────────────────────────────────────────
    const toggleBadge = (key) => {
        setBadges(prev =>
            prev.includes(key) ? prev.filter(b => b !== key) : [...prev, key]
        );
    };

    const saveBadges = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', uid), { badges });
            setUser(prev => ({ ...prev, badges }));
            toast.success('Значки збережено');
        } catch (err) {
            toast.error('Помилка: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Claim System ──────────────────────────────────────────────────────────
    const handleClaimTrack = async () => {
        if (!claimTrackId.trim()) return;
        if (!window.confirm(`Передати трек "${claimTrackId}" користувачу ${user.displayName}?`)) return;

        setClaimingTrack(true);
        try {
            const trackRef = doc(db, 'tracks', claimTrackId.trim());
            const trackSnap = await getDoc(trackRef);

            if (!trackSnap.exists()) {
                toast.error('Трек з таким ID не знайдено.');
                setClaimingTrack(false);
                return;
            }

            const trackData = trackSnap.data();
            const previousAuthorId = trackData.authorId;

            if (previousAuthorId === uid) {
                toast.error('Цей трек вже належить цьому артисту!');
                setClaimingTrack(false);
                return;
            }

            // Update track 
            await updateDoc(trackRef, {
                authorId: uid,
                authorNickname: user.nickname,
                authorName: user.displayName,
                contentType: 'original',
            });

            // Reward Discoverer badge
            if (previousAuthorId) {
                const prevAuthorRef = doc(db, 'users', previousAuthorId);
                const prevAuthorSnap = await getDoc(prevAuthorRef);
                if (prevAuthorSnap.exists()) {
                    const prevBadges = prevAuthorSnap.data().badges || [];
                    if (!prevBadges.includes('discoverer')) {
                        await updateDoc(prevAuthorRef, { badges: [...prevBadges, 'discoverer'] });
                    }
                }
            }

            toast.success('Трек успішно передано!');
            setClaimTrackId('');
        } catch (error) {
            console.error(error);
            toast.error(`Помилка: ${error.message}`);
        } finally {
            setClaimingTrack(false);
        }
    };

    // ── Ban / Unban ────────────────────────────────────────────────────────────
    const isBanned = roles.includes('banned');
    const toggleBan = () => {
        const newRoles = isBanned
            ? roles.filter(r => r !== 'banned')
            : [...roles, 'banned'];
        saveRoles(newRoles);
    };

    // ── Computed ───────────────────────────────────────────────────────────────
    const used = user ? getCurrentMonthUsage(user) : 0;
    const limit = user ? getEffectiveLimit(user) : 10;
    const usagePct = Math.min(100, Math.round((used / limit) * 100));
    const usageColor = used >= limit ? 'var(--red)' : used >= limit - 2 ? 'var(--yellow)' : 'var(--accent)';
    const hasOverride = user?.uploadLimitOverride != null;

    // ── Render ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="page-wrap">
                <div className="adm-table-loading">
                    <span className="adm-spinner" /> Завантаження...
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="page-wrap ud-page">

            {/* Back */}
            <button className="ud-back-btn" onClick={() => navigate('/users')}>
                <IcoArrowLeft /> Назад до юзерів
            </button>

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">@{user.nickname || 'N/A'}</h1>
                    <p className="page-subtitle">{user.email}</p>
                </div>
                <a
                    href={`${MAIN_APP_URL}/${user.nickname}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adm-btn adm-btn--ghost"
                >
                    <IcoExternal /> Профіль на Knitly
                </a>
            </div>

            {/* Layout */}
            <div className="ud-layout">

                {/* ── Left column ─────────────────────────────────────────── */}
                <div className="ud-left">

                    {/* Profile card */}
                    <div className="ud-card">
                        <div className="ud-profile-head">
                            {user.photoURL
                                ? <img src={user.photoURL} alt={user.displayName} className="ud-avatar-img" />
                                : <div className="ud-avatar-placeholder">{(user.nickname?.[0] || '?').toUpperCase()}</div>
                            }
                            <div>
                                <div className="ud-display-name">{user.displayName || 'N/A'}</div>
                                <div className="ud-nickname">@{user.nickname}</div>
                            </div>
                        </div>

                        <div className="ud-info-list">
                            <div className="ud-info-row">
                                <span className="ud-info-key"><IcoMail /> Email</span>
                                <span className="ud-info-val">{user.email || '—'}</span>
                            </div>
                            <div className="ud-info-row">
                                <span className="ud-info-key"><IcoCalendar /> Реєстрація</span>
                                <span className="ud-info-val">{formatDate(user.createdAt)}</span>
                            </div>
                            <div className="ud-info-row">
                                <span className="ud-info-key"><IcoShield /> План</span>
                                <span className="ud-info-val">
                                    {user.plan === 'premium' ? '✦ Premium' : 'Free'}
                                </span>
                            </div>
                            <div className="ud-info-row">
                                <span className="ud-info-key"><IcoUser /> UID</span>
                                <span className="ud-info-val ud-mono">{uid.slice(0, 14)}…</span>
                            </div>
                            <div className="ud-info-row">
                                <span className="ud-info-key"><IcoUser /> Статус</span>
                                <span className={`badge ${isBanned ? 'badge--dismissed' : 'badge--resolved'}`}>
                                    {isBanned ? 'Заблоковано' : 'Активний'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Recent tracks */}
                    <div className="ud-card" style={{ marginTop: '1rem' }}>
                        <div className="ud-section-title">Останні треки</div>
                        {tracks.length === 0
                            ? <div className="ud-empty">Треків поки немає</div>
                            : (
                                <div className="ud-tracks-list">
                                    {tracks.map(t => (
                                        <div key={t.id} className="ud-track-item">
                                            {t.coverArtURL
                                                ? <img src={t.coverArtURL} alt={t.title} className="ud-track-cover" />
                                                : <div className="ud-track-cover ud-track-cover--placeholder"><IcoMusic /></div>
                                            }
                                            <div className="ud-track-info">
                                                <div className="ud-track-title">{t.title || 'Без назви'}</div>
                                                <div className="ud-track-meta">
                                                    {t.genre && <span>{t.genre}</span>}
                                                    {t.contentType && t.contentType !== 'original' && (
                                                        <span className="ud-content-type">{t.contentType}</span>
                                                    )}
                                                    {t.isExplicit && <span className="ud-explicit-chip">E</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        }
                    </div>
                </div>

                {/* ── Right column ─────────────────────────────────────────── */}
                <div className="ud-right">

                    {/* Roles */}
                    <div className="ud-card">
                        <div className="ud-section-title">Ролі</div>
                        <div className="roles-toggle-group">
                            {ROLES_ALL.map(role => (
                                <button
                                    key={role}
                                    className={`role-toggle ${roles.includes(role) ? `role-toggle--active role-toggle--${role}` : ''}`}
                                    onClick={() => toggleRole(role)}
                                    disabled={saving}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                        <div className="ud-section-note">
                            Натисніть роль, щоб додати або зняти — зміни зберігаються одразу.
                        </div>
                    </div>

                    {/* Upload limits */}
                    <div className="ud-card">
                        <div className="ud-section-title">Ліміти завантажень</div>

                        {/* Usage bar */}
                        <div className="ud-usage-row">
                            <span className="ud-usage-label">Цього місяця:</span>
                            <span className="ud-usage-val" style={{ color: usageColor }}>
                                {used} / {limit}
                            </span>
                            {hasOverride && <span className="ud-override-chip">Кастомний</span>}
                        </div>
                        <div className="ud-progress-bar">
                            <div
                                className="ud-progress-fill"
                                style={{ width: `${usagePct}%`, background: usageColor }}
                            />
                        </div>

                        {/* Form */}
                        <div className="ud-limit-grid">
                            <div className="ud-limit-field">
                                <label className="ud-label">Місячний ліміт</label>
                                <input
                                    type="number"
                                    className="ud-input"
                                    value={limitValue}
                                    onChange={e => setLimitValue(e.target.value)}
                                    placeholder={`${limit} (поточний)`}
                                    min="0"
                                    max="9999"
                                />
                                <div className="ud-hint">
                                    Залиште порожнім для стандарту ({PLAN_DEFAULTS[user.plan ?? 'free'] ?? 10}/міс)
                                </div>
                            </div>
                            <div className="ud-limit-field">
                                <label className="ud-label">Термін дії</label>
                                <label className="ud-checkbox-row">
                                    <input
                                        type="checkbox"
                                        checked={neverExpires}
                                        onChange={e => setNeverExpires(e.target.checked)}
                                    />
                                    <span>Без обмеження</span>
                                </label>
                                {!neverExpires && (
                                    <input
                                        type="date"
                                        className="ud-input ud-input--date"
                                        value={limitExpiry}
                                        onChange={e => setLimitExpiry(e.target.value)}
                                        min={new Date().toISOString().slice(0, 10)}
                                        style={{ marginTop: '0.375rem' }}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="ud-limit-actions">
                            <button
                                className="adm-btn adm-btn--primary"
                                onClick={saveLimits}
                                disabled={saving}
                            >
                                Зберегти ліміт
                            </button>
                            {hasOverride && (
                                <button
                                    className="adm-btn adm-btn--ghost"
                                    onClick={resetLimits}
                                    disabled={saving}
                                >
                                    Скинути до стандарту
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="ud-card">
                        <div className="ud-section-title">Значки</div>
                        <div className="ud-badges-grid">
                            {BADGE_DEFS.map(b => {
                                const active = badges.includes(b.key);
                                return (
                                    <button
                                        key={b.key}
                                        className={`ud-badge-btn ${active ? 'ud-badge-btn--active' : ''}`}
                                        style={active
                                            ? { background: b.bg, borderColor: b.border, color: b.color }
                                            : {}
                                        }
                                        onClick={() => toggleBadge(b.key)}
                                    >
                                        {active && <span className="ud-check"><IcoCheck /></span>}
                                        {b.label}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            className="adm-btn adm-btn--primary"
                            onClick={saveBadges}
                            disabled={saving}
                            style={{ marginTop: '0.875rem' }}
                        >
                            Зберегти значки
                        </button>
                    </div>

                    {/* Artist Claim System */}
                    <div className="ud-card">
                        <div className="ud-section-title">Artist Claim System</div>
                        <div className="ud-section-note" style={{ marginBottom: '1rem' }}>
                            Передає права на трек ({claimTrackId || 'ID'}) цьому користувачу.
                            Попередній автор отримає бейдж "Discoverer".
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                className="ud-input"
                                placeholder="ID треку (напр. abc123def456)"
                                value={claimTrackId}
                                onChange={e => setClaimTrackId(e.target.value)}
                                disabled={claimingTrack}
                                style={{ flex: 1 }}
                            />
                            <button
                                className="adm-btn adm-btn--primary"
                                onClick={handleClaimTrack}
                                disabled={claimingTrack || !claimTrackId.trim()}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                <IcoCompass /> Передати
                            </button>
                        </div>
                    </div>

                    {/* Danger zone */}
                    <div className="ud-card ud-card--danger">
                        <div className="ud-section-title ud-section-title--danger">Небезпечна зона</div>
                        <div className="ud-danger-row">
                            <div>
                                <div className="ud-danger-action-title">
                                    {isBanned ? 'Розблокувати акаунт' : 'Заблокувати акаунт'}
                                </div>
                                <div className="ud-danger-desc">
                                    {isBanned
                                        ? 'Юзер знову зможе входити та завантажувати контент.'
                                        : 'Юзер не зможе входити або завантажувати контент.'
                                    }
                                </div>
                            </div>
                            <button
                                className={`adm-btn ${isBanned ? 'adm-btn--unban' : 'adm-btn--ban'}`}
                                onClick={toggleBan}
                                disabled={saving}
                            >
                                {isBanned ? 'Розблокувати' : 'Заблокувати'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
