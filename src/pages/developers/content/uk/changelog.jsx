import React from 'react';

export default function ChangelogContentUk() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Зміст">
                <p className="dp-toc-title">На цій сторінці</p>
                <ol className="dp-toc-list">
                    <li><a href="#v1-0-0">v1.0.0 — Перший реліз</a></li>
                    <li><a href="#upcoming">Заплановано у v1.1</a></li>
                </ol>
            </nav>

            {/* v1.0.0 */}
            <section id="v1-0-0" className="dp-section">
                <h2 className="dp-section-title">v1.0.0 — Перший реліз</h2>
                <p className="dp-meta">Випущено 09.03.2026 · <span className="dp-badge" style={{display:'inline', padding:'0.1rem 0.5rem', fontSize:'0.7rem'}}>stable</span></p>

                <p className="dp-paragraph">
                    Перший публічний реліз Knitly Bot API. Ця версія встановлює основну модель
                    автентифікації, керування ботами, надсилання подарунків та систему вебхуків.
                </p>

                <p className="dp-paragraph"><strong>Нові ендпоінти</strong></p>
                <ul className="dp-list">
                    <li>
                        <code className="dp-inline-code">GET /api/v1</code> — перевірка працездатності та інформація про версію
                    </li>
                    <li>
                        <code className="dp-inline-code">GET /api/v1/bots</code>{' '}
                        <code className="dp-inline-code">POST /api/v1/bots</code> — список та створення ботів
                    </li>
                    <li>
                        <code className="dp-inline-code">GET /api/v1/bots/me</code>{' '}
                        <code className="dp-inline-code">PUT /api/v1/bots/me</code> — отримання та оновлення поточного бота
                    </li>
                    <li>
                        <code className="dp-inline-code">POST /api/v1/bots/token</code> — ротація API-токена
                    </li>
                    <li>
                        <code className="dp-inline-code">POST /api/v1/gifts/send</code> — надсилання подарунку користувачу
                    </li>
                    <li>
                        <code className="dp-inline-code">GET /api/v1/gifts/collection/:uid</code> — читання колекції подарунків користувача
                    </li>
                    <li>
                        <code className="dp-inline-code">GET /api/v1/tracks</code>{' '}
                        <code className="dp-inline-code">GET /api/v1/tracks/:id</code> — публічний каталог треків
                    </li>
                    <li>
                        <code className="dp-inline-code">GET /api/v1/webhooks</code>{' '}
                        <code className="dp-inline-code">POST /api/v1/webhooks</code> — список та реєстрація вебхуків
                    </li>
                    <li>
                        <code className="dp-inline-code">DELETE /api/v1/webhooks/:index</code> — видалення вебхука за індексом
                    </li>
                </ul>

                <p className="dp-paragraph"><strong>Автентифікація</strong></p>
                <ul className="dp-list">
                    <li>
                        Формат токена бота: <code className="dp-inline-code">knt_{'{botId}'}_{'{40-символьний hex}'}</code>.
                        На сервері зберігається лише SHA-256 хеш.
                    </li>
                    <li>
                        Реєстрація бота використовує Firebase ID-токени в заголовку{' '}
                        <code className="dp-inline-code">X-Firebase-Token</code> — окрема реєстрація не потрібна.
                    </li>
                    <li>
                        Ротація токена негайно анулює попередній токен.
                    </li>
                </ul>

                <p className="dp-paragraph"><strong>Події вебхуків</strong></p>
                <ul className="dp-list">
                    <li><code className="dp-inline-code">gift.received</code> — подарунок успішно доставлено</li>
                    <li><code className="dp-inline-code">track.play</code> — користувач почав відтворення треку</li>
                    <li><code className="dp-inline-code">follower.new</code> — новий підписник акаунту власника бота</li>
                </ul>

                <p className="dp-paragraph"><strong>Ліміти запитів</strong></p>
                <ul className="dp-list">
                    <li>За замовчуванням: 60 запитів / 60 секунд на токен бота.</li>
                    <li><code className="dp-inline-code">POST /api/v1/gifts/send</code>: знижено до 30 запитів / 60 секунд.</li>
                </ul>

                <p className="dp-paragraph"><strong>Відомі обмеження в v1.0.0</strong></p>
                <ul className="dp-list">
                    <li>Обмежувач запитів in-memory та скидається при холодних стартах serverless. Не підходить для високого навантаження до v1.1 (Upstash Redis).</li>
                    <li>Доставка вебхуків є найкращим зусиллям без повторних спроб. Логіка повторів запланована на v1.1.</li>
                    <li>Підписи вебхуків (HMAC-SHA256) ще не реалізовані — не покладайтеся на автентичність вебхуків для критичних операцій.</li>
                    <li>Максимум 10 ботів на користувача. Максимум 5 вебхуків на бота.</li>
                </ul>
            </section>

            {/* Заплановано */}
            <section id="upcoming" className="dp-section">
                <h2 className="dp-section-title">Заплановано у v1.1</h2>

                <div className="dp-note dp-note--info">
                    <span className="dp-note-icon">ℹ</span>
                    <span>
                        Ці функції у стадії планування і можуть змінитися.
                        Слідкуйте за changelog, щоб отримати сповіщення про вихід v1.1.
                    </span>
                </div>

                <ul className="dp-list">
                    <li>
                        <strong>Розподілений обмежувач запитів</strong> — заміна in-memory лічильника на Upstash Redis,
                        що забезпечить точні ліміти в усіх serverless-інстансах.
                    </li>
                    <li>
                        <strong>Підписи вебхуків</strong> — кожен POST міститиме заголовок{' '}
                        <code className="dp-inline-code">X-Knitly-Signature</code> з підписом HMAC-SHA256
                        тіла, підписаного секретом, який ви налаштовуєте.
                    </li>
                    <li>
                        <strong>Повторні спроби вебхуків з експоненційним відступом</strong> — невдалі доставки
                        (не-2xx або таймаут) повторюватимуться до 3 разів протягом 24 годин.
                    </li>
                    <li>
                        <strong>Додаткові події вебхуків</strong> — <code className="dp-inline-code">comment.new</code>,{' '}
                        <code className="dp-inline-code">track.like</code>, <code className="dp-inline-code">playlist.add</code>.
                    </li>
                    <li>
                        <strong>Ендпоінти провенансу NFT</strong> — запит ланцюга провенансу NFT-подарунку
                        та перевірка унікальності серійного номера.
                    </li>
                    <li>
                        <strong>Покращення курсорів пагінації</strong> — стабільні непрозорі курсори замість
                        ID документів для ендпоінтів колекцій.
                    </li>
                </ul>
            </section>

        </div>
    );
}
