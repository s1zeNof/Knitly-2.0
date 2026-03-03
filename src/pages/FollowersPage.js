import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useUserContext } from '../contexts/UserContext';
import default_picture from '../img/Default-Images/default-picture.svg';
import VerifiedBadge from '../components/common/VerifiedBadge';
import './FollowersPage.css';

/* ---- Icons ---- */
const BackIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);

const LockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

/* ---- Helpers ---- */
async function fetchUsersByUids(uids) {
    if (!uids || uids.length === 0) return [];
    // Sanitise: keep only non-empty strings (guards against null/undefined in array)
    const cleanUids = uids.filter(uid => typeof uid === 'string' && uid.length > 0);
    if (cleanUids.length === 0) return [];
    // Use individual getDoc calls — avoids the where(documentId(),'in',[...]) path
    // that throws when the array happens to contain a null/undefined Firestore value.
    const snaps = await Promise.all(cleanUids.map(uid => getDoc(doc(db, 'users', uid))));
    return snaps.filter(d => d.exists()).map(d => ({ uid: d.id, ...d.data() }));
}

/* ---- UserCard ---- */
const UserCard = ({ user, currentUser, onFollowChange }) => {
    const navigate = useNavigate();
    const isOwnCard = currentUser?.uid === user.uid;
    const [following, setFollowing] = useState(
        () => currentUser?.following?.includes(user.uid) ?? false
    );
    const [loading, setLoading] = useState(false);

    const handleFollow = async (e) => {
        e.stopPropagation();
        if (!currentUser || loading) return;
        setLoading(true);
        try {
            const currentRef = doc(db, 'users', currentUser.uid);
            const targetRef = doc(db, 'users', user.uid);
            if (following) {
                await Promise.all([
                    updateDoc(currentRef, { following: arrayRemove(user.uid) }),
                    updateDoc(targetRef, { followers: arrayRemove(currentUser.uid) }),
                ]);
                setFollowing(false);
            } else {
                await Promise.all([
                    updateDoc(currentRef, { following: arrayUnion(user.uid) }),
                    updateDoc(targetRef, { followers: arrayUnion(currentUser.uid) }),
                ]);
                setFollowing(true);
            }
            onFollowChange?.();
        } catch (err) {
            console.error('Follow error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="follower-card" onClick={() => navigate(`/${user.nickname}`)}>
            <img
                src={user.photoURL || default_picture}
                alt=""
                className="follower-avatar"
                onError={e => { e.target.onerror = null; e.target.src = default_picture; }}
            />
            <div className="follower-info">
                <span className="follower-name">
                    {user.displayName || user.nickname}
                    {/* 🔮 кастомні емоджі тут у майбутньому */}
                    {user.roles?.includes('verified') && <VerifiedBadge size="sm" />}
                </span>
                <span className="follower-nick">@{user.nickname}</span>
                {user.description && (
                    <p className="follower-bio">{user.description}</p>
                )}
                <span className="follower-sub-count">
                    {(user.followers?.length || 0).toLocaleString()} підписників
                </span>
            </div>
            {!isOwnCard && currentUser && (
                <button
                    className={`follower-follow-btn${following ? ' following' : ''}`}
                    onClick={handleFollow}
                    disabled={loading}
                >
                    {loading ? '...' : following ? 'Відписатись' : 'Підписатись'}
                </button>
            )}
        </div>
    );
};

/* ---- Skeleton ---- */
const SkeletonCard = () => (
    <div className="follower-card skeleton">
        <div className="follower-avatar skeleton-box" />
        <div className="follower-info">
            <div className="skeleton-box" style={{ width: '55%', height: 16, borderRadius: 8 }} />
            <div className="skeleton-box" style={{ width: 90, height: 12, borderRadius: 8, marginTop: 6 }} />
        </div>
    </div>
);

/* ---- Empty state ---- */
const Empty = ({ tab }) => {
    const msgs = {
        followers: { icon: '🫂', title: 'Підписників поки немає', sub: 'Коли хтось підпишеться — з\'явиться тут.' },
        following: { icon: '🔍', title: 'Немає підписок', sub: 'Ця людина ще ні на кого не підписана.' },
        mutual:    { icon: '🤝', title: 'Немає спільних підписників', sub: 'Тут з\'являться люди, на яких ви обидва підписані.' },
    };
    const m = msgs[tab] || msgs.followers;
    return (
        <div className="followers-empty">
            <span className="followers-empty-icon">{m.icon}</span>
            <h3>{m.title}</h3>
            <p>{m.sub}</p>
        </div>
    );
};

/* ================================================================
   MAIN PAGE
   ================================================================ */
const FollowersPage = () => {
    const { nickname } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useUserContext();

    // Determine initial tab from URL
    const initialTab = location.pathname.endsWith('/following') ? 'following' : 'followers';
    const [activeTab, setActiveTab] = useState(initialTab);

    const [profileUser, setProfileUser] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);

    /* ── Fetch profile user by nickname ── */
    useEffect(() => {
        setPageLoading(true);
        getDocs(query(collection(db, 'users'), where('nickname', '==', nickname)))
            .then(snap => {
                if (!snap.empty) {
                    setProfileUser({ uid: snap.docs[0].id, ...snap.docs[0].data() });
                }
            })
            .finally(() => setPageLoading(false));
    }, [nickname]);

    /* ── Fetch users for active tab ── */
    const loadUsers = useCallback(async () => {
        if (!profileUser) return;
        setUsersLoading(true);
        try {
            let uids = [];
            if (activeTab === 'followers') {
                uids = profileUser.followers || [];
            } else if (activeTab === 'following') {
                uids = profileUser.following || [];
            } else if (activeTab === 'mutual') {
                const followerSet = new Set(profileUser.followers || []);
                uids = (profileUser.following || []).filter(uid => followerSet.has(uid));
            }
            const fetched = await fetchUsersByUids(uids);
            // Sort: people current user follows come first
            if (currentUser) {
                fetched.sort((a, b) => {
                    const aFollowed = currentUser.following?.includes(a.uid) ? 0 : 1;
                    const bFollowed = currentUser.following?.includes(b.uid) ? 0 : 1;
                    return aFollowed - bFollowed;
                });
            }
            setUsers(fetched);
        } finally {
            setUsersLoading(false);
        }
    }, [profileUser, activeTab, currentUser]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    /* ── Tab config ── */
    const tabs = [
        {
            key: 'mutual',
            label: 'Спільні',
            count: (() => {
                if (!profileUser) return 0;
                const s = new Set(profileUser.followers || []);
                return (profileUser.following || []).filter(u => s.has(u)).length;
            })(),
        },
        { key: 'followers', label: 'Підписники', count: profileUser?.followers?.length || 0 },
        { key: 'following', label: 'Підписки', count: profileUser?.following?.length || 0 },
        { key: 'recommended', label: 'Рекомендовано', count: null, disabled: true },
    ];

    const handleTabChange = (tab) => {
        if (tab.disabled) return;
        setActiveTab(tab.key);
        // Sync URL
        if (tab.key === 'following') {
            navigate(`/${nickname}/following`, { replace: true });
        } else {
            navigate(`/${nickname}/followers`, { replace: true });
        }
    };

    const withLayout = (children) => (
        <div className="home-container">
            <main className="main-content followers-main">
                <div className="followers-page">
                    {children}
                </div>
            </main>
        </div>
    );

    if (pageLoading) {
        return withLayout(
            <div className="followers-topbar">
                <button className="followers-back" onClick={() => navigate(-1)}><BackIcon /></button>
                <div className="skeleton-box" style={{ width: 140, height: 20, borderRadius: 8 }} />
            </div>
        );
    }

    if (!profileUser) {
        return withLayout(
            <>
                <div className="followers-topbar">
                    <button className="followers-back" onClick={() => navigate(-1)}><BackIcon /></button>
                </div>
                <div className="followers-empty">
                    <span className="followers-empty-icon">🔍</span>
                    <h3>Користувача не знайдено</h3>
                </div>
            </>
        );
    }

    return withLayout(
        <>
            {/* ── Top bar ── */}
            <div className="followers-topbar">
                <button className="followers-back" onClick={() => navigate(`/${nickname}`)} aria-label="Назад">
                    <BackIcon />
                </button>
                <div className="followers-topbar-info">
                    <Link to={`/${nickname}`} className="followers-topbar-name">
                        {profileUser.displayName || nickname}
                    </Link>
                    <span className="followers-topbar-nick">@{nickname}</span>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="followers-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`followers-tab${activeTab === tab.key ? ' active' : ''}${tab.disabled ? ' disabled' : ''}`}
                        onClick={() => handleTabChange(tab)}
                        disabled={tab.disabled}
                    >
                        <span className="followers-tab-label">{tab.label}</span>
                        {tab.disabled ? (
                            <span className="followers-tab-lock"><LockIcon /></span>
                        ) : tab.count > 0 ? (
                            <span className="followers-tab-count">{tab.count.toLocaleString()}</span>
                        ) : null}
                    </button>
                ))}
            </div>

            {/* ── Content ── */}
            <div className="followers-content">
                {usersLoading ? (
                    <div className="followers-grid">
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : users.length === 0 ? (
                    <Empty tab={activeTab} />
                ) : (
                    <div className="followers-grid">
                        {users.map(u => (
                            <UserCard
                                key={u.uid}
                                user={u}
                                currentUser={currentUser}
                                onFollowChange={loadUsers}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default FollowersPage;
