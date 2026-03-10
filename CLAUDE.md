# CLAUDE.md — Knitly 2.0 | Повний контекст проекту

> Цей файл — єдина точка правди для будь-якої сесії Claude.
> Читати ПЕРШ НІЖ починати будь-яку роботу над проектом.
> Останнє оновлення: 2026-03-09

---

## ПРИНЦИПИ РОЗРОБКИ (обов'язково)

> **"Роби усе що треба в межах безпеки, архітектури, задумки та чистоти та професіоналізму"**

- **Безпека** — кожна фіча, кожен компонент, кожна зміна Firebase Rules оцінюється з точки зору безпеки. Без скорочень що відкривають вразливості.
- **Архітектура** — дивитись на загальну картину. Не писати "quick fix" що ламає структуру. Нові фічі вписуються в існуючу архітектуру або покращують її.
- **Задумка** — Knitly це музична соцмережа для андеграундних артистів. Кожна фіча служить цій місії. Не додавати "заради додати".
- **Чистота** — чистий код, чиста структура файлів, чисті CSS класи. Ніяких `any` типів, ніяких `!important` без причини.
- **Професіоналізм** — фінальний результат виглядає і відчувається як продукт топ-класу. Ніяких емоджі в коді/коментарях.

**Мова:** відповідати українською. Весь UI — українська.

---

## ОГЛЯД ПРОЕКТУ

**Knitly** — музична соціальна мережа орієнтована на незалежних і андеграундних музикантів.

- **Первинний ринок:** Україна → СНД → потім світ
- **Унікальна ніша:** специфічної платформи такого типу в Україні не існує
- **Позиціонування:** "тут з'являються нові артисти першими"
- **Аналоги у світі:** SoundCloud, Bandcamp, Audiomack, ReverbNation
- **Хостинг:** `knitly-demo.vercel.app` (dev), плановий домен — `knitly.app`

---

## ТЕХНІЧНИЙ СТЕК

| Категорія | Технологія |
|-----------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| State | React Query, Context API (UserContext, PlayerContext) |
| Database | Firebase Firestore |
| Auth | Firebase Auth (email+password, Google OAuth) |
| Storage | Supabase Storage (аватари, обкладинки, аудіо) |
| Styling | CSS Modules + CSS Variables |
| Icons | Lucide React |
| Animations | Framer Motion, Lottie |
| Rich Text | Lexical Editor |
| Notifications | react-hot-toast |
| Security | vercel.json headers + Cloudflare (після купівлі knitly.app) |
| E2EE | Web Crypto API / TweetNaCl.js (планується) |
| 2FA | Firebase TOTP MFA (планується) |
| Audio FP | ACRCloud або AcoustID (планується) |

### Два Vite-застосунки:
- **Main app** — корінь репозиторію, порт `5173` (або `3000`)
- **Admin app** — папка `admin/`, порт `5174`, окремий Vite-проект

---

## РЕПОЗИТОРІЙ

- **Основний репо:** `D:/My IT Projects/Knitly-2.0/` (гілка: `main`)
- **Worktree (старший):** `D:/My IT Projects/Knitly-2.0/.claude/worktrees/clever-joliot/`
- **Завжди працювати в основному репо**, якщо користувач не вказав worktree.
- Firebase правила: `firestore.rules` в корені

---

## СТРУКТУРА КЛЮЧОВИХ ФАЙЛІВ

```
src/
  styles/
    App.css              — глобальний layout, sidebar offsets, mobile padding
    Global.css           — CSS variables, базові стилі
  components/
    common/
      TrackList.js        — список треків з меню "..." (position:fixed), ReportModal
      TrackList.css       — клас .tl-options-menu (не .options-menu — щоб уникнути конфлікту)
      ReportModal.jsx     — модал скарги (3 кроки: причина → деталі → done)
      ReportModal.css
      ShareModal.jsx      — поширення поста, фільтрує users з messagePrivacy=nobody
    posts/
      PostCard.jsx        — картка поста
      Post.css            — стилі + yarn thread (SVG diamond tile)
      CommentSection.jsx
    layout/
      Sidebar.jsx         — навігація (3 режими: full/hover/icons)
      BottomNavBar.jsx    — мобільна навбар
      PublicHeader.jsx    — хедер для публічних/legal сторінок
      SiteFooter.jsx      — публічний футер
      LegalLayout.jsx     — обгортка для правових сторінок
    player/
      PlayerContext.jsx   — глобальний аудіо-плеєр
  pages/
    Home.jsx              — головна стрічка
    ProfilePage.js        — профіль + follow/gift/chat
    Settings.js           — налаштування (профіль, приватність, чат, зовнішній вигляд, акаунт)
                            — вкладка "Акаунт" з Danger Zone: видалення акаунту (GDPR)
    legal/
      TermsPage.jsx       → /terms
      PrivacyPage.jsx     → /privacy
      CopyrightPage.jsx   → /copyright
      GuidelinesPage.jsx  → /guidelines
      content/            — uk + en варіанти контенту
  services/
    firebase.js           — ініціалізація Firebase + всі service functions
    reportService.js      — submitReport() → колекція reports у Firestore
  contexts/
    UserContext.jsx
    PlayerContext.jsx

admin/
  src/
    pages/
      Dashboard.jsx
      UsersPage.jsx
      ReportsPage.jsx
      UserDetailPage.jsx
      UnclaimedTracksTable.jsx  — Фаза 2: Artist Claim System

scripts/
  create-notion-docs.mjs  — Node.js скрипт для генерації Notion-документації
```

---

## ЩО ВЖЕ ЗРОБЛЕНО (MVP статус)

### Фаза 0 — ЗАВЕРШЕНО

**Core функціонал:**
- Авторизація: Login / Register (glassmorphism дизайн) + ForgotPassword
- Профіль: банер, аватар, вкладки, follow/unfollow, gift, chat
- Пости: PostCard з реакціями, коментарями, вкладеннями (треки/альбоми/опитування)
- Глобальний аудіо-плеєр (PlayerContext)
- Сайдбар (3 режими) + BottomNavBar (мобайл)
- Чат (DM між користувачами)
- Система нотифікацій
- Feed / стрічка постів
- Плейлисти (створення та перегляд)
- Upload page (redesign, ліміти, типи контенту: original/cover/remix/mashup/fan_upload)
- Search page (redesign + Stories Archive tab)
- NotFound page (404)

**Legal (завершено 2026-03-03):**
- Terms of Service → `/terms`
- Privacy Policy (GDPR + Закон України) → `/privacy`
- Copyright / DMCA Policy → `/copyright`
- Community Guidelines → `/guidelines`
- LegalLayout + PublicHeader + SiteFooter
- Чекбокс ToS при реєстрації

**Security (завершено):**
- Firebase Security Rules: 5 вразливостей виправлено
  - Ін'єкція ролі адміна заблокована (`hasNoPrivilegedFields()`)
  - Підробка emoji-пака заблокована
  - Захист учасників чату
  - Нотифікаційний спам обмежено
  - Нові колекції: `reports`, `audit_log` (append-only)
- vercel.json HTTP security headers:
  - X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security
  - Content-Security-Policy (Firebase + Supabase + Google Fonts whitelist)
  - Referrer-Policy, Permissions-Policy
- Firebase credentials перенесені в .env

**DM Privacy:**
- Налаштування `messagePrivacy`: all / followers / nobody / requests
- ShareModal фільтрує користувачів з `messagePrivacy=nobody`

**Delete Account (GDPR):**
- Вкладка "Акаунт" в Settings.js
- Danger Zone + підтвердження через "ВИДАЛИТИ" + пароль

**Admin Panel:**
- Dashboard, Users, UserDetailPage, Reports, UnclaimedTracksTable
- RBAC ролі в Firebase Auth

**TrackList меню "..." (bug fixes):**
- Виправлено: event propagation (click + stopPropagation)
- Виправлено: CSS конфлікт (renamed до `.tl-options-menu`)
- Виправлено: z-index stacking context (position:fixed + getBoundingClientRect)
- Додано: "Поскаржитись" → ReportModal з `targetType: 'track'`

---

## РИНОК ТА ЮРИДИЧНА СТРАТЕГІЯ

### Цільові ринки
1. **Зараз:** Україна (андеграундні артисти, незалежна музика)
2. **Незабаром:** ЄС, США, Ізраїль (потребує i18n + EN версії)
3. **Стратегія входу:** спочатку UA спільнота, потім органічне зростання через діаспору

### Safe Harbor (DMCA / ЄС Директива про авторське право)
Платформа не несе відповідальності за UGC якщо:
1. Є чіткий механізм скарг (DMCA Takedown) ✅
2. Швидко видаляє піратський контент після скарги ✅ (ReportModal)
3. Є ToS з UGC Disclaimer та Indemnification ✅
4. Є політика блокування повторних порушників (admin panel) ✅

### GDPR / CCPA відповідність
- Privacy Policy з поясненням що збираємо ✅
- "Право на забуття" — Delete Account в Settings ✅
- Cookie Banner — LOW PRIORITY (є в Privacy Policy)

### Типи контенту при завантаженні
- `original` — оригінал артиста
- `cover` — кавер
- `remix` — ремікс
- `mashup` — мешап
- `fan_upload` — фан-завантаження (disclaimer: не заявляю права, артист може заклеймити)

---

## ADMIN PANEL

**URL:** `/kn-[секретний-хеш]-control` (не `/admin` — боти не знайдуть)

**Порт:** 5174 (окремий Vite-проект у `admin/`)

**RBAC ролі:**
```
super_admin  — все (лише 1-2 особи, засновники)
admin        — бани, видалення, верифікація
moderator    — розгляд скарг, попередження
support      — читання тікетів, відповіді
```

**Перевірка ролі (Firebase Rules):**
```javascript
get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(['admin'])
```

**Сторінки admin:**
- Dashboard — загальна статистика
- Users — список користувачів + пошук
- UserDetailPage — детальна сторінка юзера
- Reports — черга скарг (pending/resolved/dismissed)
- UnclaimedTracksTable — Фаза 2: Claim Your Music

**Планований захист (2FA для адмінів — Фаза 1):**
- TOTP обов'язковий (Google Authenticator / Authy)
- Session timeout: 30 хв неактивності → автовихід
- Audit log: кожна дія → `audit_log` колекція (append-only, тільки Admin SDK)

---

## АРХІТЕКТУРА БЕЗПЕКИ

### Firebase Security Rules — патерни
```javascript
// Нотифікації: будь-який авторизований може відправити
allow create: if isSignedIn()

// Читання чату: обробляє неіснуючі документи
allow read: if resource == null || uid in resource.data.participants

// Створення повідомлення: перший пакетний запис (новий чат)
// exists check АБО !exists(chatRef) для batch write сценарію

// Адмін-перевірка:
get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(['admin'])
```

### Захист від типових атак
- **Script kiddies:** Cloudflare WAF (після купівлі knitly.app)
- **Credential stuffing:** Firebase Auth вбудований rate limiting
- **Admin brute force:** прихований URL + 2FA
- **Firebase Rules abuse:** строгі rules, всі права на рівні Firestore
- **XSS:** не використовувати `dangerouslySetInnerHTML` з user-input; DOMPurify якщо потрібно
- **IDOR:** всі права перевіряються на рівні Rules, не лише в UI

### Firestore колекції (безпека)
```
reports/{reportId}     — скарги: targetType, targetId, reason, status
audit_log/{logId}      — append-only (тільки Admin SDK може писати)
```

### vercel.json headers (активні):
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: (Firebase + Supabase + Google Fonts whitelist)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Cloudflare (відкладено до купівлі knitly.app):
- SSL/TLS: Full strict + HSTS
- Bot Fight Mode: ON
- WAF Managed Rules: ON
- 5 Custom Rules: rate limit auth, блок scanner UA, захист admin URL

---

## ROADMAP / ФАЗИ

```
ФАЗА 0 — ЗАВЕРШЕНО
  MVP: профілі, музика, пости, чат, плеєр, нотифікації
  Legal: /terms /privacy /copyright /guidelines
  Security: Firebase Rules, vercel.json headers, reports/audit_log
  Admin: Dashboard, Users, Reports, UserDetail

ФАЗА 1 — ЗАРАЗ (до MVP launch)
  [ ] C1: Система скарг — ReportModal на постах/треках/юзерах (частково є)
  [ ] C2: Адмін-панель — захищений URL, RBAC черга скарг, бани, audit log
  [ ] D:  2FA адмінів — Firebase TOTP MFA (обов'язково для role:admin)
  [ ] C3: Now Playing — Feature #30 на профілі

ФАЗА 2 — ЗАПУСК
  [ ] E:  Audio fingerprinting (ACRCloud) + Верифікація артистів + Claim Music
  [ ] F:  Emoji/Sticker паки UI + модерація
  [ ] I:  Firebase RTDB — typing indicators (#8) + онлайн статус (#31)
  [ ] UX1: @mentions глобально — пости + коментарі + чат (#12)
  [ ] UX2: Медіа в чаті — фото/відео + редактор 10 фільтрів (#4)
  [ ] UX3: RilsTrack — TikTok-вертикальна стрічка треків (#37) — killer feature
  [ ] Cloudflare — після купівлі knitly.app

ФАЗА 3 — РІСТ
  [ ] G:  E2EE Secret Chats (Web Crypto API, ECDH + AES-256-GCM)
  [ ] UX4: Таймер дропу альбому + анімований блюр (#28)
  [ ] UX5: Stories — 24г TTL, Cloud Function auto-delete (#38)
  [ ] UX6: Реакції на повідомлення — double-tap + контекстне меню (#9)
  [ ] UX7: Кімнати (Spaces) — спільне прослуховування RTDB (#17)
  [ ] UX8: Колаборативні плейлисти (#21)
  [ ] UX9: Аналітика — Wrapped-стиль + постійна для артистів (#39)
  [ ] AI:  Чарівна паличка в редакторі (Gemini API) (#33)
  [ ] UX10: Онбординг-опитувальник при реєстрації (#11b)
  [ ] 2FA для звичайних юзерів (опціонально)

ФАЗА 4 — МАСШТАБ / VISION
  [ ] J:  "Ноти" economy — валюта, wallets, Cloud Functions atomic (#11, #18, #22)
          Premium підписка за Ноти + градієнтний фон (#36)
          NFT/Web3 подарунки
  [ ] Bot: Mini-apps / Bot API всередині Knitly (#26)
  [ ] Infra: Розподілена інфраструктура multi-region + власні сервери
```

---

## FEATURE IDEAS (всі 39+)

### Чат та Повідомлення
| # | Ідея | Пріоритет | Фаза |
|---|------|-----------|------|
| #1 | **Knitly Notifications** — системний бот-чат (як у Telegram): сповіщення про вхід, IP, місцезнаходження. Іконка "офіційного бота" | Середній | 2 |
| #4 | **Медіа в чаті** — фото та відео, кнопки SD/HD, редагування фото (обрізати + 10 фільтрів), анімована прогрес-смужка | Високий | 2 |
| #8 | **Typing indicators** — три анімовані крапки при наборі, анімація еквалайзера при аудіо, анімація медіа-іконки | Середній | 2 |
| #9 | **Реакції на повідомлення** — double-tap = ❤️, довге натискання → контекстне меню | Середній | 3 |
| #12 | **@mentions** — глобальний @нік у чатах і коментарях | Високий | 2 |
| #13 | **Placeholder-повідомлення** — по центру чату ("Ім'я створив групу"), з видаленням | Низький | 3 |
| #24 | **Поширення в ЛС** — кнопка "поділитись" відкриває вікно з підписниками + пошук | Високий | 2 |

### Музика
| # | Ідея | Пріоритет | Фаза |
|---|------|-----------|------|
| #5 | **Репост треку в профіль** — як SoundCloud: трек з'являється в профілі | Середній | 2 |
| #6 | **Співавторство** — кілька авторів на треку/альбомі, передача прав | Середній | 2 |
| #28 | **Таймер дропу альбому** — артист виставляє таймер. Чекбокси: заблюрити назву/обкладинку/треки. Блюр — анімований як у Telegram (летячі пікселі). До таймеру запустити неможливо. | Високий | 3 |
| #37 | **RilsTrack** — вертикальна TikTok-подібна стрічка треків. Обкладинка + теги + коментарі + реакції. Всі існуючі треки автоматично потрапляють. | Дуже Високий | 2 |

### Монетизація ("Ноти")
| # | Ідея | Пріоритет | Фаза |
|---|------|-----------|------|
| #11 | **Валюта "Ноти"** — 1 нота = 1 грн. NFT-реакції, анімовані подарунки на треки. 🎶 нота як іконка | — | 4 |
| #18 | **Система подарунків** — купівля анімованих подарунків за Ноти, топ-донатери на профілі | — | 4 |
| #22 | **Ноти в стрічці** — подарунки до постів (видимі всім), просування дописів | — | 3–4 |
| #36 | **Premium підписка** — за Ноти (як Telegram Premium). Градієнтний фон профілю/чату `linear-gradient(135deg, #2187e323, #bd268523, #3f0a3d23)` (13% прозорість). Статичний або динамічний. | — | 4 |

### Стрічка та Дописи
| # | Ідея | Пріоритет | Фаза |
|---|------|-----------|------|
| #11b | **Онбординг** — красивий опитувальник про жанри при реєстрації → персоналізована стрічка | Середній | 3 |
| #22b | **Polls у постах** — "Який трек випустити?", "Яка обкладинка?" | Середній | 3 |
| #23 | **Таби на головній** — кнопка "Нові дописи", розділення: Стрічка / Музика / Теги | Середній | 2 |
| #25 | **Правий клік на пост** — кастомне контекстне меню | Низький | 3 |
| #34 | **AI детекція спаму/NSFW** — пост публікується одразу, але AI тригерить флаг | Середній | 3 |

### Профіль та Акаунт
| # | Ідея | Пріоритет | Фаза |
|---|------|-----------|------|
| #30 | **Now Playing на профілі** — показ поточного треку що слухає юзер | Високий | 1 |
| #31 | **Онлайн статус** — "Онлайн" / "Остання активність". Налаштування: Усі / Підписники / Ніхто. Виключення для окремих людей. | Середній | 2 |
| #32 | **Соцмережі в профілі** — Instagram, Website, X. НЕ додавати SoundCloud/Spotify (відводить з платформи). | Низький | 2 |
| #38 | **Stories** — кружечки на головній (Instagram + Telegram стиль). Відео-кружечки у чаті. Унікальна фішка поверх стандартного формату. | — | 3 |
| #39 | **Аналітика** — Wrapped-стиль (не раз на рік). Хвилини прослуховування, топ треки, топ дні, топ жанри. Дані йдуть в алгоритм рекомендацій. | — | 3 |

### Кімнати та Колаборації
| # | Ідея | Пріоритет | Фаза |
|---|------|-----------|------|
| #17 | **Кімнати (Spaces)** — хост керує чергою треків, музика синхронізується для всіх в реальному часі. Окремий чат кімнати. Артисти — для прем'єр альбомів. | — | 3 |
| #21 | **Колаборативні плейлисти** — власник запрошує через @нік. Видно хто який трек додав. Ліміт треків від одного учасника. | Середній | 3 |

### Emoji та Стікери
| # | Ідея | Пріоритет | Фаза |
|---|------|-----------|------|
| #16 | **Кастомізація кольору emoji** — color picker або рандомні пресети. Зміна кольору анімованих emoji. | — | 3 |

**Архітектура emoji-паків:**
```javascript
emoji_packs/{id}: {
    type: "official" | "user",
    status: "active" | "pending" | "banned",
    protected_name: bool,
    verified: bool,
}
// Заборонені назви: 'knitly', 'knitly official', 'knt official', 'knitly team'
// Захист через regex + levenshtein distance < 2
```

### AI та Автоматизація
| # | Ідея | Пріоритет | Фаза |
|---|------|-----------|------|
| #33 | **AI-інтеграція** — іконка "чарівна паличка" у редакторі поста → покращення тексту (Gemini API). Якщо тексту немає — режим генерації (як Notion AI). Анімований градієнт-лоадер. | — | 3 |

### Платформа та Ecosystem
| # | Ідея | Пріоритет | Фаза |
|---|------|-----------|------|
| #26 | **Система ботів / Knitly Bot API** — як Telegram Mini Apps. BotFather: `/newbot` → генерує API_TOKEN. Офіційні канали: пост на сторінці → автоматично в групу повідомлень і навпаки. Боти можуть надсилати треки підписникам. | — | 4 |
| #35 | **Notion-референс** — що адаптувати з UX Notion для Knitly? (блоки, структуровані пости) | Обговорити | — |

---

## АРХІТЕКТУРНІ РІШЕННЯ ДЛЯ МАЙБУТНІХ ФІЧ

### Firebase RTDB (окремо від Firestore, sub-100ms):
```javascript
presence/{userId}         // { online: bool, lastSeen: timestamp }      ← #31
typing/{chatId}/{userId}  // { isTyping: bool, mediaType: 'text'|'audio'|'media' } ← #8
rooms/{roomId}/state      // { currentTrack, position, isPlaying }      ← #17
```

### "Ноти" Economy (баланс тільки через Cloud Functions):
```javascript
wallets/{userId}: {
    balance: number,           // read-only для клієнта
    totalEarned: number,
    totalSpent: number,
}
transactions/{txId}: {         // immutable, тільки Cloud Functions
    from: uid | 'system',
    to: uid,
    amount: number,
    type: 'purchase'|'gift'|'donation'|'boost'|'premium',
    refId: string,
    timestamp: serverTimestamp,
}
```

### Нові колекції (для майбутніх фіч):
```javascript
stories/{userId}/items/{storyId}: { url, type, expiresAt }  // #38
analytics/{userId}: { monthlyStats, totalPlays, totalListenTime, topTracks[] }  // #39
rooms/{roomId}: { host, participants[], queue[], currentTrack, isActive }  // #17
```

### Розширення існуючих колекцій:
```javascript
users/{uid}: {
    + isPremium: bool,
    + onlineSettings: { visibility, exceptions: [] },
    + socialLinks: { instagram, website, twitter },
}
tracks/{trackId}: {
    + coAuthors: [uid],
    + releaseAt: timestamp | null,
    + dropBlur: { name, cover, trackNames },
}
playlists/{playlistId}: {
    + isCollaborative: bool,
    + collaborators: [uid],
    + trackAddedBy: { [trackId]: uid },
}
posts/{postId}: {
    + type: 'post'|'poll'|'repost',
    + pollOptions: [{ text, votes, voters: [uid] }],
    + originalPostId: string,
    + originalAuthorId: string,
}
```

### Утиліти що потрібні глобально:
```
utils/parseMentions.js   → парсить @нік в будь-якому тексті (#12)
utils/formatNotes.js     → форматує баланс Нот (#11)
utils/dropTimer.js       → логіка таймеру дропу (#28)
hooks/usePresence.js     → RTDB-хук для онлайн статусу (#31)
hooks/useTyping.js       → RTDB-хук для typing indicator (#8)
```

---

## ПЕНТЕСТ-ЧЕКЛИСТ (після кожного релізу)

Виконувати з браузерної консолі або Postman.

### Рівень 1 — Базовий
```javascript
// 1.1 Ін'єкція ролі адміна — очікується PERMISSION_DENIED
await updateDoc(doc(db, 'users', auth.currentUser.uid), { role: 'admin' });

// 1.2 Маніпуляція лічильниками — очікується PERMISSION_DENIED
await updateDoc(doc(db, 'posts', 'ANY_ID'), { likesCount: 999999 });

// 1.3 Читання чужих нотифікацій — очікується PERMISSION_DENIED
await getDocs(collection(db, 'users', 'ЧУЖИЙ_UID', 'notifications'));

// 1.4 XSS в полях профілю — очікується: текст, НЕ виконання
await updateDoc(doc(db, 'users', auth.currentUser.uid), {
    displayName: '<script>alert("XSS")</script>',
});
```

### Рівень 2 — Середній
```javascript
// IDOR — читання чужого чату
await getDocs(collection(db, 'chats', 'ЧУЖИЙ_CHAT_ID', 'messages'));

// Видалення чужого треку
await deleteDoc(doc(db, 'tracks', 'ЧУЖИЙ_TRACK_ID'));
```

### Рівень 3 — Просунутий
```bash
# HTTP Security Headers
curl -I https://knitly-demo.vercel.app
# Шукай: Strict-Transport-Security, X-Frame-Options, Content-Security-Policy

# Firestore REST без авторизації
curl "https://firestore.googleapis.com/v1/projects/PROJECT_ID/databases/(default)/documents/users"
# Очікується: 403 Forbidden
```

---

## ІНШІ MD-ФАЙЛИ У ПРОЕКТІ

| Файл | Зміст |
|------|-------|
| `KNITLY_CONTEXT.md` | Основний контекст (цей CLAUDE.md є його розширеною версією) |
| `bot_system_idea_for_claude.md` | Детальна архітектура Knitly Bot System (#26): BotFather, API токени, синхронізація пост↔чат |
| `legal_strategy_for_claude.md` | Аналіз юридичних вимог для виходу на ринки ЄС, США, Ізраїль: DMCA, GDPR, CCPA, Safe Harbor |

---

## NOTION ДОКУМЕНТАЦІЯ

Сторінка: https://www.notion.so/Knitly-225474e940b7804aa8dfd7da50170c36

Підсторінки (створені скриптом):
- Knitly — Project Hub
- Project Overview
- MVP Status
- Roadmap & Phases
- Feature Ideas
- Security Architecture

Скрипт для оновлення: `scripts/create-notion-docs.mjs`
Запуск: `$env:NOTION_TOKEN="ntn_xxx"; node scripts/create-notion-docs.mjs`
Integration: "Claude/Knitly/not1on" (Internal, workspace: Brabus Bo's Notion)

---

## NOTION MCP (підключено)

Конфіг: `C:/Users/Я/.claude/settings.json`
```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer ntn_xxx\", \"Notion-Version\": \"2022-06-28\"}"
      }
    }
  }
}
```
Після підключення: Claude може напряму читати/редагувати Notion без скриптів.

---

## ВІДКЛАДЕНІ / PENDING ЗАДАЧІ

- **Deploy Firestore Rules** — `firestore.rules` локально виправлено, потребує `firebase deploy --only firestore:rules`
- **Feed "Load More"** — `Home.js` має фіксований `POSTS_LIMIT=20`, немає пагінації
- **Onboarding** — `Register.js` робить `navigate('/')` одразу, немає вибору артист/жанр
- **PWA Service Worker** — `manifest.json` є, але SW не зареєстрований
- **2FA для адмінів** — Firebase TOTP MFA не реалізовано
- **Cookie Banner** — LOW PRIORITY, згадано в Privacy Policy
- **i18n** — гілка `feature/i18n-legal` існує але мінімальна, потрібно для виходу на ринок ЄС/США
- **Artist Claim System** — UnclaimedTracksTable в admin, Фаза 2
- **Now Playing (#30)** — на профілі, Фаза 1
- **Report System** — ReportModal є, потрібна інтеграція на пости/юзерів та admin queue

---

*Knitly — музика без меж. Андеграунд стає мейнстримом тут.*
