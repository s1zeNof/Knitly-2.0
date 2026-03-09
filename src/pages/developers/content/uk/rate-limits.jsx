import React from 'react';
import { Link } from 'react-router-dom';
import CodeBlock from '../../CodeBlock';

export default function RateLimitsContentUk() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Зміст">
                <p className="dp-toc-title">На цій сторінці</p>
                <ol className="dp-toc-list">
                    <li><a href="#default-limits">Стандартні ліміти</a></li>
                    <li><a href="#endpoint-limits">Ліміти конкретних ендпоінтів</a></li>
                    <li><a href="#rate-limit-headers">Заголовки лімітів</a></li>
                    <li><a href="#best-practices">Кращі практики</a></li>
                </ol>
            </nav>

            {/* Стандартні ліміти */}
            <section id="default-limits" className="dp-section">
                <h2 className="dp-section-title">Стандартні ліміти</h2>
                <p className="dp-paragraph">
                    Ліміти запитів застосовуються на токен бота з використанням лічильника ковзного вікна.
                    Якщо не зазначено інше, кожен ендпоінт дозволяє до{' '}
                    <strong>60 запитів за 60 секунд</strong>.
                </p>
                <p className="dp-paragraph">
                    При перевищенні ліміту API повертає{' '}
                    <code className="dp-inline-code">429 Too Many Requests</code> з кодом помилки{' '}
                    <code className="dp-inline-code">RATE_LIMITED</code>.
                </p>

                <div className="dp-note dp-note--warning">
                    <span className="dp-note-icon">⚠</span>
                    <span>
                        Поточний обмежувач запитів використовує in-memory ковзне вікно.
                        Ліміти скидаються при кожному холодному старті та не поділяються між паралельними
                        serverless-інстансами. Розподілений обмежувач (Upstash Redis) замінить це у v1.1.
                    </span>
                </div>
            </section>

            {/* Ліміти ендпоінтів */}
            <section id="endpoint-limits" className="dp-section">
                <h2 className="dp-section-title">Ліміти конкретних ендпоінтів</h2>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Ендпоінт</th><th>Метод</th><th>Ліміт</th><th>Вікно</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/bots</code></td>
                            <td>GET, POST</td>
                            <td>60 запитів</td>
                            <td>60 с</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/bots/me</code></td>
                            <td>GET, PUT</td>
                            <td>60 запитів</td>
                            <td>60 с</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/bots/token</code></td>
                            <td>POST</td>
                            <td>60 запитів</td>
                            <td>60 с</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/gifts/send</code></td>
                            <td>POST</td>
                            <td><strong>30 запитів</strong></td>
                            <td>60 с</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/gifts/collection/:uid</code></td>
                            <td>GET</td>
                            <td>60 запитів</td>
                            <td>60 с</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/tracks</code></td>
                            <td>GET</td>
                            <td>60 запитів</td>
                            <td>60 с</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/tracks/:id</code></td>
                            <td>GET</td>
                            <td>60 запитів</td>
                            <td>60 с</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/webhooks</code></td>
                            <td>GET, POST</td>
                            <td>60 запитів</td>
                            <td>60 с</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/webhooks/:index</code></td>
                            <td>DELETE</td>
                            <td>60 запитів</td>
                            <td>60 с</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Заголовки лімітів */}
            <section id="rate-limit-headers" className="dp-section">
                <h2 className="dp-section-title">Заголовки лімітів</h2>
                <p className="dp-paragraph">
                    Кожна відповідь містить заголовки, що показують поточний стан вашого ліміту.
                    Використовуйте їх для проактивного відступу перш ніж досягти ліміту.
                </p>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Заголовок</th><th>Опис</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">X-RateLimit-Limit</code></td>
                            <td>Максимальна кількість запитів дозволена у поточному вікні.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">X-RateLimit-Remaining</code></td>
                            <td>Кількість запитів, що залишилися у поточному вікні.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">X-RateLimit-Reset</code></td>
                            <td>Unix-мітка часу (секунди), коли поточне вікно скидається.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">Retry-After</code></td>
                            <td>Секунди очікування перед повторною спробою. Присутній лише у відповідях <code className="dp-inline-code">429</code>.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="http">{`HTTP/2 429 Too Many Requests
X-RateLimit-Limit:     30
X-RateLimit-Remaining: 0
X-RateLimit-Reset:     1737028860
Retry-After:           12

{
  "ok": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Забагато запитів. Будь ласка, зменшіть частоту."
  }
}`}</CodeBlock>
            </section>

            {/* Кращі практики */}
            <section id="best-practices" className="dp-section">
                <h2 className="dp-section-title">Кращі практики</h2>

                <ul className="dp-list">
                    <li>
                        <strong>Використовуйте вебхуки замість опитування.</strong> Якщо ви перевіряєте нові події,
                        викликаючи API у циклі, перейдіть на{' '}
                        <Link to="/developers/webhooks">вебхуки</Link>.
                        Вебхуки повністю усувають трафік опитування та реагують на події в реальному часі.
                    </li>
                    <li>
                        <strong>Реалізуйте експоненційний відступ.</strong> При отриманні{' '}
                        <code className="dp-inline-code">429</code> зачекайте кількість секунд,
                        вказану у <code className="dp-inline-code">Retry-After</code>, потім повторіть.
                        Подвоюйте час очікування при кожній наступній помилці.
                    </li>
                    <li>
                        <strong>Читайте заголовки лімітів.</strong> Перевіряйте{' '}
                        <code className="dp-inline-code">X-RateLimit-Remaining</code> перед кожною
                        масовою операцією. Уповільнюйтесь проактивно, не чекаючи 429.
                    </li>
                    <li>
                        <strong>Розподіляйте масові надсилання подарунків.</strong> Якщо вашому боту потрібно надіслати
                        той самий подарунок багатьом користувачам, рівномірно розподіляйте запити по хвилині
                        замість одночасного запуску всіх.
                    </li>
                    <li>
                        <strong>Кешуйте дані треків і подарунків.</strong> Ендпоінти <code className="dp-inline-code">/tracks</code> та
                        каталогу подарунків повертають дані, що рідко змінюються. Кешуйте відповіді
                        принаймні на 60 секунд, щоб не витрачати ліміт на пошук.
                    </li>
                </ul>

                <p className="dp-paragraph"><strong>Приклад відступу (JavaScript)</strong></p>
                <CodeBlock lang="javascript">{`async function sendWithBackoff(payload, maxRetries = 3) {
  let delay = 1000; // 1 секунда
  for (let i = 0; i <= maxRetries; i++) {
    const res = await fetch('https://knitly-demo.vercel.app/api/v1/gifts/send', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer knt_abc123def456_a1b2c3...',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (res.status !== 429) return res.json();
    const retryAfter = Number(res.headers.get('Retry-After') ?? 1) * 1000;
    await new Promise(r => setTimeout(r, Math.max(delay, retryAfter)));
    delay *= 2; // експоненційний відступ
  }
  throw new Error('Перевищено максимальну кількість спроб');
}`}</CodeBlock>
            </section>

        </div>
    );
}
