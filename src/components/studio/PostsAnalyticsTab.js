import React from 'react';
import { useQuery } from 'react-query';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useUserContext } from '../../contexts/UserContext';
import PostAnalyticsCard from '../posts/PostAnalyticsCard';

/* ── Icons ───────────────────────────────────────────────── */
const FileTextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
  </svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
);
const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);
const CommentIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
  </svg>
);
const ClickIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/>
  </svg>
);

/* ── Firebase fetch ───────────────────────────────────────── */
const fetchArtistPosts = async (artistId) => {
  if (!artistId) return [];
  const postsQuery = query(
    collection(db, 'posts'),
    where('authorUids', 'array-contains', artistId),
    orderBy('createdAt', 'desc'),
    limit(10),
  );
  const snapshot = await getDocs(postsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/* ── Summary stat card (compact, for posts) ──────────────── */
const SummaryCard = ({ title, value, icon, colorMod = '', isPlaceholder = false }) => (
  <div className={`stat-card${isPlaceholder ? ' stat-card--dim' : ''}`}>
    <div className={`stat-card-icon${colorMod ? ` stat-card-icon--${colorMod}` : ''}`}>{icon}</div>
    <div className="stat-card-info">
      <p className="stat-card-title">{title}</p>
      {isPlaceholder
        ? <p className="stat-card-value stat-card-value--placeholder">—</p>
        : <p className="stat-card-value">
            {typeof value === 'number' ? value.toLocaleString('uk-UA') : value}
          </p>
      }
    </div>
  </div>
);

/* ── Main Tab ─────────────────────────────────────────────── */
const PostsAnalyticsTab = () => {
  const { user: currentUser } = useUserContext();

  const { data: artistPosts, isLoading: postsLoading } = useQuery(
    ['artistPosts', currentUser?.uid],
    () => fetchArtistPosts(currentUser?.uid),
    { enabled: !!currentUser?.uid }
  );

  /* Compute totals from fetched posts */
  const totals = React.useMemo(() => {
    if (!artistPosts || artistPosts.length === 0)
      return { posts: 0, likes: 0, comments: 0, clicks: 0 };
    return {
      posts:    artistPosts.length,
      likes:    artistPosts.reduce((s, p) => s + (p.likesCount    || 0), 0),
      comments: artistPosts.reduce((s, p) => s + (p.commentsCount || 0), 0),
      clicks:   artistPosts.reduce((s, p) => s + (p.attachmentClicks || 0), 0),
    };
  }, [artistPosts]);

  return (
    <div>
      {/* ── Summary stats row ── */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Загальна статистика дописів</h2>
        <div className="posts-summary-stats">
          <SummaryCard
            title="Дописів (остання 10)"
            value={postsLoading ? undefined : totals.posts}
            icon={<FileTextIcon />}
            isPlaceholder={postsLoading}
          />
          <SummaryCard
            title="Вподобань"
            value={postsLoading ? undefined : totals.likes}
            icon={<HeartIcon />}
            colorMod="rose"
            isPlaceholder={postsLoading}
          />
          <SummaryCard
            title="Коментарів"
            value={postsLoading ? undefined : totals.comments}
            icon={<CommentIcon />}
            colorMod="blue"
            isPlaceholder={postsLoading}
          />
          <SummaryCard
            title="Переходів на треки"
            value={postsLoading ? undefined : totals.clicks}
            icon={<ClickIcon />}
            colorMod="teal"
            isPlaceholder={postsLoading}
          />
        </div>
      </section>

      {/* ── Placeholder advanced stats ── */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">
          Розширені метрики
          <span style={{fontSize:'0.7rem', fontWeight:600, color:'rgba(255,255,255,0.25)', marginLeft:'0.5rem', textTransform:'uppercase', letterSpacing:'0.06em'}}>· незабаром</span>
        </h2>
        <div className="posts-summary-stats">
          <SummaryCard title="Переглядів" icon={<EyeIcon />}    colorMod="amber"  isPlaceholder />
          <SummaryCard title="Охоплення"  icon={<EyeIcon />}    colorMod="green"  isPlaceholder />
          <SummaryCard title="Поширень"   icon={<ClickIcon />}  colorMod="blue"   isPlaceholder />
          <SummaryCard title="Збережено"  icon={<HeartIcon />}  colorMod="rose"   isPlaceholder />
        </div>
      </section>

      {/* ── Posts list ── */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Ефективність останніх дописів</h2>
        <div className="posts-analytics-list">
          {postsLoading && <p className="no-data-placeholder">Завантаження аналітики...</p>}
          {!postsLoading && artistPosts && artistPosts.length > 0
            ? artistPosts.map(post => (
                <PostAnalyticsCard key={post.id} post={post} />
              ))
            : !postsLoading && (
                <p className="no-data-placeholder">
                  У вас ще немає дописів, щоб аналізувати їх ефективність.
                </p>
              )
          }
        </div>
      </section>
    </div>
  );
};

export default PostsAnalyticsTab;
