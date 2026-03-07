import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext.jsx';
import toast from 'react-hot-toast';

// ── SVG-іконки ────────────────────────────────────────────────────────────────
const IcoDashboard = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
const IcoReports   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoUsers     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const IcoShield    = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.47-2.34 6.71-6 7.93-3.66-1.22-6-4.46-6-7.93V7.67L12 5z"/></svg>;
const IcoLogout    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcoMenu      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IcoClose     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const NAV = [
    { to: '/',        label: 'Дашборд',   Icon: IcoDashboard, end: true },
    { to: '/reports', label: 'Скарги',    Icon: IcoReports              },
    { to: '/users',   label: 'Юзери',     Icon: IcoUsers                },
];

export default function AdminLayout({ children }) {
    const { adminUser, logout } = useAdminAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        toast.success('До побачення!');
        navigate('/login', { replace: true });
    };

    const nickname = adminUser?.nickname || adminUser?.email?.split('@')[0] || 'Admin';

    return (
        <div className="adm-shell">
            {/* ── Sidebar overlay (mobile) ────────────────────────────── */}
            {sidebarOpen && (
                <div
                    className="adm-sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ─────────────────────────────────────────────── */}
            <aside className={`adm-sidebar ${sidebarOpen ? 'adm-sidebar--open' : ''}`}>
                {/* Brand */}
                <div className="adm-brand">
                    <span className="adm-brand-icon"><IcoShield /></span>
                    <div>
                        <span className="adm-brand-name">Knitly</span>
                        <span className="adm-brand-suffix"> Admin</span>
                    </div>
                </div>

                {/* Nav links */}
                <nav className="adm-nav">
                    {NAV.map(({ to, label, Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `adm-nav-link ${isActive ? 'adm-nav-link--active' : ''}`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="adm-nav-icon"><Icon /></span>
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* User + Logout */}
                <div className="adm-sidebar-footer">
                    <div className="adm-sidebar-user">
                        <div className="adm-sidebar-user-avatar">
                            {nickname[0].toUpperCase()}
                        </div>
                        <div className="adm-sidebar-user-info">
                            <span className="adm-sidebar-user-nick">@{nickname}</span>
                            <span className="adm-sidebar-user-role">Administrator</span>
                        </div>
                    </div>
                    <button
                        className="adm-logout-btn"
                        onClick={handleLogout}
                        title="Вийти"
                    >
                        <IcoLogout />
                    </button>
                </div>
            </aside>

            {/* ── Main ────────────────────────────────────────────────── */}
            <div className="adm-main">
                {/* Top bar (mobile) */}
                <header className="adm-topbar">
                    <button
                        className="adm-topbar-menu-btn"
                        onClick={() => setSidebarOpen(s => !s)}
                        aria-label="Меню"
                    >
                        {sidebarOpen ? <IcoClose /> : <IcoMenu />}
                    </button>
                    <span className="adm-topbar-title">
                        <span className="adm-brand-icon-sm"><IcoShield /></span>
                        Knitly Admin
                    </span>
                </header>

                {/* Page content */}
                <div className="adm-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
