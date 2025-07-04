import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserContext } from '../../contexts/UserContext';

const CreatorRoute = ({ children }) => {
    const { user, authLoading } = useUserContext();

    if (authLoading) {
        return <div>Перевірка доступу...</div>;
    }

    if (user && (user.roles?.includes('admin') || user.roles?.includes('creator'))) {
        return children;
    }

    return <Navigate to="/" replace />;
};

export default CreatorRoute;