import React, { useState } from 'react';
import { useUserContext } from '../contexts/UserContext';
import MusicAnalyticsTab from '../components/studio/MusicAnalyticsTab';
import PostsAnalyticsTab from '../components/studio/PostsAnalyticsTab';
import default_picture from '../img/Default-Images/default-picture.svg';
import './CreatorStudio.css';

/* ── SVG Icons ───────────────────────────────────────────── */
const MusicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
);
const PostsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16M4 12h16M4 18h10"/>
  </svg>
);
const AudienceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const ActivityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const NotesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const ReleasesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="3"/>
    <line x1="12" y1="2" x2="12" y2="5"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="5" y2="12"/>
    <line x1="19" y1="12" x2="22" y2="12"/>
  </svg>
);
const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

/* ── Sidebar Navigation Config ───────────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Аналітика',
    items: [
      { key: 'music', label: 'Музика', Icon: MusicIcon },
      { key: 'posts', label: 'Дописи', Icon: PostsIcon },
    ],
  },
  {
    label: 'Аудиторія',
    items: [
      { key: 'audience', label: 'Підписники', Icon: AudienceIcon },
      { key: 'activity', label: 'Активність', Icon: ActivityIcon },
    ],
  },
  {
    label: 'Монетизація',
    items: [
      { key: 'notes', label: 'Ноти & Дохід', Icon: NotesIcon },
    ],
  },
  {
    label: 'Контент',
    items: [
      { key: 'releases', label: 'Релізи', Icon: ReleasesIcon },
      { key: 'tags',     label: 'Теги та жанри', Icon: TagIcon },
    ],
  },
];

/* ── Coming Soon placeholder ─────────────────────────────── */
const ComingSoonTab = ({ title, description, Icon, items = [] }) => (
  <div className="studio-coming-soon">
    <div className="studio-coming-soon-icon">
      <Icon />
    </div>
    <h2 className="studio-coming-soon-title">{title}</h2>
    <p className="studio-coming-soon-desc">{description}</p>
    {items.length > 0 && (
      <ul className="studio-coming-soon-features">
        {items.map((item, i) => (
          <li key={i}>
            <span className="studio-coming-soon-dot" />
            {item}
          </li>
        ))}
      </ul>
    )}
    <div className="studio-coming-soon-badge">Незабаром ✦</div>
  </div>
);

/* ── Main Component ──────────────────────────────────────── */
const CreatorStudio = () => {
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState('music');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'music':
        return <MusicAnalyticsTab />;
      case 'posts':
        return <PostsAnalyticsTab />;
      case 'audience':
        return (
          <ComingSoonTab
            title="Аналітика аудиторії"
            description="Детальний портрет твоїх підписників — де вони, що слухають, коли найбільше активні."
            Icon={AudienceIcon}
            items={[
              'Географія по країнах та містах',
              'Вікові групи та інтереси',
              'Суперфани — хто найчастіше слухає та ставить реакції',
              'Зростання підписників по днях',
            ]}
          />
        );
      case 'activity':
        return (
          <ComingSoonTab
            title="Активність"
            description="Графіки прослуховувань у розрізі часу — визнач свій найкращий час для релізів."
            Icon={ActivityIcon}
            items={[
              'Прослуховування по годинах доби',
              'Найактивніші дні тижня',
              'Порівняння тижень/місяць',
              'Пікові моменти після релізу',
            ]}
          />
        );
      case 'notes':
        return (
          <ComingSoonTab
            title="Ноти & Дохід"
            description="Повна картина твоїх заробітків: ноти від подарунків, донати, статистика по трекам."
            Icon={NotesIcon}
            items={[
              'Отримані ноти по місяцях',
              'Топ-5 доноторів та суперфанів',
              'Дохід по кожному треку',
              'Конвертація нот у реальну валюту (скоро)',
            ]}
          />
        );
      case 'releases':
        return (
          <ComingSoonTab
            title="Менеджер релізів"
            description="Плануй та відстежуй свої майбутні релізи — альбоми, сингли, колаборації."
            Icon={ReleasesIcon}
            items={[
              'Таймер-дроп із блюром обкладинки',
              'Планування дати релізу',
              'Прем\'єри з таймером для фанів',
              'Статистика перших 24 год після релізу',
            ]}
          />
        );
      case 'tags':
        return (
          <ComingSoonTab
            title="Теги та жанри"
            description="Подивись, за якими тегами тебе знаходять, та в якому жанрі ти найбільш популярний."
            Icon={TagIcon}
            items={[
              'Топ тегів твоїх треків',
              'Рейтинг у кожному жанрі',
              'Рекомендовані теги для нових треків',
              'Тренди жанрів на платформі',
            ]}
          />
        );
      default:
        return null;
    }
  };

  if (!user) return null;

  const followersCount = user.followers?.length || 0;
  const followingCount = user.following?.length || 0;
  const isAdmin       = user.roles?.includes('admin');
  const isCreator     = user.roles?.includes('creator');

  return (
    <div className="studio-page-container">

      {/* ── HERO — замінює застарілий <header> ── */}
      <div className="studio-hero">
        {/* Ambient glow orbs */}
        <span className="studio-hero-glow studio-hero-glow--purple" aria-hidden="true" />
        <span className="studio-hero-glow studio-hero-glow--indigo" aria-hidden="true" />

        <div className="studio-hero-inner">
          {/* Left: user info */}
          <div className="studio-hero-user">
            <div className="studio-hero-avatar-wrap">
              <img
                className="studio-hero-avatar"
                src={user.photoURL || default_picture}
                alt={user.displayName}
              />
              <span className="studio-hero-avatar-ring" aria-hidden="true" />
            </div>
            <div className="studio-hero-info">
              <div className="studio-hero-badges-row">
                <span className="studio-badge studio-badge--role">🎤 Артист</span>
                {isCreator && <span className="studio-badge studio-badge--creator">✦ Creator</span>}
                {isAdmin   && <span className="studio-badge studio-badge--admin">⚡ Admin</span>}
              </div>
              <p className="studio-hero-title">{user.displayName}</p>
              <p className="studio-hero-subtitle">
                @{user.slug || user.nickname} &nbsp;·&nbsp; Творча студія Knitly
              </p>
            </div>
          </div>

          {/* Right: quick stats pill */}
          <div className="studio-hero-stats">
            <div className="studio-quick-stat">
              <span className="studio-quick-stat__val">{followersCount.toLocaleString('uk-UA')}</span>
              <span className="studio-quick-stat__lbl">Підписників</span>
            </div>
            <span className="studio-quick-stat-sep" aria-hidden="true" />
            <div className="studio-quick-stat">
              <span className="studio-quick-stat__val">{followingCount.toLocaleString('uk-UA')}</span>
              <span className="studio-quick-stat__lbl">Підписок</span>
            </div>
            <span className="studio-quick-stat-sep" aria-hidden="true" />
            <div className="studio-quick-stat">
              <span className="studio-quick-stat__val studio-quick-stat__val--dim">—</span>
              <span className="studio-quick-stat__lbl">Міс. слухачів</span>
            </div>
            <span className="studio-quick-stat-sep" aria-hidden="true" />
            <div className="studio-quick-stat">
              <span className="studio-quick-stat__val studio-quick-stat__val--dim">—</span>
              <span className="studio-quick-stat__lbl">Зарбл. нот 🎵</span>
            </div>
          </div>
        </div>
      </div>
      {/* ── END HERO ── */}

      {/* ── BODY LAYOUT ── */}
      <div className="studio-layout">

        {/* Sidebar Nav */}
        <aside className="studio-sidebar" aria-label="Навігація студії">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="studio-nav-group">
              <span className="studio-nav-group__label">{group.label}</span>
              {group.items.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  className={`studio-nav-btn${activeTab === key ? ' active' : ''}`}
                  onClick={() => setActiveTab(key)}
                >
                  <span className="studio-nav-btn__icon"><Icon /></span>
                  <span className="studio-nav-btn__label">{label}</span>
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Tab Content */}
        <main className="studio-main-content">
          {renderTabContent()}
        </main>

      </div>
    </div>
  );
};

export default CreatorStudio;
