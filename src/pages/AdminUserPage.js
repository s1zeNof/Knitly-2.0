import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    doc, getDoc, updateDoc, Timestamp, collection,
    query, where, orderBy, limit, getDocs
} from 'firebase/firestore';
import { db } from '../services/firebase';
import {
    ChevronLeft, Shield, Upload, Music, Users, Heart,
    Star, Zap, Award, Calendar, Globe, MapPin, Mail,
    CheckCircle, XCircle, Ban, ExternalLink, Save, AlertTriangle, Compass
} from 'lucide-react';
import { getEffectiveLimit, getCurrentMonthUsage } from '../components/upload/UploadLimitBanner';
import default_picture from '../img/Default-Images/default-picture.svg';
import './AdminUserPage.css';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const PLAN_DEFAULTS = { free: 10, premium: 100 };

const ALL_ROLES = ['user', 'moderator', 'creator', 'admin', 'verified'];

const BADGES = [
    { id: 'early-adopter', label: 'Early Adopter', icon: Star },
    { id: 'beta-tester', label: 'Beta Tester', icon: Shield },
    { id: 'creator-plus', label: 'Creator+', icon: Zap },
    { id: 'vip', label: 'VIP', icon: Award },
    { id: 'discoverer', label: 'Discoverer', icon: Compass },
];

const BADGE_COLORS = {
    'early-adopter': '#fbbf24',
    'beta-tester': '#60a5fa',
    'creator-plus': '#c084fc',
    'vip': '#fb7185',
    'discoverer': '#10b981',
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const formatDate = (ts) => {
    if (!ts) return '—';
    const ms = ts?.toMillis ? ts.toMillis() : new Date(ts).getTime();
    return new Date(ms).toLocaleDateString('uk-UA', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
};

const toInputDate = (ts) => {
    if (!ts) return '';
    const ms = ts?.toMillis ? ts.toMillis() : new Date(ts).getTime();
    return new Date(ms).toISOString().slice(0, 10);
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className="aup-stat-card">
        <div className="aup-stat-icon" style={{ background: `${color}18`, color }}>
            <Icon size={18} />
        </div>
        <div className="aup-stat-body">
            <span className="aup-stat-value">{value}</span>
            <span className="aup-stat-label">{label}</span>
            {sub && <span className="aup-stat-sub">{sub}</span>}
        </div>
    </div>
);

/* ─── Component ──────────────────────────────────────────────────────────── */
const AdminUserPage = () => {
    const { uid } = useParams();
    const navigate = useNavigate();

    const [userData, setUserData] = useState(null);
    const [userTracks, setUserTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    /* Editable state */
    const [roles, setRoles] = useState([]);
    const [badges, setBadges] = useState([]);
    const [limitValue, setLimitValue] = useState('');
    const [neverExpires, setNeverExpires] = useState(true);
    const [expiryDate, setExpiryDate] = useState('');
    const [isBanned, setIsBanned] = useState(false);

    /* Save states */
    const [savingRoles, setSavingRoles] = useState(false);
    const [savingLimits, setSavingLimits] = useState(false);
    const [savingBan, setSavingBan] = useState(false);
    const [savedRoles, setSavedRoles] = useState(false);
    const [savedLimits, setSavedLimits] = useState(false);

    /* Claim state */
    const [claimTrackId, setClaimTrackId] = useState('');
    const [claimingTrack, setClaimingTrack] = useState(false);

    /* ── Load user ── */
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const userRef = doc(db, 'users', uid);
                const snap = await getDoc(userRef);
                if (!snap.exists()) {
                    setError('Користувача не знайдено');
                    setLoading(false);
                    return;
                }
                const data = { id: snap.id, ...snap.data() };
                setUserData(data);
                setRoles(data.roles ?? []);
                setBadges(data.badges ?? []);
                setIsBanned(data.status?.isBanned ?? false);

                const override = data.uploadLimitOverride;
                setLimitValue(String(override ?? PLAN_DEFAULTS[data.plan ?? 'free']));
                setNeverExpires(!data.uploadLimitOverrideExpiry);
                setExpiryDate(toInputDate(data.uploadLimitOverrideExpiry));

                /* Load recent tracks */
                const tracksQ = query(
                    collection(db, 'tracks'),
                    where('authorId', '==', uid),
                    orderBy('createdAt', 'desc'),
                    limit(6)
                );
                const tracksSnap = await getDocs(tracksQ);
                setUserTracks(tracksSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [uid]);

    /* ── Handlers ── */
    const toggleRole = (role) => {
        setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    };
    const toggleBadge = (id) => {
        setBadges(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
    };

    const handleSaveRoles = async () => {
        setSavingRoles(true);
        try {
            await updateDoc(doc(db, 'users', uid), { roles });
            setUserData(prev => ({ ...prev, roles }));
            setSavedRoles(true);
            setTimeout(() => setSavedRoles(false), 2000);
        } catch (e) {
            alert(`Помилка: ${e.message}`);
        } finally {
            setSavingRoles(false);
        }
    };

    const handleSaveLimits = async () => {
        const num = parseInt(limitValue, 10);
        if (isNaN(num) || num < 0) { alert('Введіть коректне число'); return; }
        setSavingLimits(true);
        try {
            let expiry = null;
            if (!neverExpires && expiryDate) {
                expiry = Timestamp.fromDate(new Date(expiryDate + 'T23:59:59'));
            }
            await updateDoc(doc(db, 'users', uid), {
                uploadLimitOverride: num,
                uploadLimitOverrideExpiry: expiry,
                badges,
            });
            setUserData(prev => ({ ...prev, uploadLimitOverride: num, uploadLimitOverrideExpiry: expiry, badges }));
            setSavedLimits(true);
            setTimeout(() => setSavedLimits(false), 2000);
        } catch (e) {
            alert(`Помилка: ${e.message}`);
        } finally {
            setSavingLimits(false);
        }
    };

    const handleToggleBan = async () => {
        const newBan = !isBanned;
        if (!window.confirm(`${newBan ? 'Заблокувати' : 'Розблокувати'} ${userData.displayName}?`)) return;
        setSavingBan(true);
        try {
            await updateDoc(doc(db, 'users', uid), { 'status.isBanned': newBan });
            setIsBanned(newBan);
            setUserData(prev => ({ ...prev, status: { ...prev.status, isBanned: newBan } }));
        } catch (e) {
            alert(`Помилка: ${e.message}`);
        } finally {
            setSavingBan(false);
        }
    };

    const handleResetLimit = async () => {
        const planDefault = PLAN_DEFAULTS[userData?.plan ?? 'free'];
        setSavingLimits(true);
        try {
            await updateDoc(doc(db, 'users', uid), {
                uploadLimitOverride: null,
                uploadLimitOverrideExpiry: null,
            });
            setLimitValue(String(planDefault));
            setNeverExpires(true);
            setExpiryDate('');
            setUserData(prev => ({ ...prev, uploadLimitOverride: null, uploadLimitOverrideExpiry: null }));
            setSavedLimits(true);
            setTimeout(() => setSavedLimits(false), 2000);
        } catch (e) {
            alert(`Помилка: ${e.message}`);
        } finally {
            setSavingLimits(false);
        }
    };

    const handleClaimTrack = async () => {
        if (!claimTrackId.trim()) return;
        if (!window.confirm(`Передати трек "${claimTrackId}" користувачу ${userData.displayName}?`)) return;

        setClaimingTrack(true);
        try {
            const trackRef = doc(db, 'tracks', claimTrackId.trim());
            const trackSnap = await getDoc(trackRef);

            if (!trackSnap.exists()) {
                alert('Трек з таким ID не знайдено.');
                setClaimingTrack(false);
                return;
            }

            const trackData = trackSnap.data();
            const previousAuthorId = trackData.authorId;

            if (previousAuthorId === uid) {
                alert('Цей трек вже належить цьому артисту.');
                setClaimingTrack(false);
                return;
            }

            // Оновлюємо трек
            await updateDoc(trackRef, {
                authorId: uid,
                contentType: 'original', // Змінюємо тип на оригінал
            });

            // Надаємо бейдж 'discoverer' попередньому розповсюджувачу
            if (previousAuthorId) {
                const prevAuthorRef = doc(db, 'users', previousAuthorId);
                const prevAuthorSnap = await getDoc(prevAuthorRef);
                if (prevAuthorSnap.exists()) {
                    const prevAuthorData = prevAuthorSnap.data();
                    const prevBadges = prevAuthorData.badges || [];
                    if (!prevBadges.includes('discoverer')) {
                        await updateDoc(prevAuthorRef, {
                            badges: [...prevBadges, 'discoverer']
                        });
                    }
                }
            }

            alert('Трек успішно передано!');
            setClaimTrackId('');
        } catch (error) {
            console.error(error);
            alert(`Помилка: ${error.message}`);
        } finally {
            setClaimingTrack(false);
        }
    };

    /* ── Render states ── */
    if (loading) {
        return (
            <div className="aup-page">
                <div className="aup-loader">Завантаження...</div>
            </div>
        );
    }

    if (error || !userData) {
        return (
            <div className="aup-page">
                <div className="aup-error">
                    <AlertTriangle size={32} />
                    <p>{error || 'Не вдалося завантажити дані'}</p>
                    <button className="aup-btn aup-btn--secondary" onClick={() => navigate('/admin')}>
                        Назад до панелі
                    </button>
                </div>
            </div>
        );
    }

    const effectiveLimit = getEffectiveLimit(userData);
    const usedThisMonth = getCurrentMonthUsage(userData);
    const usagePct = Math.min(100, (usedThisMonth / effectiveLimit) * 100);
    const currentMonth = new Date().toLocaleString('uk-UA', { month: 'long', year: 'numeric' });

    return (
        <div className="aup-page">
            <div className="aup-container">

                {/* ─── Topbar ─── */}
                <div className="aup-topbar">
                    <Link to="/admin" className="aup-back">
                        <ChevronLeft size={16} />
                        Панель адміністратора
                    </Link>
                    <div className="aup-topbar-actions">
                        <a
                            href={`/${userData.nickname}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aup-btn aup-btn--ghost"
                        >
                            <ExternalLink size={14} />
                            Профіль
                        </a>
                        <button
                            className={`aup-btn ${isBanned ? 'aup-btn--unban' : 'aup-btn--ban'}`}
                            onClick={handleToggleBan}
                            disabled={savingBan}
                        >
                            <Ban size={14} />
                            {isBanned ? 'Розблокувати' : 'Заблокувати'}
                        </button>
                    </div>
                </div>

                {/* ─── Main layout ─── */}
                <div className="aup-layout">

                    {/* ══ LEFT COLUMN ══ */}
                    <div className="aup-left">

                        {/* Profile card */}
                        <div className="aup-card aup-profile-card">
                            <div className="aup-profile-head">
                                <div className="aup-avatar-wrap">
                                    <img
                                        src={userData.photoURL || default_picture}
                                        alt={userData.displayName}
                                        className="aup-avatar"
                                    />
                                    {isBanned && (
                                        <span className="aup-banned-badge">
                                            <Ban size={11} /> Banned
                                        </span>
                                    )}
                                </div>
                                <div className="aup-profile-info">
                                    <h1 className="aup-display-name">{userData.displayName}</h1>
                                    <p className="aup-nickname">@{userData.nickname}</p>
                                    <div className="aup-role-chips">
                                        {(userData.roles ?? []).map(r => (
                                            <span key={r} className={`aup-role-chip aup-role-chip--${r}`}>{r}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {userData.description && (
                                <p className="aup-bio">{userData.description}</p>
                            )}

                            <div className="aup-meta-list">
                                <div className="aup-meta-row">
                                    <Mail size={13} />
                                    <span>{userData.email}</span>
                                    {userData.emailVerified
                                        ? <CheckCircle size={13} className="aup-verified-icon" />
                                        : <XCircle size={13} className="aup-unverified-icon" />}
                                </div>
                                {(userData.country || userData.city) && (
                                    <div className="aup-meta-row">
                                        <MapPin size={13} />
                                        <span>{[userData.city, userData.country].filter(Boolean).join(', ')}</span>
                                    </div>
                                )}
                                <div className="aup-meta-row">
                                    <Calendar size={13} />
                                    <span>Зареєстрований {formatDate(userData.createdAt)}</span>
                                </div>
                                {userData.plan && (
                                    <div className="aup-meta-row">
                                        <Globe size={13} />
                                        <span>Plan: <strong>{userData.plan}</strong></span>
                                    </div>
                                )}
                            </div>

                            {/* Badges display */}
                            {(userData.badges ?? []).length > 0 && (
                                <div className="aup-badges-display">
                                    {(userData.badges ?? []).map(b => {
                                        const badgeDef = BADGES.find(x => x.id === b);
                                        const Icon = badgeDef?.icon ?? Star;
                                        return (
                                            <span
                                                key={b}
                                                className="aup-badge-pill"
                                                style={{ color: BADGE_COLORS[b] ?? '#a855f7', borderColor: `${BADGE_COLORS[b] ?? '#a855f7'}40`, background: `${BADGE_COLORS[b] ?? '#a855f7'}12` }}
                                            >
                                                <Icon size={11} />
                                                {badgeDef?.label ?? b}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Stats grid */}
                        <div className="aup-stats-grid">
                            <StatCard icon={Music} label="Треків" value={userData.tracksCount ?? 0} color="#a855f7" />
                            <StatCard icon={Users} label="Підписники" value={(userData.followers ?? []).length} color="#3b82f6" />
                            <StatCard icon={Users} label="Підписки" value={(userData.following ?? []).length} color="#06b6d4" />
                            <StatCard icon={Heart} label="Уподобання" value={(userData.likedTracks ?? []).length} color="#f43f5e" />
                            <StatCard
                                icon={Upload}
                                label="Завантажено"
                                value={`${usedThisMonth}/${effectiveLimit}`}
                                sub={currentMonth}
                                color={usagePct >= 100 ? '#ef4444' : usagePct >= 80 ? '#f59e0b' : '#22c55e'}
                            />
                        </div>

                        {/* Recent tracks */}
                        {userTracks.length > 0 && (
                            <div className="aup-card">
                                <h3 className="aup-card-title">
                                    <Music size={15} />
                                    Останні треки
                                </h3>
                                <div className="aup-tracks-list">
                                    {userTracks.map(track => (
                                        <Link
                                            key={track.id}
                                            to={`/track/${track.id}`}
                                            target="_blank"
                                            className="aup-track-row"
                                        >
                                            <div className="aup-track-cover">
                                                {track.coverArtUrl
                                                    ? <img src={track.coverArtUrl} alt={track.title} />
                                                    : <Music size={16} />
                                                }
                                            </div>
                                            <div className="aup-track-info">
                                                <span className="aup-track-title">{track.title}</span>
                                                <span className="aup-track-meta">
                                                    {track.genre ?? ''}{track.genre && track.contentType ? ' · ' : ''}{track.contentType ?? ''}
                                                    {track.isExplicit && <span className="aup-explicit-tag">E</span>}
                                                </span>
                                            </div>
                                            <div className="aup-track-stats">
                                                <span>{track.playCount ?? 0} прослухань</span>
                                                <span>{formatDate(track.createdAt)}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ══ RIGHT COLUMN ══ */}
                    <div className="aup-right">

                        {/* Roles */}
                        <div className="aup-card">
                            <h3 className="aup-card-title">
                                <Shield size={15} />
                                Ролі
                            </h3>
                            <div className="aup-roles-grid">
                                {ALL_ROLES.map(role => (
                                    <label key={role} className={`aup-role-toggle ${roles.includes(role) ? 'aup-role-toggle--on' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={roles.includes(role)}
                                            onChange={() => toggleRole(role)}
                                            className="aup-sr-only"
                                        />
                                        <span className={`aup-role-dot aup-role-dot--${role}`} />
                                        {role}
                                    </label>
                                ))}
                            </div>
                            <button
                                className="aup-save-btn"
                                onClick={handleSaveRoles}
                                disabled={savingRoles}
                            >
                                {savedRoles ? <><CheckCircle size={14} /> Збережено</> : <><Save size={14} /> Зберегти ролі</>}
                            </button>
                        </div>

                        {/* Upload limits + Badges */}
                        <div className="aup-card">
                            <h3 className="aup-card-title">
                                <Upload size={15} />
                                Ліміт завантажень
                            </h3>

                            {/* Usage bar */}
                            <div className="aup-usage-block">
                                <div className="aup-usage-row">
                                    <span className="aup-usage-label">Використано цього місяця</span>
                                    <span className="aup-usage-val">{usedThisMonth} / {effectiveLimit}</span>
                                </div>
                                <div className="aup-usage-track">
                                    <div
                                        className="aup-usage-fill"
                                        style={{
                                            width: `${usagePct}%`,
                                            background: usagePct >= 100 ? '#ef4444' : usagePct >= 80 ? '#f59e0b' : '#a855f7'
                                        }}
                                    />
                                </div>
                                <p className="aup-usage-hint">
                                    Стандарт free: {PLAN_DEFAULTS.free} · premium: {PLAN_DEFAULTS.premium}
                                </p>
                            </div>

                            {/* Limit override */}
                            <div className="aup-limit-fields">
                                <div className="aup-field-group">
                                    <label className="aup-field-label">Кастомний ліміт (треків/міс)</label>
                                    <input
                                        type="number"
                                        className="aup-input"
                                        value={limitValue}
                                        onChange={e => setLimitValue(e.target.value)}
                                        min={0} max={9999}
                                        disabled={savingLimits}
                                    />
                                </div>
                                <div className="aup-field-group">
                                    <label className="aup-check-inline">
                                        <input
                                            type="checkbox"
                                            checked={neverExpires}
                                            onChange={e => setNeverExpires(e.target.checked)}
                                            disabled={savingLimits}
                                        />
                                        Без обмеження дати
                                    </label>
                                    {!neverExpires && (
                                        <input
                                            type="date"
                                            className="aup-input aup-input--date"
                                            value={expiryDate}
                                            onChange={e => setExpiryDate(e.target.value)}
                                            min={new Date().toISOString().slice(0, 10)}
                                            disabled={savingLimits}
                                        />
                                    )}
                                </div>
                            </div>

                            {userData.uploadLimitOverride != null && (
                                <button
                                    className="aup-reset-btn"
                                    onClick={handleResetLimit}
                                    disabled={savingLimits}
                                >
                                    Скинути до стандарту
                                </button>
                            )}

                            {/* Badges */}
                            <div className="aup-divider" />
                            <h4 className="aup-subsection-title">
                                <Star size={13} />
                                Значки
                            </h4>
                            <div className="aup-badges-toggles">
                                {BADGES.map(({ id, label, icon: Icon }) => {
                                    const active = badges.includes(id);
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            className={`aup-badge-toggle aup-badge-toggle--${id} ${active ? 'aup-badge-toggle--active' : ''}`}
                                            onClick={() => toggleBadge(id)}
                                            disabled={savingLimits}
                                        >
                                            <Icon size={13} />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                className="aup-save-btn"
                                onClick={handleSaveLimits}
                                disabled={savingLimits}
                            >
                                {savedLimits ? <><CheckCircle size={14} /> Збережено</> : <><Save size={14} /> Зберегти ліміт та значки</>}
                            </button>
                        </div>

                        {/* Artist Claim System */}
                        <div className="aup-card">
                            <h3 className="aup-card-title">
                                <Music size={15} />
                                Artist Claim System
                            </h3>
                            <p className="aup-danger-desc" style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: '12px' }}>
                                Передає права на трек цьому користувачу.
                                Попередній автор отримає бейдж "Discoverer".
                            </p>
                            <div className="aup-field-group">
                                <input
                                    type="text"
                                    className="aup-input"
                                    placeholder="ID треку (напр. abc123def456)"
                                    value={claimTrackId}
                                    onChange={e => setClaimTrackId(e.target.value)}
                                    disabled={claimingTrack}
                                />
                            </div>
                            <button
                                className="aup-btn aup-btn--primary aup-btn--full"
                                onClick={handleClaimTrack}
                                disabled={claimingTrack || !claimTrackId.trim()}
                                style={{ marginTop: '10px' }}
                            >
                                <Compass size={14} />
                                {claimingTrack ? 'Передача...' : 'Передати трек цьому артисту'}
                            </button>
                        </div>

                        {/* Danger zone */}
                        <div className="aup-card aup-card--danger">
                            <h3 className="aup-card-title aup-card-title--danger">
                                <AlertTriangle size={15} />
                                Зона небезпеки
                            </h3>
                            <p className="aup-danger-desc">
                                Блокування не видаляє акаунт — лише заважає юзеру авторизуватись.
                            </p>
                            <button
                                className={`aup-btn ${isBanned ? 'aup-btn--unban' : 'aup-btn--ban'} aup-btn--full`}
                                onClick={handleToggleBan}
                                disabled={savingBan}
                            >
                                <Ban size={14} />
                                {savingBan ? 'Оновлення...' : isBanned ? 'Розблокувати акаунт' : 'Заблокувати акаунт'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserPage;
