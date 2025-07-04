import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { db } from './firebase';
// --- ВИПРАВЛЕННЯ: Додано 'limit' до списку імпортів ---
import { collection, query, orderBy, getDocs, writeBatch, doc, limit } from 'firebase/firestore';
import { useUserContext } from './UserContext';
import NotificationItem from './NotificationItem';
import './NotificationsPage.css';

// Функція для завантаження сповіщень
const fetchNotifications = async (userId) => {
    if (!userId) return [];
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const NotificationsPage = () => {
    const { user: currentUser, authLoading } = useUserContext();
    const queryClient = useQueryClient();

    const { data: notifications, isLoading } = useQuery(
        ['notifications', currentUser?.uid],
        () => fetchNotifications(currentUser.uid),
        {
            enabled: !!currentUser
        }
    );

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    // Мутація для позначення всіх сповіщень як прочитаних
    const markAllAsReadMutation = useMutation(
        async () => {
            if (!currentUser || unreadCount === 0) return;
            const batch = writeBatch(db);
            const unreadNotifications = notifications.filter(n => !n.read);
            unreadNotifications.forEach(notification => {
                const notifRef = doc(db, 'users', currentUser.uid, 'notifications', notification.id);
                batch.update(notifRef, { read: true });
            });
            await batch.commit();
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['notifications', currentUser?.uid]);
            }
        }
    );

    if (authLoading || isLoading) {
        return <div className="notifications-page-container"><div className="loader">Завантаження...</div></div>;
    }

    return (
        <div className="notifications-page-container">
            <header className="notifications-header">
                <h1>Сповіщення</h1>
                {unreadCount > 0 && (
                    <button 
                        className="mark-all-read-btn"
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isLoading}
                    >
                        Позначити всі як прочитані
                    </button>
                )}
            </header>

            <div className="notifications-list">
                {notifications && notifications.length > 0 ? (
                    notifications.map(notification => (
                        <NotificationItem key={notification.id} notification={notification} />
                    ))
                ) : (
                    <div className="no-notifications-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        <h3>Тут поки що тихо</h3>
                        <p>Ми повідомимо вас про нові лайки, коментарі та підписників.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;