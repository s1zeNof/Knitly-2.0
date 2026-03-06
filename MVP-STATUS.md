# Knitly 2.0 — MVP Status

> Останнє оновлення: 2026-03-06
> Гілка: `feature/stories` (потрібно злити в `main` перед деплоєм)

---

## ✅ Що вже реалізовано

### Авторизація та профіль
- [x] Реєстрація (multi-step: ім'я, нік, email, пароль, дата народження)
- [x] Вхід (email + пароль)
- [x] Вихід
- [x] Забув пароль (`/forgot-password`) — Firebase `sendPasswordResetEmail`
- [x] Підтвердження email — банер + `/email-verified` сторінка
- [x] Перемикання акаунтів (account switcher)
- [x] Профіль сторінки з аватаром, обкладинкою, описом, статистикою
- [x] Підписки / підписники + сторінки `/followers` `/following`
- [x] Редагування профілю (`/settings`)
- [x] Сторіс на аватарі профілю (градієнтне кільце + viewer)

### Стрічка та пости
- [x] Стрічка публікацій (Feed)
- [x] Створення постів — Lexical rich text editor
- [x] Вкладення: зображення, музика, опитування
- [x] Лайки, коментарі, репости
- [x] Теги (#hashtag) + TagPage
- [x] Поширення постів (share modal + в особисті повідомлення)
- [x] Пошук — fuzzy matching, did-you-mean для тегів

### Сторіси
- [x] StoriesRow — горизонтальний ряд кіл на головній
- [x] Створення сторіс: фото (drag/zoom/rotate редактор) + відео
- [x] Перегляд сторіс — fullscreen viewer, прогрес-бар, тап навігація
- [x] Лайки сторіс
- [x] Видалення сторіс (з підтвердженням)
- [x] Переглядачі сторіс (viewers sheet з аватарами)
- [x] Градієнтне кільце навколо аватара коли є активні сторіси

### Музика
- [x] Завантаження треків (`/upload`) + чекбокс авторських прав
- [x] Плеєр з waveform (WaveSurfer.js)
- [x] Черга відтворення, Now Playing панель
- [x] Плейлисти (створення, перегляд, `/playlist/:id`)
- [x] Альбоми (створення, `/create-album`)
- [x] TrackPage (`/track/:id`)
- [x] Лайки треків
- [x] Now Playing на профілі (live broadcast banner)

### Месенджер
- [x] Особисті чати
- [x] Групові чати
- [x] Emoji паки (кастомні анімовані)
- [x] Реакції на повідомлення
- [x] Пересилання повідомлень
- [x] Закріплені повідомлення
- [x] Поширення постів в чат
- [x] Збережені повідомлення
- [x] Сховище (storage panel)

### Сповіщення
- [x] Сповіщення про нових підписників
- [x] Сповіщення про лайки постів
- [x] Сповіщення про коментарі
- [x] Сповіщення про лайки сторіс
- [x] Значок непрочитаних (badge)

### Creator Studio / Аналітика
- [x] Creator Studio (`/studio`) — аналітика постів і музики
- [x] Статистика переглядів, лайків, коментарів

### Адміністрування
- [x] Адмін-панель (`/admin`) — захищено AdminRoute
- [x] Управління юзерами (ролі, бан)
- [x] Управління подарунками
- [x] Система скарг (reports)

### Монетизація / Гейміфікація
- [x] Внутрішня валюта "Ноти" (Notes)
- [x] Маркетплейс подарунків (`/gifts`)
- [x] Відправка подарунків між юзерами
- [x] Wallet / поповнення балансу
- [x] Маркетплейс міні-додатків (`/apps`)

### UI / UX
- [x] Темна тема (dark mode only)
- [x] Адаптив (mobile + desktop)
- [x] Sidebar з 3 режимами (full / hover / icons-only)
- [x] BottomNavBar на мобільному
- [x] 404 сторінка (вінілова пластинка анімація)
- [x] Сторінки legal: Terms, Privacy, Copyright, Guidelines
- [x] In-app browser для зовнішніх посилань
- [x] Guest prompt (банер + попап для незалогінених)
- [x] Verified badge система
- [x] Vercel Analytics

---

## 🔴 Критично — потрібно до MVP лончу

| # | Задача | Статус |
|---|--------|--------|
| 1 | Задеплоїти `firestore.rules` в Firebase Console | ⏳ Потрібно зробити |
| 2 | OG/Meta теги для соцмереж (Profile, Post, Track) | ❌ Не зроблено |
| 3 | Онбординг нових юзерів (порожня стрічка → suggestions) | ❌ Не зроблено |

---

## 🟡 Важливо — бажано до лончу

| # | Задача | Статус |
|---|--------|--------|
| 4 | Custom Firebase email action URL (замість білої сторінки firebaseapp.com) | ⏳ Часткове (continueUrl додано) |
| 5 | `ArtistDashboard.js` — або підключити в routes або видалити | ❌ Зависло |
| 6 | Захистити `/migrate-cloudinary` — AdminRoute | ✅ Зроблено |
| 7 | Чекбокс авторських прав при upload музики | ✅ Зроблено |

---

## 🟢 Заплановано після MVP

- [ ] PWA (manifest.json, service worker, offline)
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Мобільна апка через Capacitor (Android спочатку, потім iOS)
- [ ] OG/meta теги (dynamic, per-route)
- [ ] Invite-only beta система (коди запрошень)
- [ ] Реферальна програма (запроси друга → бонусні Ноти)
- [ ] Admin: Badge Editor (SVG шляхи в Firestore)
- [ ] Admin: Custom Emoji Upload у панелі адміна
- [ ] Виправити баг кастомних emoji не завантажується (pre-existing)
- [ ] Алгоритмічна стрічка (зараз хронологічна)
- [ ] Stories: можливість завантажити кілька фото за раз
- [ ] Пошук по контенту (музика, пости, теги)

---

## 📦 Технічний стек

| Шар | Технологія |
|-----|-----------|
| Frontend | React 18, React Router 6 |
| Auth + DB | Firebase (Firestore, Auth) |
| Media storage | Cloudinary (через unsigned preset) |
| File storage | Supabase Storage |
| Hosting | Vercel |
| Rich text | Lexical (Meta) |
| Audio | WaveSurfer.js |
| Animations | Framer Motion, GSAP, Lottie |
| Analytics | Vercel Analytics |

---

## 🚀 Маркетинговий план (коротко)

### Соціальні мережі (зареєструй зараз)
- Instagram `@knitly.app`
- TikTok `@knitly.app`
- X (Twitter) `@knitlyapp`

### Pre-launch (за 2-3 тижні до лончу)
- Лендінг сторінка + waitlist форма (Mailchimp/Resend)
- Контент "будую соцмережу для музикантів"
- Визнач нішу: lo-fi, indie, ukrainian electronic?
- Знайди 5-10 перших юзерів особисто (ранній доступ)

### День лончу
- Product Hunt (вівторок/середа о 00:01 PST)
- Reddit: r/WeAreTheMusicMakers, r/indieheads, r/startups
- Hacker News: "Show HN: Knitly"
- Discord музичні сервери

### Після лончу
- Invite-only beta (ексклюзивність)
- Особисто коментуй і лайкай перших 100 юзерів
- Featured Artist щотижня

---

## 📱 Мобільна апка

**Рекомендований підхід: Capacitor**
- Бере існуючий React код → пакує як нативний .APK/.IPA
- Мінімум змін коду
- Android: $25 одноразово (Google Play)
- iOS: $99/рік (App Store)

**Порядок:**
1. Зараз: веб + PWA "Додай на домашній екран"
2. Через 1-2 місяці після лончу: Capacitor → Google Play
3. Через 3-6 місяців: App Store (якщо є аудиторія)
