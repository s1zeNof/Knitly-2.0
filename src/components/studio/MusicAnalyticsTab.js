import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { db } from '../../services/firebase';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { useUserContext } from '../../contexts/UserContext';
import { useUserTracks } from '../../hooks/useUserTracks';
import TrackList from '../common/TrackList';
import default_picture from '../../img/Default-Images/default-picture.svg';

/* ── SVG Icons ────────────────────────────────────────────── */
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
  </svg>
);
const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);
const PeopleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 3a7 7 0 1 1 0 14A7 7 0 0 1 12 5zm-.5 3.5v5.25l4.5 2.7-.75 1.23L10 14V8.5h1.5z"/>
  </svg>
);
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/>
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
  </svg>
);
const MusicNoteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
  </svg>
);
const TrendingIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
);

/* ── Firebase helpers ─────────────────────────────────────── */
const fetchFollowersDetails = async (followerIds) => {
  if (!followerIds || followerIds.length === 0) return [];
  const chunks = [];
  for (let i = 0; i < followerIds.length; i += 10) {
    chunks.push(followerIds.slice(i, i + 10));
  }
  const snapshots = await Promise.all(
    chunks.map(chunk =>
      getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)))
    )
  );
  return snapshots.flatMap(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
};

/* ── StatCard component ───────────────────────────────────── */
const StatCard = ({
  title,
  value,
  icon,
  isLoading = false,
  isPlaceholder = false,
  badge = null,
  colorMod = '', // '', 'green', 'blue', 'amber', 'rose', 'teal'
}) => (
  <div className={`stat-card${isPlaceholder ? ' stat-card--dim' : ''}`}>
    <div className={`stat-card-icon${colorMod ? ` stat-card-icon--${colorMod}` : ''}`}>
      {icon}
    </div>
    <div className="stat-card-info">
      <p className="stat-card-title">{title}</p>
      {isLoading ? (
        <div className="stat-card-loader" />
      ) : isPlaceholder ? (
        <p className="stat-card-value stat-card-value--placeholder">—</p>
      ) : (
        <>
          <p className="stat-card-value">
            {typeof value === 'number' ? value.toLocaleString('uk-UA') : value}
          </p>
          {badge && (
            <span className={`stat-card-badge stat-card-badge--${badge.type}`}>
              {badge.label}
            </span>
          )}
        </>
      )}
    </div>
  </div>
);

/* ── InsightCard component ────────────────────────────────── */
const InsightCard = ({ label, value, sub, dim = false }) => (
  <div className="studio-insight-card">
    <span className="studio-insight-card__label">{label}</span>
    <span className={`studio-insight-card__value${dim ? ' studio-insight-card__value--dim' : ''}`}>
      {value}
    </span>
    {sub && <span className="studio-insight-card__sub">{sub}</span>}
  </div>
);

/* ── Main Tab ─────────────────────────────────────────────── */
const MusicAnalyticsTab = () => {
  const { user: currentUser } = useUserContext();
  const { tracks, loading: tracksLoading } = useUserTracks(currentUser?.uid);

  const { data: followersDetails, isLoading: followersLoading } = useQuery(
    ['followersDetails', currentUser?.uid],
    () => fetchFollowersDetails(currentUser?.followers),
    { enabled: !!currentUser?.followers?.length }
  );

  /* ── Computed stats ── */
  const stats = useMemo(() => {
    if (!tracks || tracks.length === 0)
      return { totalPlays: 0, totalLikes: 0, totalTracks: 0, topTracks: [] };
    const totalPlays  = tracks.reduce((s, t) => s + (t.playCount  || 0), 0);
    const totalLikes  = tracks.reduce((s, t) => s + (t.likesCount || 0), 0);
    const topTracks   = [...tracks]
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, 5);
    return { totalPlays, totalLikes, totalTracks: tracks.length, topTracks };
  }, [tracks]);

  const audienceAnalytics = useMemo(() => {
    if (!followersDetails) return { geography: [], recentFollowers: [] };
    const geoMap = new Map();
    followersDetails.forEach(f => {
      const country = f.country || 'Не вказано';
      geoMap.set(country, (geoMap.get(country) || 0) + 1);
    });
    const total = followersDetails.length;
    const geography = Array.from(geoMap.entries())
      .map(([country, count]) => ({ country, count, percentage: (count / total) * 100 }))
      .sort((a, b) => b.count - a.count);
    const recentFollowers = [...followersDetails].reverse().slice(0, 8);
    return { geography, recentFollowers };
  }, [followersDetails]);

  const followersCount = currentUser?.followers?.length || 0;

  return (
    <div className="dashboard-grid-layout">

      {/* ════════════════ LEFT COLUMN ════════════════ */}
      <div className="dashboard-main-column">

        {/* ── Row 1: Real stats ── */}
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Загальна статистика</h2>
          <div className="stats-grid">
            <StatCard
              title="Прослуховувань"
              value={stats.totalPlays}
              icon={<PlayIcon />}
              isLoading={tracksLoading}
              badge={stats.totalPlays > 0 ? { label: '🎧 Всього', type: 'dim' } : null}
            />
            <StatCard
              title="Вподобань"
              value={stats.totalLikes}
              icon={<HeartIcon />}
              isLoading={tracksLoading}
              colorMod="rose"
            />
            <StatCard
              title="Підписників"
              value={followersCount}
              icon={<PeopleIcon />}
              isLoading={false}
              colorMod="blue"
              badge={followersCount > 0 ? { label: '↑ зростає', type: 'up' } : null}
            />
            <StatCard
              title="Треків"
              value={stats.totalTracks}
              icon={<MusicNoteIcon />}
              isLoading={tracksLoading}
              colorMod="teal"
            />
          </div>
        </section>

        {/* ── Row 2: Placeholder / future stats ── */}
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Розширена аналітика <span style={{fontSize:'0.7rem', fontWeight:600, color:'rgba(255,255,255,0.25)', marginLeft:'0.5rem', textTransform:'uppercase', letterSpacing:'0.06em'}}>· незабаром</span></h2>
          <div className="stats-grid">
            <StatCard
              title="Місячних слухачів"
              icon={<CalendarIcon />}
              isPlaceholder
              colorMod="amber"
            />
            <StatCard
              title="Годин прослухано"
              icon={<ClockIcon />}
              isPlaceholder
              colorMod="green"
            />
            <StatCard
              title="Поширень треків"
              icon={<ShareIcon />}
              isPlaceholder
              colorMod="blue"
            />
            <StatCard
              title="Трендовий рейтинг"
              icon={<TrendingIcon />}
              isPlaceholder
              colorMod="rose"
            />
          </div>
        </section>

        {/* ── Row 3: Insights ── */}
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Інсайти <span style={{fontSize:'0.7rem', fontWeight:600, color:'rgba(255,255,255,0.25)', marginLeft:'0.5rem', textTransform:'uppercase', letterSpacing:'0.06em'}}>· незабаром</span></h2>
          <div className="studio-insights-row">
            <InsightCard
              label="Найактивніший день"
              value="—"
              sub="Дізнайся коли твоя аудиторія слухає найбільше"
              dim
            />
            <InsightCard
              label="Залученість фанів"
              value="—"
              sub="Лайки + коментарі + збереження / прослуховування"
              dim
            />
            <InsightCard
              label="Найкращий час релізу"
              value="—"
              sub="Рекомендований час для максимального охоплення"
              dim
            />
          </div>
        </section>

        {/* ── Row 4: Top tracks ── */}
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Топ-5 треків</h2>
          <div className="dashboard-track-list">
            <TrackList initialTracks={stats.topTracks} isLoading={tracksLoading} />
          </div>
        </section>

      </div>

      {/* ════════════════ RIGHT COLUMN ════════════════ */}
      <aside className="dashboard-side-column">

        {/* Geography */}
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Географія аудиторії</h2>
          <div className="audience-geography-card">
            {followersLoading ? (
              <p className="no-data-placeholder">Аналіз даних...</p>
            ) : audienceAnalytics.geography.length > 0 ? (
              <ul className="country-list">
                {audienceAnalytics.geography.slice(0, 5).map(item => (
                  <li key={item.country}>
                    <span className="country-name">{item.country}</span>
                    <div className="country-bar-container">
                      <div
                        className="country-bar"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="country-percentage">{item.percentage.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data-placeholder">Немає даних про підписників.</p>
            )}
          </div>
        </section>

        {/* Recent followers */}
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Останні підписники</h2>
          <div className="recent-followers-card">
            {followersLoading ? (
              <p className="no-data-placeholder">Завантаження...</p>
            ) : audienceAnalytics.recentFollowers.length > 0 ? (
              <div className="followers-grid">
                {audienceAnalytics.recentFollowers.map(f => (
                  <div key={f.id} className="follower-item" title={f.displayName}>
                    <img
                      src={f.photoURL || default_picture}
                      alt={f.displayName}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-placeholder">У вас ще немає підписників.</p>
            )}
          </div>
        </section>

        {/* Superfans placeholder */}
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">
            Суперфани
            <span style={{fontSize:'0.7rem', fontWeight:600, color:'rgba(255,255,255,0.25)', marginLeft:'0.5rem', textTransform:'uppercase', letterSpacing:'0.06em'}}>· незабаром</span>
          </h2>
          <div className="recent-followers-card">
            <p className="no-data-placeholder">
              🏆 Тут будуть відображатися твої найактивніші фани — ті хто найбільше слухає, лайкає та надсилає подарунки.
            </p>
          </div>
        </section>

      </aside>
    </div>
  );
};

export default MusicAnalyticsTab;
