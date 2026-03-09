import React from 'react';
import CodeBlock from '../../CodeBlock';

export default function WebhooksContentUk() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Зміст">
                <p className="dp-toc-title">На цій сторінці</p>
                <ol className="dp-toc-list">
                    <li><a href="#how-it-works">Як це працює</a></li>
                    <li><a href="#webhook-object">Об'єкт вебхука</a></li>
                    <li><a href="#register">Реєстрація вебхука</a></li>
                    <li><a href="#list-webhooks">Список вебхуків</a></li>
                    <li><a href="#delete-webhook">Видалення вебхука</a></li>
                    <li><a href="#event-reference">Довідник подій</a></li>
                </ol>
            </nav>

            {/* Як це працює */}
            <section id="how-it-works" className="dp-section">
                <h2 className="dp-section-title">Як це працює</h2>
                <p className="dp-paragraph">
                    Замість повторного опитування API зареєструйте HTTPS-ендпоінт на вашому сервері.
                    Коли на Knitly спрацьовує підписана подія, сервер робить запит{' '}
                    <code className="dp-inline-code">POST</code> до вашого URL із JSON-пейлоадом,
                    що описує подію.
                </p>
                <p className="dp-paragraph">
                    Вебхуки зберігаються в документі бота та стають активними одразу після реєстрації.
                    Кожен бот може мати до <strong>5 вебхуків</strong>.
                </p>

                <div className="dp-note dp-note--info">
                    <span className="dp-note-icon">ℹ</span>
                    <span>
                        Ваш ендпоінт має відповісти статусом <code className="dp-inline-code">2xx</code>
                        протягом <strong>10 секунд</strong>. Knitly намагається доставити подію один раз.
                        Повторні спроби з експоненційним відступом заплановані на v1.1.
                    </span>
                </div>

                <p className="dp-paragraph"><strong>Оболонка пейлоаду</strong></p>
                <p className="dp-paragraph">Кожен POST-запит вебхука має наступну структуру:</p>
                <CodeBlock lang="json">{`{
  "event":   "gift.received",
  "botId":   "abc123def456",
  "ts":      "2026-01-15T12:00:00.000Z",
  "data":    { ...дані конкретної події }
}`}</CodeBlock>
            </section>

            {/* Об'єкт вебхука */}
            <section id="webhook-object" className="dp-section">
                <h2 className="dp-section-title">Об'єкт вебхука</h2>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Поле</th><th>Тип</th><th>Опис</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">url</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>URL вашого HTTPS-ендпоінта.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">events</code></td>
                            <td><span className="dp-param-type">string[]</span></td>
                            <td>Список назв підписаних подій.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">createdAt</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Мітка часу реєстрації в ISO 8601.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Реєстрація */}
            <section id="register" className="dp-section">
                <h2 className="dp-section-title">Реєстрація вебхука</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--post">POST</span>
                    <code className="dp-endpoint-path">/api/v1/webhooks</code>
                    <span className="dp-endpoint-desc">Додає новий вебхук до автентифікованого бота.</span>
                </div>

                <p className="dp-paragraph"><strong>Тіло запиту</strong></p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Поле</th><th>Тип</th><th>Обов'язкове</th><th>Опис</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">url</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--yes">обов'язкове</span></td>
                            <td>Ваш ендпоінт. Має починатися з <code className="dp-inline-code">https://</code>.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">events</code></td>
                            <td><span className="dp-param-type">string[]</span></td>
                            <td><span className="dp-param-required--yes">обов'язкове</span></td>
                            <td>Одна або кілька назв подій для підписки. Дивіться <a href="#event-reference">Довідник подій</a>.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/webhooks \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://myserver.example.com/knitly/events",
    "events": ["gift.received", "follower.new"]
  }'`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "index": 0,
    "url": "https://myserver.example.com/knitly/events",
    "events": ["gift.received", "follower.new"],
    "createdAt": "2026-01-15T12:00:00.000Z"
  }
}`}</CodeBlock>

                <div className="dp-note dp-note--warning">
                    <span className="dp-note-icon">⚠</span>
                    <span>
                        HTTP URL без шифрування відхиляються. Ваш ендпоінт має використовувати HTTPS для захисту даних подій.
                    </span>
                </div>
            </section>

            {/* Список вебхуків */}
            <section id="list-webhooks" className="dp-section">
                <h2 className="dp-section-title">Список вебхуків</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--get">GET</span>
                    <code className="dp-endpoint-path">/api/v1/webhooks</code>
                    <span className="dp-endpoint-desc">Повертає всі вебхуки зареєстровані для автентифікованого бота.</span>
                </div>

                <CodeBlock lang="bash">{`curl https://knitly-demo.vercel.app/api/v1/webhooks \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": [
    {
      "index": 0,
      "url": "https://myserver.example.com/knitly/events",
      "events": ["gift.received", "follower.new"],
      "createdAt": "2026-01-15T12:00:00.000Z"
    }
  ]
}`}</CodeBlock>
            </section>

            {/* Видалення вебхука */}
            <section id="delete-webhook" className="dp-section">
                <h2 className="dp-section-title">Видалення вебхука</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--delete">DELETE</span>
                    <code className="dp-endpoint-path">/api/v1/webhooks/:index</code>
                    <span className="dp-endpoint-desc">Видаляє вебхук за вказаним нульовим індексом.</span>
                </div>

                <p className="dp-paragraph">
                    Використовуйте поле <code className="dp-inline-code">index</code> з відповіді списку.
                    Індекси є нульовими та стабільними до видалення вебхука, після якого решта вебхуків
                    зберігають свої позиції.
                </p>

                <CodeBlock lang="bash">{`curl -X DELETE https://knitly-demo.vercel.app/api/v1/webhooks/0 \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": { "deleted": true }
}`}</CodeBlock>
            </section>

            {/* Довідник подій */}
            <section id="event-reference" className="dp-section">
                <h2 className="dp-section-title">Довідник подій</h2>

                <p className="dp-paragraph"><strong>gift.received</strong></p>
                <p className="dp-paragraph">
                    Спрацьовує, коли ваш бот надсилає подарунок і він успішно доставлений одержувачу.
                </p>
                <CodeBlock lang="json">{`{
  "event": "gift.received",
  "botId": "abc123def456",
  "ts":    "2026-01-15T12:00:00.000Z",
  "data": {
    "giftId":      "ID_ПОДАРУНКУ_З_FIRESTORE",
    "recipientId": "FIREBASE_UID_КОРИСТУВАЧА",
    "trackId":     "ID_ТРЕКУ_З_FIRESTORE",
    "message":     "Чудовий трек!"
  }
}`}</CodeBlock>

                <p className="dp-paragraph"><strong>track.play</strong></p>
                <p className="dp-paragraph">
                    Спрацьовує, коли користувач починає відтворення треку. Корисно для запуску логіки кураторства.
                </p>
                <CodeBlock lang="json">{`{
  "event": "track.play",
  "botId": "abc123def456",
  "ts":    "2026-01-15T12:05:00.000Z",
  "data": {
    "trackId":   "ID_ТРЕКУ_З_FIRESTORE",
    "userId":    "FIREBASE_UID_КОРИСТУВАЧА",
    "playCount": 1
  }
}`}</CodeBlock>

                <p className="dp-paragraph"><strong>follower.new</strong></p>
                <p className="dp-paragraph">
                    Спрацьовує, коли користувач підписується на власника бота. Корисно для надсилання вітального подарунку.
                </p>
                <CodeBlock lang="json">{`{
  "event": "follower.new",
  "botId": "abc123def456",
  "ts":    "2026-01-15T12:10:00.000Z",
  "data": {
    "followerId": "UID_НОВОГО_ПІДПИСНИКА",
    "followedId": "UID_АРТИСТА"
  }
}`}</CodeBlock>

                <div className="dp-note dp-note--info">
                    <span className="dp-note-icon">ℹ</span>
                    <span>
                        Додаткові події (<code className="dp-inline-code">comment.new</code>,{' '}
                        <code className="dp-inline-code">track.like</code>) заплановані на v1.1.
                    </span>
                </div>
            </section>

        </div>
    );
}
