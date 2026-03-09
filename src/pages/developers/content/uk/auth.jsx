import React from 'react';
import CodeBlock from '../../CodeBlock';

export default function AuthContentUk() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Зміст">
                <p className="dp-toc-title">На цій сторінці</p>
                <ol className="dp-toc-list">
                    <li><a href="#token-format">Формат токена</a></li>
                    <li><a href="#sending-requests">Надсилання автентифікованих запитів</a></li>
                    <li><a href="#registering-bot">Реєстрація бота (X-Firebase-Token)</a></li>
                    <li><a href="#rotating-tokens">Ротація токена</a></li>
                    <li><a href="#security-best-practices">Кращі практики безпеки</a></li>
                </ol>
            </nav>

            {/* Формат токена */}
            <section id="token-format" className="dp-section">
                <h2 className="dp-section-title">Формат токена</h2>
                <p className="dp-paragraph">
                    Кожен токен бота має передбачувану структуру, яка кодує ID бота
                    для швидкого пошуку на сервері без повного сканування бази даних:
                </p>
                <CodeBlock lang="text">{`knt_{botId}_{40-символьний-hex-рандом}`}</CodeBlock>
                <p className="dp-paragraph">
                    Приклад: <code className="dp-inline-code">knt_abc123def456_a1b2c3d4e5f6789012345678901234567890ab</code>
                </p>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Сегмент</th><th>Опис</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">knt_</code></td>
                            <td>Статичний префікс. Робить токени Knitly миттєво впізнаваними та простими для виявлення інструментами пошуку секретів.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">{'{botId}'}</code></td>
                            <td>ID Firestore-документа вашого бота. Використовується сервером для знаходження запису бота без запиту.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">{'{40-символьний hex}'}</code></td>
                            <td>160 біт криптографічної випадковості (20 байт із <code className="dp-inline-code">crypto.randomBytes</code>). На сервері зберігається лише SHA-256 хеш цього значення.</td>
                        </tr>
                    </tbody>
                </table>

                <div className="dp-note dp-note--warning">
                    <span className="dp-note-icon">⚠</span>
                    <span>
                        Токени показуються <strong>один раз</strong> — у момент створення.
                        Knitly ніколи не зберігає їх у відкритому вигляді.
                        Якщо ви втратили токен, виконайте ротацію через <code className="dp-inline-code">POST /api/v1/bots/token</code>.
                    </span>
                </div>
            </section>

            {/* Надсилання запитів */}
            <section id="sending-requests" className="dp-section">
                <h2 className="dp-section-title">Надсилання автентифікованих запитів</h2>
                <p className="dp-paragraph">
                    Додавайте токен бота до кожного запиту за допомогою стандартного HTTP-заголовка{' '}
                    <code className="dp-inline-code">Authorization</code>:
                </p>
                <CodeBlock lang="http">{`Authorization: Bearer knt_abc123def456_a1b2c3...`}</CodeBlock>

                <p className="dp-paragraph">Повний приклад із <code className="dp-inline-code">curl</code>:</p>
                <CodeBlock lang="bash">{`curl https://knitly-demo.vercel.app/api/v1/bots/me \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <p className="dp-paragraph">Повний приклад із <code className="dp-inline-code">fetch</code> (JavaScript):</p>
                <CodeBlock lang="javascript">{`const res = await fetch('https://knitly-demo.vercel.app/api/v1/bots/me', {
  headers: {
    Authorization: 'Bearer knt_abc123def456_a1b2c3...',
  },
});
const { ok, result, error } = await res.json();`}</CodeBlock>
            </section>

            {/* Реєстрація бота */}
            <section id="registering-bot" className="dp-section">
                <h2 className="dp-section-title">Реєстрація бота (X-Firebase-Token)</h2>
                <p className="dp-paragraph">
                    Щоб створити бота, потрібно підтвердити, що ви є власником акаунту Knitly.
                    Це робиться за допомогою Firebase ID-токена в заголовку{' '}
                    <code className="dp-inline-code">X-Firebase-Token</code>.
                </p>
                <p className="dp-paragraph">
                    Отримайте Firebase ID-токен на стороні клієнта за допомогою Firebase JS SDK:
                </p>
                <CodeBlock lang="javascript">{`import { getAuth } from 'firebase/auth';

const auth      = getAuth();
const idToken   = await auth.currentUser.getIdToken();

const res = await fetch('https://knitly-demo.vercel.app/api/v1/bots', {
  method: 'POST',
  headers: {
    'Content-Type':     'application/json',
    'X-Firebase-Token': idToken,
  },
  body: JSON.stringify({
    name:        'MyCuratorBot',
    description: 'Надсилає подарунки топ-слухачам',
  }),
});

const { ok, result } = await res.json();
// result.token — збережіть надійно, показується лише один раз`}</CodeBlock>

                <div className="dp-note dp-note--info">
                    <span className="dp-note-icon">ℹ</span>
                    <span>
                        Firebase ID-токени закінчуються через 1 годину. Завжди викликайте{' '}
                        <code className="dp-inline-code">getIdToken()</code> (не{' '}
                        <code className="dp-inline-code">getIdToken(false)</code>), щоб отримати свіжий токен.
                        API-токени ботів, на відміну від них, не закінчуються — лише якщо ви самі їх не ротуєте.
                    </span>
                </div>
            </section>

            {/* Ротація токена */}
            <section id="rotating-tokens" className="dp-section">
                <h2 className="dp-section-title">Ротація токена</h2>
                <p className="dp-paragraph">
                    Якщо токен скомпрометовано або ви хочете виконати планову ротацію з міркувань безпеки,
                    надішліть <code className="dp-inline-code">POST</code> до{' '}
                    <code className="dp-inline-code">/api/v1/bots/token</code>.
                    <strong> Старий токен негайно анулюється</strong> після успішного виконання.
                </p>
                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/bots/token \\
  -H "Authorization: Bearer knt_СТАРИЙ_ТОКЕН"`}</CodeBlock>
                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "token": "knt_abc123def456_НОВИЙ_СЕКРЕТ...",
    "warning": "Ваш попередній токен анульовано."
  }
}`}</CodeBlock>
            </section>

            {/* Кращі практики безпеки */}
            <section id="security-best-practices" className="dp-section">
                <h2 className="dp-section-title">Кращі практики безпеки</h2>

                <ul className="dp-list">
                    <li>
                        <strong>Ніколи не комітьте токени в систему контролю версій.</strong> Використовуйте змінні середовища
                        (наприклад, <code className="dp-inline-code">process.env.KNITLY_BOT_TOKEN</code>) або менеджер секретів.
                    </li>
                    <li>
                        <strong>Використовуйте лише HTTPS.</strong> Всі API-запити мають надходити через HTTPS.
                        Незашифрований HTTP відхиляється.
                    </li>
                    <li>
                        <strong>Ротуйте регулярно.</strong> Навіть якщо токен не скомпрометовано, ротуйте його
                        кожні 90 днів як гігієнічний захід.
                    </li>
                    <li>
                        <strong>Обмежуйте область дії бота.</strong> Реєструйте вебхуки лише для подій,
                        які вам дійсно потрібні. Невикористані підписки збільшують поверхню атаки.
                    </li>
                    <li>
                        <strong>Перевіряйте підписи вебхуків.</strong> (Буде в v1.1) Knitly підписуватиме
                        пейлоади вебхуків за допомогою HMAC-SHA256. Перевіряйте підпис перед обробкою подій.
                    </li>
                </ul>

                <div className="dp-note dp-note--danger">
                    <span className="dp-note-icon">✕</span>
                    <span>
                        <strong>Ніколи не розкривайте токен бота в клієнтському JavaScript.</strong>{' '}
                        Всі API-виклики мають надходити з вашого сервера — не з браузера або мобільного додатку.
                    </span>
                </div>
            </section>

        </div>
    );
}
