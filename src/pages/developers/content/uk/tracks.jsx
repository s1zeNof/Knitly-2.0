import React from 'react';
import CodeBlock from '../../CodeBlock';

export default function TracksContentUk() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Зміст">
                <p className="dp-toc-title">На цій сторінці</p>
                <ol className="dp-toc-list">
                    <li><a href="#track-object">Об'єкт треку</a></li>
                    <li><a href="#list-tracks">Список треків</a></li>
                    <li><a href="#get-track">Отримання треку</a></li>
                </ol>
            </nav>

            {/* Об'єкт треку */}
            <section id="track-object" className="dp-section">
                <h2 className="dp-section-title">Об'єкт треку</h2>
                <p className="dp-paragraph">
                    API повертає лише публічні поля треку. Чутливі метадані
                    (UID завантажувача, шляхи до сховища, прапорці модерації) ніколи не повертаються.
                </p>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Поле</th><th>Тип</th><th>Опис</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">id</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>ID Firestore-документа треку.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">title</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Назва треку.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">artistName</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Відображуване ім'я артиста.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">artistId</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Firebase Auth UID артиста.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">coverArtUrl</code></td>
                            <td><span className="dp-param-type">string | null</span></td>
                            <td>URL зображення обкладинки.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">duration</code></td>
                            <td><span className="dp-param-type">number</span></td>
                            <td>Тривалість треку в секундах.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">genre</code></td>
                            <td><span className="dp-param-type">string | null</span></td>
                            <td>Тег жанру (напр. <code className="dp-inline-code">hip-hop</code>, <code className="dp-inline-code">electronic</code>).</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">tags</code></td>
                            <td><span className="dp-param-type">string[]</span></td>
                            <td>Масив кастомних тегів, доданих артистом.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">playsCount</code></td>
                            <td><span className="dp-param-type">number</span></td>
                            <td>Загальна кількість прослуховувань.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">likesCount</code></td>
                            <td><span className="dp-param-type">number</span></td>
                            <td>Загальна кількість лайків.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">type</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><code className="dp-inline-code">original</code> | <code className="dp-inline-code">cover</code> | <code className="dp-inline-code">remix</code> | <code className="dp-inline-code">mashup</code> | <code className="dp-inline-code">fan_upload</code></td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">createdAt</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Мітка часу завантаження в ISO 8601.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Список треків */}
            <section id="list-tracks" className="dp-section">
                <h2 className="dp-section-title">Список треків</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--get">GET</span>
                    <code className="dp-endpoint-path">/api/v1/tracks</code>
                    <span className="dp-endpoint-desc">Повертає сторінковий список публічних треків, найновіші спочатку.</span>
                </div>

                <p className="dp-paragraph"><strong>Параметри запиту</strong></p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Параметр</th><th>Тип</th><th>За замовчуванням</th><th>Опис</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">limit</code></td>
                            <td><span className="dp-param-type">number</span></td>
                            <td>20</td>
                            <td>Кількість треків для повернення. Максимум 50.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">startAfter</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>—</td>
                            <td>Курсор для пагінації. Використовуйте <code className="dp-inline-code">nextCursor</code> з попередньої відповіді.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">genre</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>—</td>
                            <td>Фільтр за жанром (напр. <code className="dp-inline-code">hip-hop</code>).</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">artistId</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>—</td>
                            <td>Фільтр за UID артиста.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="bash">{`curl "https://knitly-demo.vercel.app/api/v1/tracks?limit=5&genre=hip-hop" \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "items": [
      {
        "id": "ID_ТРЕКУ",
        "title": "Midnight Flow",
        "artistName": "SomeArtist",
        "artistId": "UID_АРТИСТА",
        "coverArtUrl": "https://...",
        "duration": 214,
        "genre": "hip-hop",
        "tags": ["underground", "boom-bap"],
        "playsCount": 1204,
        "likesCount": 87,
        "type": "original",
        "createdAt": "2026-01-10T09:00:00.000Z"
      }
    ],
    "nextCursor": "ID_ТРЕКУ",
    "hasMore": true
  }
}`}</CodeBlock>
            </section>

            {/* Отримання треку */}
            <section id="get-track" className="dp-section">
                <h2 className="dp-section-title">Отримання треку</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--get">GET</span>
                    <code className="dp-endpoint-path">/api/v1/tracks/:id</code>
                    <span className="dp-endpoint-desc">Повертає один публічний трек за його Firestore ID.</span>
                </div>

                <CodeBlock lang="bash">{`curl https://knitly-demo.vercel.app/api/v1/tracks/ID_ТРЕКУ \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "id": "ID_ТРЕКУ",
    "title": "Midnight Flow",
    "artistName": "SomeArtist",
    "artistId": "UID_АРТИСТА",
    "coverArtUrl": "https://...",
    "duration": 214,
    "genre": "hip-hop",
    "tags": ["underground", "boom-bap"],
    "playsCount": 1204,
    "likesCount": 87,
    "type": "original",
    "createdAt": "2026-01-10T09:00:00.000Z"
  }
}`}</CodeBlock>
            </section>

        </div>
    );
}
