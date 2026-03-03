import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPage.css';

const SECTIONS = [
    'Які дані ми збираємо',
    'Як ми використовуємо ваші дані',
    'Де зберігаються дані',
    'Передача даних третім сторонам',
    'Ваші права',
    'Файли cookie',
    'Безпека даних',
    'Зміни до цієї політики',
];

export default function PrivacyPage() {
    return (
        <article>
            {/* ── Hero ── */}
            <header className="lp-hero">
                <nav className="lp-breadcrumb" aria-label="Хлібні крихти">
                    <Link to="/">Knitly</Link>
                    <span className="lp-breadcrumb-sep" aria-hidden="true">›</span>
                    <span>Правові документи</span>
                    <span className="lp-breadcrumb-sep" aria-hidden="true">›</span>
                    <span>Конфіденційність</span>
                </nav>
                <p className="lp-badge">🔐 Захист даних</p>
                <h1 className="lp-title">Політика конфіденційності</h1>
                <div className="lp-meta">
                    <span className="lp-meta-item">🗓 Набирає чинності: 1 березня 2025 р.</span>
                    <span className="lp-meta-item">🔄 Оновлено: 1 березня 2025 р.</span>
                    <span className="lp-meta-item">⚖️ GDPR + Закон України №2297-VI</span>
                </div>
            </header>

            {/* ── Table of contents ── */}
            <nav className="lp-toc" aria-label="Зміст">
                <p className="lp-toc-title">Зміст</p>
                <ol className="lp-toc-list">
                    {SECTIONS.map((title, i) => (
                        <li key={i}>
                            <a href={`#s${i + 1}`} className="lp-toc-link">
                                <span className="lp-toc-num">{i + 1}.</span>
                                {title}
                            </a>
                        </li>
                    ))}
                </ol>
            </nav>

            {/* ── Content ── */}
            <div className="lp-content">

                <div className="lp-highlight">
                    <strong>Коротко:</strong> Ми збираємо лише необхідні дані для роботи сервісу. Ми не продаємо ваші дані. Ви маєте право запросити видалення будь-яких ваших даних.
                </div>

                {/* 1 */}
                <section id="s1" className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-section-num">1</span>
                        <h2 className="lp-section-title">Які дані ми збираємо</h2>
                    </div>
                    <p><strong>Дані, що ви надаєте нам напряму:</strong></p>
                    <ul>
                        <li>Email-адреса та пароль (при реєстрації)</li>
                        <li>Ім'я користувача (нікнейм) та відображуване ім'я</li>
                        <li>Фото профілю та банер</li>
                        <li>Опис профілю, посилання на соцмережі</li>
                        <li>Аудіофайли, обкладинки, тексти треків (контент, що ви завантажуєте)</li>
                        <li>Повідомлення чату (зашифровані)</li>
                    </ul>
                    <p><strong>Дані, що збираються автоматично:</strong></p>
                    <ul>
                        <li>IP-адреса та приблизне геолокаційне положення</li>
                        <li>Тип пристрою, операційна система, браузер</li>
                        <li>Дата та час відвідування, переглянуті сторінки</li>
                        <li>Статистика відтворень (кількість прослуховувань треків)</li>
                    </ul>
                    <div className="lp-info">
                        Ми не збираємо дані банківських карток — всі платежі обробляються через захищені платіжні системи.
                    </div>
                </section>

                {/* 2 */}
                <section id="s2" className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-section-num">2</span>
                        <h2 className="lp-section-title">Як ми використовуємо ваші дані</h2>
                    </div>
                    <p>Knitly використовує зібрані дані виключно для таких цілей:</p>
                    <ul>
                        <li><strong>Надання послуг:</strong> автентифікація, відображення профілів, відтворення музики.</li>
                        <li><strong>Покращення сервісу:</strong> аналіз використання, виявлення та виправлення помилок.</li>
                        <li><strong>Персоналізація:</strong> рекомендації треків та авторів на основі ваших уподобань.</li>
                        <li><strong>Безпека:</strong> виявлення шахрайства, захист від несанкціонованого доступу.</li>
                        <li><strong>Зв'язок:</strong> надсилання важливих сповіщень щодо змін в сервісі.</li>
                        <li><strong>Правові зобов'язання:</strong> дотримання вимог законодавства.</li>
                    </ul>
                    <p>
                        Ми <strong>не</strong> продаємо ваші персональні дані третім особам. Ми <strong>не</strong> використовуємо ваші дані для таргетованої реклами без вашої явної згоди.
                    </p>
                </section>

                {/* 3 */}
                <section id="s3" className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-section-num">3</span>
                        <h2 className="lp-section-title">Де зберігаються дані</h2>
                    </div>
                    <p>
                        Knitly використовує надійні хмарні інфраструктури для зберігання ваших даних:
                    </p>
                    <ul>
                        <li>
                            <strong>Firebase / Google Cloud (Alphabet Inc., США)</strong> — база даних, автентифікація.
                            Дані зашифровані в стані спокою (AES-256) та під час передачі (TLS). Google є
                            сертифікованим партнером ISO 27001, SOC 1/2/3.
                        </li>
                        <li>
                            <strong>Supabase Storage</strong> — зберігання медіафайлів (аватари, обкладинки, аудіофайли).
                            Дані зберігаються в регіонах ЄС/США.
                        </li>
                        <li>
                            <strong>Cloudflare</strong> — CDN та захист від атак. Cloudflare обробляє трафік
                            відповідно до власної Політики конфіденційності.
                        </li>
                    </ul>
                    <p>
                        Передача даних до третіх країн (за межі ЄС/України) здійснюється на підставі стандартних
                        договірних положень відповідно до вимог GDPR.
                    </p>
                </section>

                {/* 4 */}
                <section id="s4" className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-section-num">4</span>
                        <h2 className="lp-section-title">Передача даних третім сторонам</h2>
                    </div>
                    <p>Ми можемо передавати ваші дані у таких випадках:</p>
                    <ul>
                        <li><strong>За вашою згодою</strong> — при використанні функцій авторизації через Google та інших.</li>
                        <li><strong>Постачальники послуг</strong> — технічні партнери (Firebase, Supabase, Cloudflare) виключно для надання сервісу.</li>
                        <li><strong>Вимоги закону</strong> — на запит уповноважених державних органів відповідно до чинного законодавства України.</li>
                        <li><strong>Захист прав</strong> — для розслідування шахрайства або порушень Умов використання.</li>
                    </ul>
                    <div className="lp-warning">
                        Knitly ніколи не передає ваші персональні дані рекламним мережам або брокерам даних.
                    </div>
                </section>

                {/* 5 */}
                <section id="s5" className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-section-num">5</span>
                        <h2 className="lp-section-title">Ваші права</h2>
                    </div>
                    <p>
                        Відповідно до Закону України «Про захист персональних даних» та GDPR ви маєте такі права:
                    </p>
                    <ul>
                        <li><strong>Право на доступ:</strong> отримати копію ваших персональних даних.</li>
                        <li><strong>Право на виправлення:</strong> виправити неточні дані (через Налаштування профілю).</li>
                        <li><strong>Право на видалення:</strong> запросити видалення вашого облікового запису та даних.</li>
                        <li><strong>Право на обмеження обробки:</strong> тимчасово заблокувати обробку ваших даних.</li>
                        <li><strong>Право на перенесення:</strong> отримати ваші дані у машиночитаному форматі.</li>
                        <li><strong>Право на заперечення:</strong> відмовитись від певних видів обробки даних.</li>
                    </ul>
                    <p>
                        Для реалізації будь-якого з цих прав надішліть запит на <a href="mailto:privacy@knitly.app">privacy@knitly.app</a>. Ми розглянемо запит протягом 30 днів.
                    </p>
                </section>

                {/* 6 */}
                <section id="s6" className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-section-num">6</span>
                        <h2 className="lp-section-title" id="cookies">Файли cookie</h2>
                    </div>
                    <p>
                        Knitly використовує файли cookie та схожі технології для забезпечення роботи сервісу:
                    </p>
                    <ul>
                        <li><strong>Необхідні cookie:</strong> автентифікація, безпека сесії — не можуть бути відключені.</li>
                        <li><strong>Функціональні cookie:</strong> збереження налаштувань (темна тема, мова, режим сайдбару).</li>
                        <li><strong>Аналітичні cookie:</strong> анонімна статистика використання (Vercel Analytics) — можуть бути відключені.</li>
                    </ul>
                    <p>
                        При першому відвідуванні ви побачите банер із запитом на згоду. Ви можете змінити налаштування cookie у будь-який час через налаштування браузера.
                    </p>
                </section>

                {/* 7 */}
                <section id="s7" className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-section-num">7</span>
                        <h2 className="lp-section-title">Безпека даних</h2>
                    </div>
                    <p>Ми застосовуємо комплекс заходів для захисту ваших даних:</p>
                    <ul>
                        <li>Шифрування даних у стані спокою (AES-256) та під час передачі (TLS 1.3).</li>
                        <li>Захист від несанкціонованого доступу через Firebase Security Rules.</li>
                        <li>Захист інфраструктури за допомогою Cloudflare WAF та DDoS-захисту.</li>
                        <li>Регулярні перевірки безпеки та аудит доступів.</li>
                        <li>Двофакторна автентифікація для всіх адміністраторів платформи.</li>
                    </ul>
                    <p>
                        Незважаючи на всі заходи безпеки, жодна система не є абсолютно захищеною. У разі виявлення витоку даних, що може вплинути на ваші права, ми повідомимо вас та відповідні органи протягом 72 годин.
                    </p>
                </section>

                {/* 8 */}
                <section id="s8" className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-section-num">8</span>
                        <h2 className="lp-section-title">Зміни до цієї політики</h2>
                    </div>
                    <p>
                        Ми можемо оновлювати цю Політику конфіденційності. При суттєвих змінах ми повідомимо вас через email або сповіщення на Платформі не менш ніж за 14 днів до набрання змін чинності.
                    </p>
                    <p>
                        Дата останнього оновлення завжди вказана у верхній частині цього документа. Рекомендуємо регулярно переглядати Політику.
                    </p>
                </section>

                {/* Contact */}
                <div className="lp-contact-card">
                    <h3>Запити щодо конфіденційності</h3>
                    <p>
                        З питань захисту персональних даних звертайтесь: <a href="mailto:privacy@knitly.app">privacy@knitly.app</a><br />
                        Ми відповідаємо протягом 30 робочих днів.
                    </p>
                </div>

            </div>
        </article>
    );
}
