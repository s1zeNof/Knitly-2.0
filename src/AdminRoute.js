import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserContext } from './UserContext';

const AdminRoute = ({ children }) => {
    const { user, authLoading } = useUserContext();

    if (authLoading) {
        // Поки йде перевірка автентифікації, показуємо заглушку
        return <div>Перевірка доступу...</div>;
    }

    // Якщо користувач залогінений і в його масиві roles є 'admin'
    if (user && user.roles?.includes('admin')) {
        return children; // Показуємо захищену сторінку (наприклад, AdminPage)
    }

    // В іншому випадку, перенаправляємо на головну сторінку
    return <Navigate to="/" replace />;
};

export default AdminRoute;