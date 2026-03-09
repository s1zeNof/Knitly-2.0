import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './contexts/AdminAuthContext.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import UserDetailPage from './pages/UserDetailPage.jsx';
import GiftsPage from './pages/GiftsPage.jsx';

// ── Guard: перенаправляє неадмінів на /login ──────────────────────────────
const ProtectedRoute = ({ children }) => {
    const { adminUser, authLoading } = useAdminAuth();
    if (authLoading) return <div className="adm-auth-loading"><span className="adm-spinner" /></div>;
    return adminUser ? children : <Navigate to="/login" replace />;
};

// ── Redirect якщо вже залогінений ─────────────────────────────────────────
const PublicRoute = ({ children }) => {
    const { adminUser, authLoading } = useAdminAuth();
    if (authLoading) return <div className="adm-auth-loading"><span className="adm-spinner" /></div>;
    return adminUser ? <Navigate to="/" replace /> : children;
};

export default function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={<PublicRoute><LoginPage /></PublicRoute>}
            />
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <AdminLayout>
                            <Routes>
                                <Route index element={<DashboardPage />} />
                                <Route path="reports" element={<ReportsPage />} />
                                <Route path="users" element={<UsersPage />} />
                                <Route path="users/:uid" element={<UserDetailPage />} />
                                <Route path="gifts" element={<GiftsPage />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}
