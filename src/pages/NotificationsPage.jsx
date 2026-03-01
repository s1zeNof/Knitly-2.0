import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, orderBy, getDocs, writeBatch, doc, updateDoc, limit } from 'firebase/firestore';
import { useUserContext } from '../contexts/UserContext';
import LeftSidebar from '../components/layout/LeftSidebar';
import NotificationItem from '../components/notifications/NotificationItem';
import './NotificationsPage.css';

/* ── Tab SVG icons ── */
const TabIconAll = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /><line x1="12" y1="2" x2="12" y2="3" /></svg>;
const TabIconActivity = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>;
const TabIconFollow = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V8H4v2H2v2h2v2h2v-2h2v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>;
const TabIconMention = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" /></svg>;

const TABS = [
    { id: 'all', label: 'Всі', Icon: TabIconAll },
    { id: 'activity', label: 'Активність', Icon: TabIconActivity },
    { id: 'followers', label: 'Підписники', Icon: TabIconFollow },
    { id: 'mentions', label: 'Згадки', Icon: TabIconMention },
];

const ACTIVITY_TYPES = ['post_like', 'post_comment', 'track_like', 'comment_like'];
const FOLLOWER_TYPES = ['new_follower'];
const MENTION_TYPES = ['mention_post'];

const filterByTab = (items, tab) => {
    switch (tab) {
        case 'activity': return items.filter(n => ACTIVITY_TYPES.includes(n.type));
        case 'followers': return items.filter(n => FOLLOWER_TYPES.includes(n.type));
        case 'mentions': return items.filter(n => MENTION_TYPES.includes(n.type));
        default: return items;
    }
};

const groupByTime = (items) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const today = [], yesterday = [], earlier = [];
    items.forEach(n => {
        if (!n.timestamp) { earlier.push(n); return; }
        const d = n.timestamp.toDate();
        if (d >= todayStart) today.push(n);
        else if (d >= yesterdayStart) yesterday.push(n);
        else earlier.push(n);
    });
    return { today, yesterday, earlier };
};

const fetchNotifications = async (userId) => {
    if (!userId) return [];
    const ref = collection(db, 'users', userId, 'notifications');
    const q = query(ref, orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/* ── Skeleton ── */
const SkeletonItem = () => (
    <div className="notif-skeleton">
        <div className="notif-skeleton-avatar" />
        <div className="notif-skeleton-body">
            <div className="notif-skeleton-line long" />
            <div className="notif-skeleton-line short" />
        </div>
    </div>
);

const EMPTY_HINTS = {
    all: 'Ми повідомимо вас про нові лайки, коментарі та підписників.',
    activity: 'Тут з\'являться лайки та коментарі до вашого контенту.',
    followers: 'Тут з\'являться нові підписники.',
    mentions: 'Тут з\'являться згадки вас у дописах.',
};

const BellIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const getNavigationUrl = (notification) => {
    const { type, entityLink, postId, commentId, trackId, fromUser } = notification;

    if (entityLink) return entityLink;

    switch (type) {
        case 'post_like':
        case 'post_comment':
        case 'mention_post':
            if (postId) return `/post/${postId}${commentId ? `#comment-${commentId}` : ''}`;
            return null;
        case 'comment_like':
            if (postId && commentId) return `/post/${postId}#comment-${commentId}`;
            if (postId) return `/post/${postId}`;
            return null;
        case 'track_like':
            if (trackId) return `/track/${trackId}`;
            return null;
        case 'new_follower':
            return fromUser?.nickname ? `/${fromUser.nickname}` : null;
        default:
            return fromUser?.nickname ? `/${fromUser.nickname}` : null;
    }
};

const NotificationsPage = () => {
    const { user: currentUser, authLoading } = useUserContext();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');

    const { data: notifications = [], isLoading } = useQuery(
        ['notifications', currentUser?.uid],
        () => fetchNotifications(currentUser.uid),
        { enabled: !!currentUser }
    );

    const filtered = useMemo(() => filterByTab(notifications, activeTab), [notifications, activeTab]);
    const { today, yesterday, earlier } = useMemo(() => groupByTime(filtered), [filtered]);
    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
    const getTabUnread = useCallback((tab) => filterByTab(notifications, tab).filter(n => !n.read).length, [notifications]);

    const markAllMutation = useMutation(
        async () => {
            if (!currentUser || unreadCount === 0) return;
            const batch = writeBatch(db);
            notifications
                .filter(n => !n.read)
                .forEach(n => batch.update(doc(db, 'users', currentUser.uid, 'notifications', n.id), { read: true }));
            await batch.commit();
        },
        { onSuccess: () => queryClient.invalidateQueries(['notifications', currentUser?.uid]) }
    );

    const handleNotifClick = useCallback(async (notification) => {
        // mark as read
        if (!notification.read && currentUser) {
            await updateDoc(doc(db, 'users', currentUser.uid, 'notifications', notification.id), { read: true });
            queryClient.invalidateQueries(['notifications', currentUser?.uid]);
        }
        // navigate
        const url = getNavigationUrl(notification);
        if (url) navigate(url);
    }, [currentUser, navigate, queryClient]);

    const renderGroup = (label, items) => {
        if (!items.length) return null;
        return (
            <div className="notif-group" key={label}>
                <div className="notif-group-label">
                    <span>{label}</span>
                </div>
                {items.map(n => (
                    <NotificationItem
                        key={n.id}
                        notification={n}
                        onRead={handleNotifClick}
                    />
                ))}
            </div>
        );
    };

    const isEmpty = !isLoading && filtered.length === 0;

    return (
        <div className="home-container">
            <LeftSidebar isOpen={true} />
            <main className="main-content notif-main">
                <div className="notif-page">
                    {/* Sticky header */}
                    <div className="notif-sticky-header">
                        <div className="notif-title-row">
                            <div className="notif-title-left">
                                <h1>Сповіщення</h1>
                                {unreadCount > 0 && (
                                    <span className="notif-unread-pill">{unreadCount} нових</span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    className="notif-mark-all-btn"
                                    onClick={() => markAllMutation.mutate()}
                                    disabled={markAllMutation.isLoading}
                                >
                                    {markAllMutation.isLoading ? '...' : 'Позначити всі прочитаними'}
                                </button>
                            )}
                        </div>

                        <div className="notif-tabs">
                            {TABS.map(tab => {
                                const cnt = getTabUnread(tab.id);
                                return (
                                    <button
                                        key={tab.id}
                                        className={`notif-tab ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <span className="notif-tab-icon"><tab.Icon /></span>
                                        {tab.label}
                                        {cnt > 0 && <span className="notif-tab-badge">{cnt}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="notif-body">
                        {(authLoading || isLoading) ? (
                            <div className="notif-skeleton-list">
                                {Array.from({ length: 7 }).map((_, i) => <SkeletonItem key={i} />)}
                            </div>
                        ) : isEmpty ? (
                            <div className="notif-empty">
                                <div className="notif-empty-icon"><BellIcon /></div>
                                <h3>Тут поки що тихо</h3>
                                <p>{EMPTY_HINTS[activeTab]}</p>
                            </div>
                        ) : (
                            <>
                                {renderGroup('Сьогодні', today)}
                                {renderGroup('Вчора', yesterday)}
                                {renderGroup('Раніше', earlier)}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default NotificationsPage;
