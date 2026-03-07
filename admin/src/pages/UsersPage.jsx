import React, { useState, useEffect, useCallback } from 'react';
import {
    collection, query, orderBy, getDocs, limit, startAfter,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase.js';
import toast from 'react-hot-toast';

// ── Icons ──────────────────────────────────────────────────────────────────────
const IcoSearch  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoArrow   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="9 18 15 12 9 6"/></svg>;

const PAGE_SIZE = 25;

const formatDate = (ts) => {
    if (!ts) return '—';
    return ts.toDate().toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── User row ───────────────────────────────────────────────────────────────────
function UserRow({ user }) {
    const navigate = useNavigate();
    const isBanned = (user.roles || []).includes('banned');

    return (
        <tr
            className="report-row"
            onClick={() => navigate(`/users/${user.id}`)}
        >
            <td className="td-user">
                <div className="user-cell">
                    <div
                        className="user-avatar-sm"
                        style={{ backgroundImage: user.photoURL ? `url(${user.photoURL})` : 'none' }}
                    >
                        {!user.photoURL && (user.nickname?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                        <span className="user-nick">@{user.nickname || '—'}</span>
                        <span className="user-email dim">{user.email || '—'}</span>
                    </div>
                </div>
            </td>
            <td className="td-date">{formatDate(user.createdAt)}</td>
            <td className="td-roles">
                {(user.roles || []).length > 0
                    ? (user.roles || []).map(r => (
                        <span key={r} className={`role-chip role-chip--${r}`}>{r}</span>
                    ))
                    : <span className="dim">user</span>
                }
            </td>
            <td className="td-status">
                <span className={`badge ${isBanned ? 'badge--dismissed' : 'badge--resolved'}`}>
                    {isBanned ? 'Заблоковано' : 'Активний'}
                </span>
            </td>
            <td className="td-chevron">
                <span className="row-chevron" style={{ transform: 'rotate(-90deg)', color: 'var(--text3)' }}>
                    <IcoArrow />
                </span>
            </td>
        </tr>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function UsersPage() {
    const [users,      setUsers]      = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [lastDoc,    setLastDoc]    = useState(null);
    const [hasMore,    setHasMore]    = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = useCallback(async (after = null, reset = false) => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'users'),
                orderBy('createdAt', 'desc'),
                limit(PAGE_SIZE + 1),
                ...(after ? [startAfter(after)] : [])
            );
            const snap = await getDocs(q);
            const docs = snap.docs.slice(0, PAGE_SIZE).map(d => ({ id: d.id, ...d.data() }));
            setUsers(prev => reset ? docs : [...prev, ...docs]);
            setHasMore(snap.docs.length > PAGE_SIZE);
            setLastDoc(snap.docs[PAGE_SIZE - 1] || null);
        } catch (err) {
            toast.error('Помилка завантаження: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(null, true); }, [fetchUsers]);

    // Local search by nickname / email
    const filtered = searchTerm.trim()
        ? users.filter(u =>
            u.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : users;

    return (
        <div className="page-wrap">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Юзери</h1>
                    <p className="page-subtitle">Управління акаунтами та ролями</p>
                </div>
            </div>

            {/* Search */}
            <div className="search-bar">
                <IcoSearch />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Пошук за нікнеймом або email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="adm-table-wrap">
                {loading && users.length === 0 ? (
                    <div className="adm-table-loading">
                        <span className="adm-spinner" /> Завантаження...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="adm-table-empty">Нічого не знайдено</div>
                ) : (
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Користувач</th>
                                <th>Реєстрація</th>
                                <th>Ролі</th>
                                <th>Статус</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <UserRow key={u.id} user={u} />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Load more */}
            {hasMore && !searchTerm && (
                <div className="adm-load-more">
                    <button
                        className="adm-btn adm-btn--ghost"
                        onClick={() => fetchUsers(lastDoc)}
                        disabled={loading}
                    >
                        {loading ? <span className="adm-spinner adm-spinner--sm" /> : 'Завантажити ще'}
                    </button>
                </div>
            )}
        </div>
    );
}
