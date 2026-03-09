import React from 'react';
import CodeBlock from '../../CodeBlock';

export default function BotsContentUk() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Зміст">
                <p className="dp-toc-title">На цій сторінці</p>
                <ol className="dp-toc-list">
                    <li><a href="#bot-object">Об'єкт бота</a></li>
                    <li><a href="#list-bots">Список ваших ботів</a></li>
                    <li><a href="#create-bot">Створення бота</a></li>
                    <li><a href="#get-me">Отримання поточного бота</a></li>
                    <li><a href="#update-me">Оновлення поточного бота</a></li>
                    <li><a href="#rotate-token">Ротація токена</a></li>
                </ol>
            </nav>

            {/* Об'єкт бота */}
            <section id="bot-object" className="dp-section">
                <h2 className="dp-section-title">Об'єкт бота</h2>
                <p className="dp-paragraph">
                    Кожна API-відповідь, що повертає бота, містить наступні поля.
                    Поле <code className="dp-inline-code">token</code> повертається лише один раз —
                    під час створення або ротації.
                </p>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Поле</th><th>Тип</th><th>Опис</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">id</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>ID Firestore-документа бота.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">name</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Відображуване ім'я. 2–64 символи.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">description</code></td>
                            <td><span className="dp-param-type">string | null</span></td>
                            <td>Короткий опис на публічному профілі бота. Максимум 200 символів.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">avatarUrl</code></td>
                            <td><span className="dp-param-type">string | null</span></td>
                            <td>URL зображення аватара бота.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">ownerId</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Firebase Auth UID користувача, який зареєстрував бота.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">status</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><code className="dp-inline-code">active</code> | <code className="dp-inline-code">suspended</code></td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">webhooks</code></td>
                            <td><span className="dp-param-type">array</span></td>
                            <td>Список зареєстрованих вебхук-об'єктів. Дивіться <a href="/developers/webhooks">Вебхуки</a>.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">createdAt</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Мітка часу створення в форматі ISO 8601.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">token</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Сирий API-токен. Повертається лише один раз під час створення або ротації.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Список ботів */}
            <section id="list-bots" className="dp-section">
                <h2 className="dp-section-title">Список ваших ботів</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--get">GET</span>
                    <code className="dp-endpoint-path">/api/v1/bots</code>
                    <span className="dp-endpoint-desc">Повертає всіх ботів, що належать автентифікованому Firebase-користувачу.</span>
                </div>

                <p className="dp-paragraph">
                    Цей ендпоінт вимагає вашого Firebase ID-токена (не токена бота) в заголовку{' '}
                    <code className="dp-inline-code">X-Firebase-Token</code>.
                    Повертає всіх ботів, які вам належать, до 10 включно.
                </p>

                <CodeBlock lang="bash">{`curl https://knitly-demo.vercel.app/api/v1/bots \\
  -H "X-Firebase-Token: ВАШ_FIREBASE_ID_TOKEN"`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": [
    {
      "id": "abc123def456",
      "name": "MyCuratorBot",
      "description": "Надсилає подарунки топ-слухачам",
      "status": "active",
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ]
}`}</CodeBlock>
            </section>

            {/* Створення бота */}
            <section id="create-bot" className="dp-section">
                <h2 className="dp-section-title">Створення бота</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--post">POST</span>
                    <code className="dp-endpoint-path">/api/v1/bots</code>
                    <span className="dp-endpoint-desc">Реєструє нового бота під вашим акаунтом Knitly.</span>
                </div>

                <p className="dp-paragraph">
                    Вимагає вашого Firebase ID-токена в <code className="dp-inline-code">X-Firebase-Token</code>.
                    Один користувач може мати до <strong>10 ботів</strong>.
                </p>

                <p className="dp-paragraph"><strong>Тіло запиту</strong></p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Поле</th><th>Тип</th><th>Обов'язкове</th><th>Опис</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">name</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--yes">обов'язкове</span></td>
                            <td>Відображуване ім'я бота. 2–64 символи.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">description</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--no">опціональне</span></td>
                            <td>Короткий опис. Максимум 200 символів.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">avatarUrl</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--no">опціональне</span></td>
                            <td>URL зображення аватара. Має бути HTTPS.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/bots \\
  -H "Content-Type: application/json" \\
  -H "X-Firebase-Token: ВАШ_FIREBASE_ID_TOKEN" \\
  -d '{
    "name": "MyCuratorBot",
    "description": "Надсилає подарунки топ-слухачам"
  }'`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "id": "abc123def456",
    "name": "MyCuratorBot",
    "description": "Надсилає подарунки топ-слухачам",
    "ownerId": "FIREBASE_UID_КОРИСТУВАЧА",
    "status": "active",
    "webhooks": [],
    "createdAt": "2026-01-15T10:30:00.000Z",
    "token": "knt_abc123def456_a1b2c3d4e5f6789012345678901234567890ab",
    "warning": "Збережіть цей токен надійно. Його більше не можна буде отримати."
  }
}`}</CodeBlock>

                <div className="dp-note dp-note--warning">
                    <span className="dp-note-icon">⚠</span>
                    <span>
                        Скопіюйте значення <code className="dp-inline-code">token</code> негайно.
                        Воно більше ніколи не буде показано. Якщо втратите — використайте{' '}
                        <a href="#rotate-token">ротацію токена</a> для генерації нового.
                    </span>
                </div>
            </section>

            {/* Отримання поточного бота */}
            <section id="get-me" className="dp-section">
                <h2 className="dp-section-title">Отримання поточного бота</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--get">GET</span>
                    <code className="dp-endpoint-path">/api/v1/bots/me</code>
                    <span className="dp-endpoint-desc">Повертає бота, пов'язаного з наданим Bearer-токеном.</span>
                </div>

                <CodeBlock lang="bash">{`curl https://knitly-demo.vercel.app/api/v1/bots/me \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "id": "abc123def456",
    "name": "MyCuratorBot",
    "description": "Надсилає подарунки топ-слухачам",
    "avatarUrl": null,
    "ownerId": "FIREBASE_UID_КОРИСТУВАЧА",
    "status": "active",
    "webhooks": [],
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}`}</CodeBlock>
            </section>

            {/* Оновлення бота */}
            <section id="update-me" className="dp-section">
                <h2 className="dp-section-title">Оновлення поточного бота</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--put">PUT</span>
                    <code className="dp-endpoint-path">/api/v1/bots/me</code>
                    <span className="dp-endpoint-desc">Оновлює ім'я, опис або аватар автентифікованого бота.</span>
                </div>

                <p className="dp-paragraph"><strong>Тіло запиту</strong> (всі поля опціональні — вказуйте лише ті, що хочете змінити)</p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Поле</th><th>Тип</th><th>Опис</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">name</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Нове відображуване ім'я. 2–64 символи.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">description</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Новий опис. Максимум 200 символів.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">avatarUrl</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Нова URL-адреса аватара. Має бути HTTPS.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="bash">{`curl -X PUT https://knitly-demo.vercel.app/api/v1/bots/me \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{"description": "Оновлено: нагороджує ранніх слухачів NFT-подарунками"}'`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "id": "abc123def456",
    "name": "MyCuratorBot",
    "description": "Оновлено: нагороджує ранніх слухачів NFT-подарунками",
    "status": "active"
  }
}`}</CodeBlock>
            </section>

            {/* Ротація токена */}
            <section id="rotate-token" className="dp-section">
                <h2 className="dp-section-title">Ротація токена</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--post">POST</span>
                    <code className="dp-endpoint-path">/api/v1/bots/token</code>
                    <span className="dp-endpoint-desc">Генерує новий токен. Старий токен негайно анулюється.</span>
                </div>

                <div className="dp-note dp-note--danger">
                    <span className="dp-note-icon">✕</span>
                    <span>
                        Ротація токена є <strong>незворотньою</strong>. Будь-який сервіс, що використовує старий токен,
                        негайно почне отримувати <code className="dp-inline-code">401 INVALID_TOKEN</code>.
                        Оновіть всі ваші інтеграції до або одразу після ротації.
                    </span>
                </div>

                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/bots/token \\
  -H "Authorization: Bearer knt_СТАРИЙ_ТОКЕН"`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "token": "knt_abc123def456_НОВИЙ_СЕКРЕТ_40_HEX_СИМВОЛІВ",
    "warning": "Ваш попередній токен анульовано."
  }
}`}</CodeBlock>
            </section>

        </div>
    );
}
