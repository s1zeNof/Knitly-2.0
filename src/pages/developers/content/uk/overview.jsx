import React from 'react';
import { Link } from 'react-router-dom';
import CodeBlock from '../../CodeBlock';

export default function OverviewContentUk() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Зміст">
                <p className="dp-toc-title">На цій сторінці</p>
                <ol className="dp-toc-list">
                    <li><a href="#what-you-can-build">Що можна побудувати</a></li>
                    <li><a href="#key-concepts">Ключові концепції</a></li>
                    <li><a href="#quick-start">Швидкий старт</a></li>
                    <li><a href="#base-url">Базова URL-адреса</a></li>
                    <li><a href="#response-format">Формат відповіді</a></li>
                    <li><a href="#errors">Коди помилок</a></li>
                </ol>
            </nav>

            {/* Що можна побудувати */}
            <section id="what-you-can-build" className="dp-section">
                <h2 className="dp-section-title">Що можна побудувати</h2>
                <p className="dp-paragraph">
                    Knitly Bot API надає вашому застосунку повноцінного учасника платформи.
                    Боти можуть діяти від імені сервісів, кураторів та автоматизованих воркфлоу —
                    не імітуючи жодного реального користувача.
                </p>
                <ul className="dp-list">
                    <li><strong>Боти-куратори музики</strong> — автоматично надсилати подарунок користувачу, коли він вперше прослухає трек.</li>
                    <li><strong>Інструменти залучення фанів</strong> — нагороджувати топ-слухачів лімітованими NFT-подарунками в день релізу альбому.</li>
                    <li><strong>Аналітичні інтеграції</strong> — отримувати події прослуховувань та підписок через вебхуки для власних дашбордів.</li>
                    <li><strong>Боти спільноти</strong> — вітати нових підписників персональним подарунком.</li>
                    <li><strong>Автоматизація дропів</strong> — запускати розсилку подарунків за розкладом у момент виходу альбому.</li>
                </ul>
            </section>

            {/* Ключові концепції */}
            <section id="key-concepts" className="dp-section">
                <h2 className="dp-section-title">Ключові концепції</h2>

                <p className="dp-paragraph"><strong>Бот</strong></p>
                <p className="dp-paragraph">
                    Бот — це нелюдський акаунт, прив'язаний до користувача Knitly (власника).
                    Він автентифікується через секретний Bearer-токен і може виконувати лише ті дії,
                    які дозволяє API — не може входити в систему, публікувати контент або звертатися до приватних даних.
                </p>

                <p className="dp-paragraph"><strong>Токен</strong></p>
                <p className="dp-paragraph">
                    Кожен бот має рівно один активний токен у будь-який момент. Токени починаються з{' '}
                    <code className="dp-inline-code">knt_</code> і містять ID бота всередині,
                    що дозволяє швидкий пошук без сканування бази даних. На сервері зберігається лише хеш SHA-256 —
                    сирий токен показується один раз і має бути надійно збережений вами.
                </p>

                <p className="dp-paragraph"><strong>Вебхук</strong></p>
                <p className="dp-paragraph">
                    Замість опитування API для отримання нових подій зареєструйте HTTPS-ендпоінт на вашому сервері.
                    Knitly надсилатиме POST із JSON-пейлоадом кожного разу, коли спрацьовує підписана подія.
                    Дивіться <Link to="/developers/webhooks">Вебхуки</Link> для повного каталогу подій.
                </p>

                <p className="dp-paragraph"><strong>Подарунки</strong></p>
                <p className="dp-paragraph">
                    Подарунки — це анімовані цифрові предмети, які боти можуть надсилати користувачам,
                    опціонально прив'язуючи до конкретного треку. Лімітовані та NFT-подарунки мають фіксований запас —
                    після розпродажу надіслати їх неможливо. Дивіться <Link to="/developers/gifts">Подарунки</Link> для повного опису.
                </p>
            </section>

            {/* Швидкий старт */}
            <section id="quick-start" className="dp-section">
                <h2 className="dp-section-title">Швидкий старт</h2>
                <p className="dp-paragraph">
                    Від нуля до першого API-виклику за три кроки.
                </p>

                <div className="dp-steps">
                    <div className="dp-step">
                        <span className="dp-step-num" aria-hidden="true"></span>
                        <div className="dp-step-body">
                            <h4>Зареєструйте бота</h4>
                            <p>Використайте Firebase ID-токен для реєстрації нового бота. Сирий API-токен повертається один раз.</p>
                        </div>
                    </div>
                </div>

                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/bots \\
  -H "Content-Type: application/json" \\
  -H "X-Firebase-Token: ВАШ_FIREBASE_ID_TOKEN" \\
  -d '{"name": "MyCuratorBot", "description": "Надсилає подарунки топ-слухачам"}'`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "id": "abc123def456",
    "name": "MyCuratorBot",
    "token": "knt_abc123def456_a1b2c3d4e5f6...",
    "warning": "Збережіть цей токен надійно. Його більше не можна буде отримати."
  }
}`}</CodeBlock>

                <div className="dp-steps">
                    <div className="dp-step">
                        <span className="dp-step-num" aria-hidden="true"></span>
                        <div className="dp-step-body">
                            <h4>Перевірте бота</h4>
                            <p>Використайте токен для підтвердження, що автентифікація працює.</p>
                        </div>
                    </div>
                </div>

                <CodeBlock lang="bash">{`curl https://knitly-demo.vercel.app/api/v1/bots/me \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <div className="dp-steps">
                    <div className="dp-step">
                        <span className="dp-step-num" aria-hidden="true"></span>
                        <div className="dp-step-body">
                            <h4>Надішліть перший подарунок</h4>
                            <p>Надішліть анімований подарунок користувачу, опціонально прив'язавши до треку.</p>
                        </div>
                    </div>
                </div>

                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/gifts/send \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipientId": "UID_КОРИСТУВАЧА",
    "giftId": "ID_ПОДАРУНКУ_З_FIRESTORE",
    "trackId": "ID_ТРЕКУ",
    "message": "Чудовий трек!"
  }'`}</CodeBlock>
            </section>

            {/* Базова URL-адреса */}
            <section id="base-url" className="dp-section">
                <h2 className="dp-section-title">Базова URL-адреса</h2>
                <p className="dp-paragraph">
                    Всі ендпоінти API відносні до наступної базової URL-адреси:
                </p>
                <CodeBlock lang="text">{`https://knitly-demo.vercel.app/api/v1`}</CodeBlock>
                <div className="dp-note dp-note--info">
                    <span className="dp-note-icon">ℹ</span>
                    <span>Після запуску knitly.app базова URL-адреса стане{' '}
                    <code className="dp-inline-code">https://knitly.app/api/v1</code>.
                    Ми надамо перехідний період, протягом якого обидві адреси будуть активні.</span>
                </div>
            </section>

            {/* Формат відповіді */}
            <section id="response-format" className="dp-section">
                <h2 className="dp-section-title">Формат відповіді</h2>
                <p className="dp-paragraph">
                    Кожна відповідь — успішна або з помилкою — є JSON-об'єктом із булевим{' '}
                    <code className="dp-inline-code">ok</code> на верхньому рівні.
                </p>
                <p className="dp-paragraph"><strong>Успіх</strong></p>
                <CodeBlock lang="json">{`{
  "ok": true,
  "result": { ...дані ресурсу }
}`}</CodeBlock>
                <p className="dp-paragraph"><strong>Помилка</strong></p>
                <CodeBlock lang="json">{`{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Відсутні обов'язкові поля.",
    "details": { "missing": ["recipientId"] }
  }
}`}</CodeBlock>
                <p className="dp-paragraph">
                    <code className="dp-inline-code">error.code</code> — машиночитаний рядок,
                    за яким можна робити switch у обробнику помилок.{' '}
                    <code className="dp-inline-code">error.message</code> — зрозумілий для людини текст,
                    безпечний для відображення кінцевим користувачам.
                </p>
            </section>

            {/* Коди помилок */}
            <section id="errors" className="dp-section">
                <h2 className="dp-section-title">Коди помилок</h2>

                <table className="dp-param-table">
                    <thead>
                        <tr>
                            <th>Код</th>
                            <th>HTTP-статус</th>
                            <th>Опис</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">UNAUTHORIZED</code></td>
                            <td>401</td>
                            <td>Відсутній або неправильно сформований заголовок Authorization.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">INVALID_TOKEN</code></td>
                            <td>401</td>
                            <td>Токен не існує або був відкликаний.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">FORBIDDEN</code></td>
                            <td>403</td>
                            <td>Бот існує, але призупинений.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">NOT_FOUND</code></td>
                            <td>404</td>
                            <td>Запитаний ресурс не існує.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">VALIDATION_ERROR</code></td>
                            <td>400</td>
                            <td>Обов'язкове поле відсутнє або невалідне. Перевірте <code className="dp-inline-code">details.missing</code>.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">CONFLICT</code></td>
                            <td>409</td>
                            <td>Порушено обмеження унікальності або запасу (наприклад, подарунок розпродано).</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">RATE_LIMITED</code></td>
                            <td>429</td>
                            <td>Забагато запитів. Дивіться <Link to="/developers/rate-limits">Ліміти запитів</Link>.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">INTERNAL_SERVER_ERROR</code></td>
                            <td>500</td>
                            <td>Неочікувана серверна помилка. Повторіть запит з експоненційним відступом.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

        </div>
    );
}
