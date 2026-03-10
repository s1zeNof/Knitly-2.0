/**
 * Knitly — Notion Documentation Generator
 * Запуск: NOTION_TOKEN=secret_xxx node scripts/create-notion-docs.mjs
 *
 * Створює під сторінкою Knitly (225474e940b7804aa8dfd7da50170c36):
 *   1. Project Overview (стек, статус, архітектура)
 *   2. MVP Status (що зроблено)
 *   3. Roadmap / Phases (фази 0–4)
 *   4. Feature Ideas (всі 39+ ідей по категоріях)
 *   5. Security Architecture
 */

const TOKEN   = process.env.NOTION_TOKEN;
const PARENT  = '225474e940b7804aa8dfd7da50170c36'; // твоя сторінка Knitly
const BASE    = 'https://api.notion.com/v1';
const HEADERS = {
    'Authorization':  `Bearer ${TOKEN}`,
    'Content-Type':   'application/json',
    'Notion-Version': '2022-06-28',
};

if (!TOKEN) {
    console.error('Вкажи NOTION_TOKEN=secret_xxx перед командою');
    process.exit(1);
}

// ---------- helpers ----------

const h1  = (t) => ({ object:'block', type:'heading_1',   heading_1:   { rich_text:[rt(t)] } });
const h2  = (t) => ({ object:'block', type:'heading_2',   heading_2:   { rich_text:[rt(t)] } });
const h3  = (t) => ({ object:'block', type:'heading_3',   heading_3:   { rich_text:[rt(t)] } });
const p   = (t, bold=false) => ({ object:'block', type:'paragraph',    paragraph:   { rich_text: t ? [rt(t,bold)] : [] } });
const bul = (t) => ({ object:'block', type:'bulleted_list_item', bulleted_list_item: { rich_text:[rt(t)] } });
const num = (t) => ({ object:'block', type:'numbered_list_item', numbered_list_item: { rich_text:[rt(t)] } });
const tod = (t, checked=false) => ({ object:'block', type:'to_do', to_do: { rich_text:[rt(t)], checked } });
const div = ()  => ({ object:'block', type:'divider', divider:{} });
const code = (t, lang='javascript') => ({ object:'block', type:'code', code:{ rich_text:[rt(t)], language:lang } });
const call = (t, emoji='💡') => ({ object:'block', type:'callout', callout:{ rich_text:[rt(t)], icon:{ type:'emoji', emoji } } });

function rt(text, bold=false, color='default') {
    return { type:'text', text:{ content: String(text) }, annotations:{ bold, color } };
}

async function createPage(parentId, title, emoji, children) {
    const body = {
        parent:     { page_id: parentId },
        icon:       { type:'emoji', emoji },
        properties: { title:{ title:[{ type:'text', text:{ content: title } }] } },
        children:   children.slice(0, 100), // Notion limit per request
    };
    const res  = await fetch(`${BASE}/pages`, { method:'POST', headers: HEADERS, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { console.error('API Error:', JSON.stringify(data,null,2)); throw new Error(data.message); }
    console.log(`  ✅ Створено: "${title}" (${data.id})`);

    // Якщо блоків більше 100 — додаємо частинами
    if (children.length > 100) {
        for (let i = 100; i < children.length; i += 100) {
            const chunk = children.slice(i, i + 100);
            await appendBlocks(data.id, chunk);
        }
    }
    return data.id;
}

async function appendBlocks(pageId, blocks) {
    const res  = await fetch(`${BASE}/blocks/${pageId}/children`, {
        method:'PATCH', headers: HEADERS,
        body: JSON.stringify({ children: blocks }),
    });
    const data = await res.json();
    if (!res.ok) { console.error('Append error:', JSON.stringify(data,null,2)); throw new Error(data.message); }
}

// ============================================================
// PAGE 1 — Project Overview
// ============================================================
async function createOverviewPage(parentId) {
    const blocks = [
        call('Knitly — музична соціальна мережа для андеграундних артистів України та світу. Унікальна ніша: специфічної платформи такого типу в Україні не існує.', '🎯'),
        p(''),
        h1('Концепція'),
        bul('Незалежні / андеграундні музиканти, які хочуть розкрутитись'),
        bul('Первинний ринок: Україна → СНД → світ'),
        bul('Позиціонування: "тут з\'являються нові артисти першими"'),
        bul('Аналоги: SoundCloud, Bandcamp, Audiomack — але для UA-ринку'),
        div(),
        h1('Технічний стек'),
        h2('Frontend'),
        bul('React 18 + Vite — основний фреймворк'),
        bul('React Router v6 — маршрутизація'),
        bul('React Query (react-query) — кешування та стан серверних даних'),
        bul('Context API — глобальний стан (UserContext, PlayerContext)'),
        bul('CSS Modules + CSS Variables — стилізація без конфліктів'),
        bul('Framer Motion — анімації'),
        bul('Lottie — складні анімації (JSON)'),
        bul('Lexical Editor — rich text редактор постів'),
        bul('Lucide React — іконки'),
        bul('react-hot-toast — нотифікації'),
        h2('Backend / Інфраструктура'),
        bul('Firebase Firestore — основна БД (posts, users, tracks, playlists, notifications, chats, reports)'),
        bul('Firebase Auth — авторизація (email+password, Google OAuth, TOTP 2FA для адмінів)'),
        bul('Supabase Storage — зберігання файлів (аватари, обкладинки треків, аудіо)'),
        bul('Firebase Realtime Database — планується для presence/typing/rooms (sub-100ms)'),
        bul('Vercel — хостинг frontend'),
        bul('Cloudflare — CDN, WAF, DDoS-захист (після купівлі домену knitly.app)'),
        h2('Admin Panel (окремий Vite app)'),
        bul('Порт 5174, окремий Vite-проект у /admin папці'),
        bul('Firebase Auth з RBAC (ролі: super_admin, admin, moderator, support)'),
        bul('Сторінки: Dashboard, Users, Reports (скарги), UserDetail, UnclaimedTracks'),
        div(),
        h1('Дизайн-система'),
        bul('Тема: темна (dark mode), glassmorphism ефекти'),
        bul('Акцентний колір: #a855f7 (фіолетовий)'),
        bul('Шрифт: Urbanist (Google Fonts)'),
        bul('Yarn/thread декоративна нитка між постами (SVG diamond stitch tile, seamless)'),
        bul('Адаптивність: desktop / tablet / mobile (BottomNavBar для мобайлу)'),
        bul('Сайдбар: 3 режими — full (280px), hover, icons (64px)'),
        div(),
        h1('Архітектура Firestore'),
        h2('Основні колекції'),
        bul('users/{uid} — профілі, налаштування, likedTracks, roles'),
        bul('posts/{postId} — дописи з реакціями, типами (post/poll/repost/track)'),
        bul('tracks/{trackId} — музичні треки, метадані, лічильники'),
        bul('playlists/{playlistId} — плейлисти'),
        bul('chats/{chatId}/messages/{msgId} — особисті повідомлення'),
        bul('users/{uid}/notifications/{notifId} — сповіщення (subcollection)'),
        bul('reports/{reportId} — скарги (pending/resolved/dismissed)'),
        bul('audit_log/{logId} — append-only лог дій адмінів'),
        h2('Firestore Security Rules — ключові патерни'),
        bul('Нотифікації: allow create if isSignedIn() — будь-який авторизований може нотифікувати'),
        bul('Чат read: resource == null || uid in resource.data.participants'),
        bul('Message create: exists() check OR !exists(chatRef) для batch write'),
        bul('Admin: get(...users/uid).data.roles.hasAny([\'admin\'])'),
        bul('hasNoPrivilegedFields() — захист від ін\'єкції ролі при реєстрації'),
    ];
    return createPage(parentId, 'Project Overview', '📋', blocks);
}

// ============================================================
// PAGE 2 — MVP Status
// ============================================================
async function createMVPPage(parentId) {
    const blocks = [
        call('Поточний статус: MVP розробка. Деплой на knitly-demo.vercel.app', '🚀'),
        p(''),
        h1('✅ Фаза 0 — Завершено'),
        h2('Авторизація та Акаунт'),
        tod('Login / Register сторінки (glassmorphism, split-panel дизайн)', true),
        tod('Google OAuth', true),
        tod('ForgotPassword сторінка', true),
        tod('Email верифікація', true),
        tod('Delete Account (GDPR — право на видалення)', true),
        tod('Налаштування: профіль, приватність, чат, зовнішній вигляд, акаунт', true),
        h2('Профіль'),
        tod('Сторінка профілю (банер, аватар, статистика)', true),
        tod('FollowersPage — вкладки Mutual / Followers / Following', true),
        tod('Now Playing banner на профілі (Feature #30)', true),
        tod('Multi-account switcher (до 3 акаунтів)', true),
        h2('Стрічка та Пости'),
        tod('Feed — стрічка з постами підписок', true),
        tod('PostCard — реакції, коментарі, вкладення', true),
        tod('Lexical rich-text editor', true),
        tod('Типи контенту: text, music, media, poll, collaborator', true),
        tod('ShareModal — поширити пост в ЛС (з фільтрацією messagePrivacy)', true),
        tod('Система скарг (ReportModal) на постах — йде в адмінку', true),
        h2('Музика'),
        tod('Завантаження треків (UploadMusic) з лімітами', true),
        tod('Глобальний аудіо-плеєр (PlayerContext)', true),
        tod('TrackList + LikedTracks — список/сітка, лайк, черга', true),
        tod('TrackPage — сторінка треку', true),
        tod('Плейлисти (створення, перегляд, PlaylistPage)', true),
        tod('Поскаржитись на трек (ReportModal в TrackList)', true),
        tod('Search сторінка + Stories Archive вкладка', true),
        h2('Чат та Сповіщення'),
        tod('Direct Messages (MessagesPage)', true),
        tod('Privacy налаштування: everyone/following/requests/nobody', true),
        tod('Notifications сторінка', true),
        h2('Адмін-панель (окремий Vite app, порт 5174)'),
        tod('Dashboard', true),
        tod('Users list + UserDetailPage', true),
        tod('ReportsPage — черга скарг з фільтрами pending/resolved/dismissed', true),
        tod('UnclaimedTracksTable — Artist Claim System (Фаза 2)', true),
        tod('ResolveModal — рішення по скарзі з нотифікацією скаржнику', true),
        h2('Legal Pages'),
        tod('Terms of Service — /terms (UK + EN)', true),
        tod('Privacy Policy (GDPR + UA закон) — /privacy', true),
        tod('Copyright / DMCA — /copyright', true),
        tod('Community Guidelines — /guidelines', true),
        tod('LegalLayout + PublicHeader + SiteFooter', true),
        tod('ToS чекбокс при реєстрації', true),
        h2('Безпека'),
        tod('Firebase Security Rules — 5 вразливостей виправлено', true),
        tod('vercel.json — HTTP Security Headers (HSTS, CSP, X-Frame-Options...)', true),
        tod('Firebase credentials в .env (не в коді)', true),
        tod('reports + audit_log колекції в Rules', true),
        div(),
        h1('🔨 Фаза 1 — В процесі / Найближче'),
        tod('2FA для адмінів (Firebase TOTP MFA)', false),
        tod('Feed "Завантажити ще" / pagination (startAfter)', false),
        tod('Онбординг при реєстрації — вибір жанрів/артистів', false),
        tod('PWA Service Worker (manifest вже є)', false),
        tod('Cookie Banner', false),
        div(),
        h1('📊 Метрики MVP'),
        bul('Frontend: ~50+ React компонентів'),
        bul('Сторінок маршрутів: 20+'),
        bul('Firestore колекцій: 10+'),
        bul('Admin panel: окремий Vite app'),
        bul('Legal pages: 4 мови (UK + EN)'),
        bul('Security rules: ~200 рядків'),
    ];
    return createPage(parentId, 'MVP Status', '🏁', blocks);
}

// ============================================================
// PAGE 3 — Roadmap / Phases
// ============================================================
async function createRoadmapPage(parentId) {
    const blocks = [
        call('Роадмап розбитий на 5 фаз: 0 (завершено) → 4 (Vision). Кожна фаза має чіткі deliverables.', '🗺️'),
        p(''),
        h1('Фаза 0 ✅ — Завершено'),
        bul('MVP: профілі, музика, пости, чат, плеєр, нотифікації'),
        bul('Legal pages: /terms /privacy /copyright /guidelines'),
        bul('Firebase Security Rules (5 вразливостей)'),
        bul('vercel.json HTTP Security Headers'),
        bul('Система скарг: ReportModal + адмін-черга'),
        bul('Admin panel: Users, Reports, UserDetail'),
        bul('Документація: 25+ ідей, архітектурні рішення, пентест-чеклист'),
        div(),
        h1('Фаза 1 🔨 — До MVP Launch'),
        call('Все що потрібно щоб сміливо запустити публічний MVP', '🎯'),
        h2('C1 — Система скарг (ЗАВЕРШЕНО)'),
        tod('ReportModal — компонент скарги (7 причин)', true),
        tod('reportService.js — Firestore запис', true),
        tod('Кнопка на постах — вже є', true),
        tod('Кнопка на треках (TrackList "..." меню)', true),
        tod('ReportsPage в адмінці з фільтрами', true),
        tod('ReportResultPage — сторінка результату для скаржника', true),
        h2('C2 — Адмін-панель (ЗАВЕРШЕНО)'),
        tod('Захищений вхід (email/password + RBAC)', true),
        tod('UserDetailPage — детальна інформація про юзера', true),
        tod('UnclaimedTracksTable', true),
        tod('2FA для адмінів (Firebase TOTP)', false),
        h2('D — 2FA Адмінів'),
        tod('Firebase TOTP MFA (обов\'язково для role:admin)', false),
        tod('Backup коди', false),
        h2('UX — Необхідні доробки'),
        tod('Feed pagination ("Завантажити ще" / startAfter)', false),
        tod('Онбординг при реєстрації (вибір жанрів/артистів)', false),
        tod('PWA Service Worker', false),
        div(),
        h1('Фаза 2 🚀 — Запуск (Ріст аудиторії)'),
        h2('E — Верифікація артистів + Audio Fingerprinting'),
        bul('ACRCloud або AcoustID інтеграція'),
        bul('Рівень 1 (Артист): завантаження WAV/FLAC + соцмережі → бейдж'),
        bul('Рівень 2 (Верифікований ✓): email домен + Spotify/Apple Music'),
        bul('"Claim Your Music": верифікований артист забирає треки'),
        bul('UI для заявки на верифікацію'),
        h2('F — Emoji/Sticker паки'),
        bul('CreateEmojiPack + EditEmojiPack (вже є базова структура)'),
        bul('Модерація паків в адмінці'),
        bul('Заборонені назви (RESERVED_NAMES + levenshtein)'),
        h2('I — Firebase RTDB'),
        bul('presence/{userId} → online status (#31)'),
        bul('typing/{chatId}/{userId} → typing indicator (#8)'),
        h2('UX2 — Медіа в чаті'),
        bul('Фото + відео повідомлення'),
        bul('Редактор фото (обрізка + 10 фільтрів)'),
        bul('Прогрес-смужка завантаження'),
        h2('UX3 — RilsTrack (Killer Feature!)'),
        bul('Вертикальна TikTok-подібна стрічка треків'),
        bul('Обкладинка + теги + коментарі + реакції'),
        bul('Всі існуючі треки автоматично потрапляють'),
        bul('Вподобаний трек → "Вподобані"'),
        bul('Cloudflare після купівлі knitly.app'),
        div(),
        h1('Фаза 3 📈 — Ріст'),
        h2('G — E2EE Secret Chats'),
        bul('Web Crypto API (ECDH + AES-256-GCM)'),
        bul('privateKey ніколи не виходить з браузера'),
        bul('IndexedDB для зберігання ключів'),
        h2('UX — Stories + Rooms + Analytics'),
        bul('#38 Stories — 24г TTL, Cloud Function auto-delete'),
        bul('#17 Кімнати спільного прослуховування (RTDB)'),
        bul('#39 Аналітика — Wrapped-стиль, постійна для артистів'),
        bul('#37 Реакції на повідомлення (double-tap ❤️)'),
        h2('AI'),
        bul('#33 Чарівна паличка в редакторі (Gemini API)'),
        bul('Генерація тексту поста / режим генерації'),
        bul('#34 AI детекція спаму/NSFW'),
        h2('Інше Фаза 3'),
        bul('#11b Онбординг-опитувальник → персоналізована стрічка'),
        bul('#28 Таймер дропу альбому + анімований блюр'),
        bul('#21 Колаборативні плейлисти'),
        bul('2FA для звичайних юзерів (опціонально)'),
        div(),
        h1('Фаза 4 🌐 — Масштаб / Vision'),
        h2('"Ноти" Economy'),
        bul('1 нота = 1 грн, валюта платформи'),
        bul('Cloud Functions atomic transactions (wallets/{userId})'),
        bul('Анімовані подарунки на треки/пости'),
        bul('NFT/Web3 подарунки'),
        bul('Premium підписка за Ноти (градієнтний фон, ексклюзиви)'),
        bul('Топ-донатери на профілі артиста'),
        h2('Bot / Mini-Apps'),
        bul('#26 Bot API всередині Knitly (як Telegram Mini Apps)'),
        bul('Канал Knitly — автопости'),
        bul('Власні боти всередині платформи'),
        h2('Інфраструктура'),
        bul('Firebase multi-region (europe-west + backup)'),
        bul('Власні сервери для E2EE ключів'),
        bul('Розподілена інфраструктура'),
        bul('API для зовнішніх розробників'),
        bul('Монетизація для артистів (стрімінгові виплати)'),
        bul('Лейбли / менеджмент акаунти'),
    ];
    return createPage(parentId, 'Roadmap & Phases', '🗺️', blocks);
}

// ============================================================
// PAGE 4 — Feature Ideas
// ============================================================
async function createIdeasPage(parentId) {
    const blocks = [
        call('39+ ідей з TG-каналу та Notion засновника. Статуси: 💭 ідея → 🔨 в розробці → ✅ реалізовано', '💡'),
        p(''),
        h1('💬 Чат та Повідомлення'),
        bul('#1 Knitly Notifications — системний бот-чат (сповіщення про вхід з IP/локацією)'),
        bul('#4 Медіа в чаті — фото/відео, SD/HD, редактор (обрізка + 10 фільтрів), прогрес-смужка'),
        bul('#8 Typing indicators — три крапки + анімація еквалайзера при аудіо, медіа-іконка при завантаженні'),
        bul('#9 Реакції на повідомлення — double-tap = ❤️, довге натискання → контекстне меню'),
        bul('#12 @згадування — глобально у чатах і коментарях'),
        bul('#13 Системні placeholder-повідомлення — по центру чату ("Ім\'я створив групу")'),
        bul('#24 Поширення в ЛС — кнопка "поділитись" на пості → вікно з підписниками + пошук'),
        div(),
        h1('🎵 Музика'),
        bul('#5 Репост треку в профіль — як SoundCloud, з\'являється в профілі'),
        bul('#6 Співавторство — позначення кількох авторів, передача прав'),
        bul('#28 Таймер дропу альбому — виставляєш дату, блюр назви/обкладинки/треків (анімований як у TG)'),
        bul('#37 RilsTrack — вертикальна TikTok-стрічка треків [KILLER FEATURE, Фаза 2]'),
        div(),
        h1('💰 Монетизація — "Ноти"'),
        bul('#11 Валюта "Ноти" — 1 нота = 1 грн. NFT-реакції, анімовані подарунки. 🎶 іконка'),
        bul('#18 Система подарунків — купівля за Ноти, відправлення артистам, топ-донатери'),
        bul('#22 Ноти в стрічці — подарунки до постів, просування за Ноти'),
        bul('#36 Premium підписка — за Ноти: градієнтний фон профілю/чату, ексклюзиви'),
        div(),
        h1('📝 Стрічка та Дописи'),
        bul('#11b Онбординг — опитувальник при реєстрації (жанри/хештеги) → персоналізована стрічка'),
        bul('#22b Polls у постах — артист питає "Який трек випустити?"'),
        bul('#23 Таби на головній — "Нові дописи" кнопка, розділення Стрічка/Музика/Теги'),
        bul('#25 Правий клік на пост — кастомне контекстне меню'),
        bul('#34 AI захист від спаму/NSFW — детекція заборонених посилань'),
        div(),
        h1('👤 Профіль та Акаунт'),
        bul('#31 Онлайн статус — "Онлайн" / "Остання активність". Налаштування: Усі / Контакти / Ніхто'),
        bul('#32 Соцмережі в профілі — Instagram, Website, X (БЕЗ SoundCloud/Spotify — ризик відтоку)'),
        bul('#38 Stories — кружечки на головній, відео-кружечки в чаті, щось унікальне'),
        bul('#39 Аналітика — Wrapped-стиль + постійна. Хвилини, топ треки, дні, жанри → алгоритм'),
        div(),
        h1('🎧 Кімнати (Spaces)'),
        bul('#17 Кімнати спільного прослуховування — хост керує чергою, синхронізація для всіх, прем\'єри альбомів'),
        div(),
        h1('🎭 Плейлисти'),
        bul('#21 Колаборативні плейлисти — запрошення через @нік, хто який трек додав, ліміт треків'),
        div(),
        h1('⭐ Емоджі та Стікери'),
        bul('#16 Кастомізація кольору емоджі — color picker, рандомні пресети, зміна кольору анімованих'),
        div(),
        h1('🤖 ШІ та Автоматизація'),
        bul('#33 AI в редакторі — "чарівна паличка": покращення тексту / режим генерації (Gemini API)'),
        bul('#34 AI детекція спаму/NSFW в постах'),
        div(),
        h1('🌐 Платформа та Ecosystem'),
        bul('#26 Система ботів / Bot API — як Telegram Mini Apps'),
        bul('#35 Notion-референс — що адаптувати з UX Notion (блоки, структуровані пости)'),
        div(),
        h1('Архітектурні нотатки'),
        h2('Firebase RTDB (для швидких операцій < 100ms)'),
        code('presence/{userId}         → { online: bool, lastSeen: timestamp }\ntyping/{chatId}/{userId}  → { isTyping: bool, mediaType }\nrooms/{roomId}/state      → { currentTrack, position, isPlaying }', 'javascript'),
        h2('Нові Firestore колекції (готуємо заздалегідь)'),
        code('stories/{userId}/items/{storyId}:  url, type, expiresAt\nanalytics/{userId}:  monthlyStats, totalPlays, topTracks[]\nrooms/{roomId}:  host, participants[], queue[], currentTrack\nwallets/{userId}:  balance (read-only), totalEarned, totalSpent\ntransactions/{txId}:  from, to, amount, type (IMMUTABLE)', 'javascript'),
    ];
    return createPage(parentId, 'Feature Ideas', '💡', blocks);
}

// ============================================================
// PAGE 5 — Security Architecture
// ============================================================
async function createSecurityPage(parentId) {
    const blocks = [
        call('Принцип: захист через Firebase Rules + vercel.json headers + Cloudflare (після домену). НІЯКИХ open rules.', '🔐'),
        p(''),
        h1('Основні загрози'),
        bul('Script kiddies — автоматизовані сканери (SQLi, XSS, open redirects)'),
        bul('Credential stuffing — зламані паролі з інших сайтів'),
        bul('Admin panel brute force — боти шукають /admin'),
        bul('Firebase Rules abuse — погані правила = читання/запис чужих даних'),
        bul('Content abuse — спам, піратство, NSFW'),
        div(),
        h1('Firebase Security Rules — Виправлені вразливості'),
        tod('Ін\'єкція ролі адміна (role:admin при реєстрації) → hasNoPrivilegedFields()', true),
        tod('Підробка emoji-пака (type:official) → валідація при create/update', true),
        tod('Зміна participants чату учасником → перевірка незмінності', true),
        tod('Нотифікаційний спам → toUserId == userId && fromUserId == auth.uid', true),
        tod('Колекції reports + audit_log (append-only, тільки Admin SDK)', true),
        tod('Лічильники (likesCount) — часткова проблема, потрібні Cloud Functions', false),
        div(),
        h1('HTTP Security Headers (vercel.json)'),
        code('X-Frame-Options: DENY\nX-Content-Type-Options: nosniff\nStrict-Transport-Security: max-age=31536000; includeSubDomains; preload\nContent-Security-Policy: (Firebase + Supabase + Google Fonts whitelist)\nReferrer-Policy: strict-origin-when-cross-origin\nPermissions-Policy: camera=(), microphone=(), geolocation=()', 'bash'),
        div(),
        h1('Адмін-панель — Захист'),
        bul('URL: /kn-[секретний-хеш]-control (НЕ /admin — боти не знайдуть)'),
        bul('IP Whitelist: тільки IP команди'),
        bul('TOTP 2FA: Google Authenticator обов\'язково (в роботі)'),
        bul('Cloudflare Zero Trust: тунель (після купівлі домену)'),
        bul('Session timeout: 30 хв неактивності → автовихід'),
        h2('RBAC ролі'),
        bul('super_admin — все (лише 1-2 засновники)'),
        bul('admin — бани, видалення, верифікація'),
        bul('moderator — розгляд скарг, попередження'),
        bul('support — читання тікетів, відповіді'),
        div(),
        h1('Шифрування чатів'),
        h2('Звичайні чати (Cloud Chats)'),
        bul('Firebase Firestore encrypted at rest (Google шифрує диски)'),
        bul('HTTPS/TLS автоматично через Firebase'),
        bul('Knitly технічно може читати — як Instagram/Twitter (нормально)'),
        bul('Захист: строгі Firebase Rules — тільки учасники читають'),
        h2('Секретні чати (E2EE — Фаза 3)'),
        code('Алгоритм: ECDH (обмін ключами) + AES-256-GCM (шифрування)\nPrivateKey: зберігається в IndexedDB, НІКОЛИ не виходить з браузера\nPublicKey: надсилається на сервер\nСервер: зберігає зашифрований blob — сам прочитати НЕ МОЖЕ\nБібліотека: Web Crypto API або TweetNaCl.js', 'javascript'),
        div(),
        h1('Cloudflare (після купівлі knitly.app)'),
        num('Зареєструватись cloudflare.com → Add Site'),
        num('Перенести NS до Cloudflare'),
        num('SSL/TLS: Full (strict) + HSTS'),
        num('Bot Fight Mode: ON'),
        num('WAF Managed Rules: ON'),
        num('5 Custom Firewall Rules: rate limit auth, блок scanner UA, захист адмін URL'),
        div(),
        h1('Пентест-чеклист (після кожного релізу)'),
        tod('1.1 Ін\'єкція ролі admin при updateDoc', false),
        tod('1.2 Маніпуляція лічильниками (likesCount: 999999)', false),
        tod('1.3 Читання чужих нотифікацій', false),
        tod('1.4 Підробка офіційного emoji-пака', false),
        tod('1.5 Запис у чужий профіль', false),
        tod('2.1 IDOR — доступ до чужого чату', false),
        tod('2.4 XSS через поля профілю (displayName, bio)', false),
        tod('2.5 Видалення чужого треку/поста', false),
        tod('3.3 Перевірка Firebase API Key restrictions', false),
        tod('3.5 Перевірка Security Headers після деплою', false),
    ];
    return createPage(parentId, 'Security Architecture', '🔐', blocks);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
    console.log('\n🚀 Knitly Notion Docs Generator\n');
    console.log(`📄 Parent page: ${PARENT}`);
    console.log(`🔑 Token: ${TOKEN.slice(0,12)}...\n`);

    try {
        // Створюємо hub-сторінку
        const hubId = await createPage(PARENT, 'Knitly — Project Hub', '🎵', [
            call('Головна документація проекту. Всі деталі у вкладених сторінках.', '📚'),
            p(''),
            h1('Навігація'),
            bul('📋 Project Overview — стек, архітектура, дизайн-система'),
            bul('🏁 MVP Status — що зроблено, що ще треба'),
            bul('🗺️ Roadmap & Phases — фази 0–4'),
            bul('💡 Feature Ideas — 39+ ідей по категоріях'),
            bul('🔐 Security Architecture — Firebase Rules, E2EE, Cloudflare'),
            p(''),
            h2('Ключові факти'),
            bul('Stack: React 18 + Vite + Firebase + Supabase'),
            bul('Market: Україна → СНД → Світ (андеграундна музика)'),
            bul('Status: MVP, деплой на knitly-demo.vercel.app'),
            bul('Admin: окремий Vite app (порт 5174)'),
            bul('Legal: Terms + Privacy + Copyright + Guidelines (UK + EN)'),
        ]);

        console.log('\n📖 Створюємо вкладені сторінки...\n');

        await createOverviewPage(hubId);
        await createMVPPage(hubId);
        await createRoadmapPage(hubId);
        await createIdeasPage(hubId);
        await createSecurityPage(hubId);

        console.log('\n✅ Всі сторінки створено!\n');
        console.log('Відкривай Notion і перевіряй:');
        console.log(`https://www.notion.so/${PARENT}\n`);
    } catch (err) {
        console.error('\n❌ Помилка:', err.message);
        process.exit(1);
    }
}

main();
