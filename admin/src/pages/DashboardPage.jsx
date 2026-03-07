import React, { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../firebase.js';
import UnclaimedTracksTable from '../components/UnclaimedTracksTable.jsx';

const IcoUsers = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
const IcoPosts = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
const IcoReports = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const IcoTracks = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;

const StatCard = ({ label, value, color, Icon, note }) => (
    <div className="dash-stat-card">
        <div className="dash-stat-icon" style={{ background: `${color}18`, color }}>
            <Icon />
        </div>
        <div className="dash-stat-body">
            <span className="dash-stat-value">{value ?? '—'}</span>
            <span className="dash-stat-label">{label}</span>
            {note && <span className="dash-stat-note">{note}</span>}
        </div>
    </div>
);

export default function DashboardPage() {
    const [stats, setStats] = useState({
        users: null,
        posts: null,
        tracks: null,
        reportsPending: null,
    });

    useEffect(() => {
        (async () => {
            try {
                const [users, posts, tracks, reportsPending] = await Promise.all([
                    getCountFromServer(collection(db, 'users')),
                    getCountFromServer(collection(db, 'posts')),
                    getCountFromServer(collection(db, 'tracks')),
                    getCountFromServer(
                        query(collection(db, 'reports'), where('status', '==', 'pending'))
                    ),
                ]);
                setStats({
                    users: users.data().count,
                    posts: posts.data().count,
                    tracks: tracks.data().count,
                    reportsPending: reportsPending.data().count,
                });
            } catch (err) {
                console.error('Dashboard stats error:', err);
            }
        })();
    }, []);

    return (
        <div className="page-wrap">
            <div className="page-header">
                <h1 className="page-title">Дашборд</h1>
                <p className="page-subtitle">Загальний огляд платформи Knitly</p>
            </div>

            <div className="dash-stats-grid">
                <StatCard
                    label="Користувачів"
                    value={stats.users?.toLocaleString('uk')}
                    color="#3b82f6"
                    Icon={IcoUsers}
                />
                <StatCard
                    label="Дописів"
                    value={stats.posts?.toLocaleString('uk')}
                    color="#22c55e"
                    Icon={IcoPosts}
                />
                <StatCard
                    label="Треків"
                    value={stats.tracks?.toLocaleString('uk')}
                    color="#a855f7"
                    Icon={IcoTracks}
                />
                <StatCard
                    label="Скарг на розгляді"
                    value={stats.reportsPending?.toLocaleString('uk')}
                    color={stats.reportsPending > 0 ? '#f59e0b' : '#6b7280'}
                    Icon={IcoReports}
                    note={stats.reportsPending > 0 ? 'Потребують уваги' : null}
                />
            </div>

            <div className="dash-quick-links">
                <h2 className="dash-section-title">Швидкий доступ</h2>
                <div className="dash-quick-grid">
                    <a href="/reports" className="dash-quick-card">
                        <IcoReports />
                        <span>Переглянути скарги</span>
                    </a>
                    <a href="/users" className="dash-quick-card">
                        <IcoUsers />
                        <span>Керування юзерами</span>
                    </a>
                </div>
            </div>

            <UnclaimedTracksTable />
        </div>
    );
}
