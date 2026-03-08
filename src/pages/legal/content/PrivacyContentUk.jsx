import React from 'react';

const SECTIONS = [
    'Які дані ми збираємо',
    'Як ми використовуємо ваші дані',
    'Де зберігаються дані',
    'Передача даних третім сторонам',
    'Ваші права (Право на забуття)',
    'Файли cookie',
    'Безпека даних',
    'Зміни до цієї політики',
];

export default function PrivacyContentUk() {
    return (
        <div className="lp-content">
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

            <div className="lp-highlight">
                <strong>Коротко:</strong> Ми збираємо лише необхідні дані для роботи сервісу. Ми не продаємо ваші дані. Ви маєте право запросити повне видалення будь-яких ваших даних ("Право на забуття").
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
                        Дані зашифровані в стані спокою (AES-256) та під час передачі (TLS).
                    </li>
                    <li>
                        <strong>Supabase Storage</strong> — зберігання медіафайлів (аватари, обкладинки, аудіофайли).
                    </li>
                    <li>
                        <strong>Cloudflare</strong> — CDN та захист від атак.
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
                    <li><strong>За вашою згодою</strong> — при використанні функцій авторизації через інші сервіси.</li>
                    <li><strong>Постачальники послуг</strong> — технічні партнери (Firebase, Supabase, Cloudflare) виключно для надання сервісу.</li>
                    <li><strong>Вимоги закону</strong> — на запит уповноважених державних органів (відповідно до чинного законодавства, GDPR, CCPA).</li>
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
                    <h2 className="lp-section-title">Ваші права (вкл. "Право на забуття")</h2>
                </div>
                <p>
                    Відповідно до GDPR, CCPA та Закону України «Про захист персональних даних» ви маєте такі права:
                </p>
                <ul>
                    <li><strong>Право на доступ:</strong> отримати копію ваших персональних даних.</li>
                    <li><strong>Право на виправлення:</strong> виправити неточні дані (через Налаштування профілю).</li>
                    <li><strong>Право на видалення ("Право на забуття"):</strong> запросити повне видалення вашого облікового запису та всіх пов'язаних даних. Це можна зробити в Налаштуваннях або написавши нам.</li>
                    <li><strong>Право на обмеження обробки:</strong> тимчасово заблокувати обробку ваших даних.</li>
                    <li><strong>Право на перенесення:</strong> отримати ваші дані у машиночитаному форматі.</li>
                    <li><strong>Право на заперечення:</strong> відмовитись від певних видів обробки даних.</li>
                </ul>
                <p>
                    Для реалізації будь-якого з цих прав скористайтесь налаштуваннями профілю або надішліть запит на <a href="mailto:privacy@knitly.app">privacy@knitly.app</a>. Ми розглянемо запит протягом <strong>30 календарних днів</strong>.
                </p>
                <p>
                    <strong>Право на скаргу до наглядового органу:</strong> Відповідно до GDPR ви маєте право подати скаргу до відповідного органу захисту персональних даних у вашій країні. В Україні — Уповноважений Верховної Ради України з прав людини. В країнах ЄС — відповідний національний орган (DPA).
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
                    <li><strong>Функціональні cookie:</strong> збереження налаштувань (темна тема, мова).</li>
                    <li><strong>Аналітичні cookie:</strong> анонімна статистика використання.</li>
                </ul>
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
                </ul>
                <p>
                    У разі виявлення витоку даних, що може вплинути на ваші права, ми повідомимо вас та відповідні органи протягом 72 годин.
                </p>
            </section>

            {/* 8 */}
            <section id="s8" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">8</span>
                    <h2 className="lp-section-title">Зміни до цієї політики</h2>
                </div>
                <p>
                    Ми можемо оновлювати цю Політику конфіденційності. При суттєвих змінах ми повідомимо вас через email.
                </p>
            </section>

            {/* Contact */}
            <div className="lp-contact-card">
                <h3>Запити щодо конфіденційності</h3>
                <p>
                    З питань захисту персональних даних звертайтесь: <a href="mailto:privacy@knitly.app">privacy@knitly.app</a><br />
                    Ми відповідаємо протягом 30 календарних днів.
                </p>
            </div>
        </div>
    );
}
