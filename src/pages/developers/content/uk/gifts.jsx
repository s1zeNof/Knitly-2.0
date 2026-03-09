import React from 'react';
import CodeBlock from '../../CodeBlock';

export default function GiftsContentUk() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Зміст">
                <p className="dp-toc-title">На цій сторінці</p>
                <ol className="dp-toc-list">
                    <li><a href="#gift-types">Типи подарунків</a></li>
                    <li><a href="#gift-object">Об'єкт подарунку</a></li>
                    <li><a href="#send-gift">Надсилання подарунку</a></li>
                    <li><a href="#get-collection">Колекція користувача</a></li>
                </ol>
            </nav>

            {/* Типи подарунків */}
            <section id="gift-types" className="dp-section">
                <h2 className="dp-section-title">Типи подарунків</h2>
                <p className="dp-paragraph">
                    Knitly підтримує два різні типи подарунків. Обидва є анімованими цифровими предметами,
                    але відрізняються за запасом, семантикою власності та моделлю доходів.
                </p>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Тип</th><th>Запас</th><th>Власність</th><th>Частка артиста</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">regular</code></td>
                            <td>Необмежений або лімітований</td>
                            <td>Декоративний предмет, без блокчейн-запису</td>
                            <td>90% первинний продаж</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">nft</code></td>
                            <td>Фіксований ліміт мінтингу</td>
                            <td>Унікальний серійний номер, ланцюг провенансу, chain-ready</td>
                            <td>80% первинний · 10% роялті при перепродажі</td>
                        </tr>
                    </tbody>
                </table>

                <p className="dp-paragraph"><strong>Рівні рідкості</strong></p>
                <p className="dp-paragraph">
                    Обидва типи подарунків можуть мати рівень рідкості. Рідкість є косметичною та інформаційною —
                    вона не обмежує запас самостійно (для цього використовуйте <code className="dp-inline-code">maxMints</code>).
                </p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Рідкість</th><th>Типове використання</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code className="dp-param-name">common</code></td><td>Повсякденні подарунки, необмежений запас</td></tr>
                        <tr><td><code className="dp-param-name">rare</code></td><td>Місячні дропи, ліміт кілька тисяч</td></tr>
                        <tr><td><code className="dp-param-name">epic</code></td><td>Подарунки до релізу альбому, ліміт кілька сотень</td></tr>
                        <tr><td><code className="dp-param-name">legendary</code></td><td>Унікальний, лише NFT, один мінт</td></tr>
                    </tbody>
                </table>
            </section>

            {/* Об'єкт подарунку */}
            <section id="gift-object" className="dp-section">
                <h2 className="dp-section-title">Об'єкт подарунку</h2>
                <p className="dp-paragraph">
                    Каталог подарунків знаходиться у Firestore в колекції <code className="dp-inline-code">gifts</code>.
                    При надсиланні подарунку посилайтесь на нього через його <code className="dp-inline-code">giftId</code>.
                </p>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Поле</th><th>Тип</th><th>Опис</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">id</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>ID Firestore-документа — використовуйте як <code className="dp-inline-code">giftId</code> при надсиланні.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">name</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Відображувана назва подарунку (наприклад, "Золотий вініл").</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">type</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><code className="dp-inline-code">regular</code> | <code className="dp-inline-code">nft</code></td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">rarity</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><code className="dp-inline-code">common</code> | <code className="dp-inline-code">rare</code> | <code className="dp-inline-code">epic</code> | <code className="dp-inline-code">legendary</code></td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">price</code></td>
                            <td><span className="dp-param-type">number</span></td>
                            <td>Ціна в Нотах Knitly (внутрішня валюта).</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">animationUrl</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>URL до Lottie JSON файлу анімації.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">isActive</code></td>
                            <td><span className="dp-param-type">boolean</span></td>
                            <td>Якщо <code className="dp-inline-code">false</code>, подарунок не можна надіслати.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">maxMints</code></td>
                            <td><span className="dp-param-type">number | null</span></td>
                            <td><code className="dp-inline-code">null</code> означає необмежений запас.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">mintedCount</code></td>
                            <td><span className="dp-param-type">number</span></td>
                            <td>Скільки копій вже надіслано.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">availableUntil</code></td>
                            <td><span className="dp-param-type">string | null</span></td>
                            <td>Термін дії в ISO 8601. Після цієї дати подарунок надіслати неможливо.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Надсилання подарунку */}
            <section id="send-gift" className="dp-section">
                <h2 className="dp-section-title">Надсилання подарунку</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--post">POST</span>
                    <code className="dp-endpoint-path">/api/v1/gifts/send</code>
                    <span className="dp-endpoint-desc">Надсилає подарунок користувачу Knitly, опціонально прив'язуючи до треку.</span>
                </div>

                <p className="dp-paragraph">
                    Ліміт: <strong>30 запитів / хвилина</strong> на токен бота.
                    Операція є атомарною — колекція одержувача оновлюється, лічильник запасу зменшується
                    та створюється сповіщення в одному батч-записі Firestore.
                </p>

                <p className="dp-paragraph"><strong>Тіло запиту</strong></p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Поле</th><th>Тип</th><th>Обов'язкове</th><th>Опис</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">recipientId</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--yes">обов'язкове</span></td>
                            <td>Firebase Auth UID одержувача подарунку.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">giftId</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--yes">обов'язкове</span></td>
                            <td>ID Firestore-документа подарунку.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">trackId</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--no">опціональне</span></td>
                            <td>Firestore ID треку для прив'язки. Відображається на сторінці треку.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">message</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--no">опціональне</span></td>
                            <td>Особисте повідомлення до подарунку. Максимум 280 символів.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/gifts/send \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipientId": "FIREBASE_UID_КОРИСТУВАЧА",
    "giftId": "ID_ПОДАРУНКУ_З_FIRESTORE",
    "trackId": "ID_ТРЕКУ_З_FIRESTORE",
    "message": "Чудовий трек! Тримай невеликий подарунок."
  }'`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "id": "id_документа_надісланого_подарунку",
    "giftId": "ID_ПОДАРУНКУ_З_FIRESTORE",
    "recipientId": "FIREBASE_UID_КОРИСТУВАЧА",
    "trackId": "ID_ТРЕКУ_З_FIRESTORE",
    "message": "Чудовий трек! Тримай невеликий подарунок.",
    "status": "received",
    "createdAt": "2026-01-15T12:00:00.000Z"
  }
}`}</CodeBlock>

                <p className="dp-paragraph"><strong>Можливі помилки</strong></p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Код</th><th>Причина</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">NOT_FOUND</code></td>
                            <td><code className="dp-inline-code">giftId</code> або <code className="dp-inline-code">recipientId</code> не існує.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">CONFLICT</code></td>
                            <td>Подарунок розпродано (<code className="dp-inline-code">mintedCount</code> досяг <code className="dp-inline-code">maxMints</code>) або минув термін <code className="dp-inline-code">availableUntil</code>.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">FORBIDDEN</code></td>
                            <td>Подарунок неактивний (<code className="dp-inline-code">isActive: false</code>).</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">RATE_LIMITED</code></td>
                            <td>Більше 30 запитів на надсилання за 60 секунд.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Колекція користувача */}
            <section id="get-collection" className="dp-section">
                <h2 className="dp-section-title">Колекція користувача</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--get">GET</span>
                    <code className="dp-endpoint-path">/api/v1/gifts/collection/:uid</code>
                    <span className="dp-endpoint-desc">Повертає подарунки, отримані конкретним користувачем, з пагінацією.</span>
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
                            <td>Кількість елементів для повернення. Максимум 50.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">startAfter</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>—</td>
                            <td>Курсор для пагінації. Використовуйте <code className="dp-inline-code">nextCursor</code> з попередньої відповіді.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="bash">{`curl "https://knitly-demo.vercel.app/api/v1/gifts/collection/UID_КОРИСТУВАЧА?limit=10" \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "items": [
      {
        "id": "id_документа_надісланого_подарунку",
        "giftId": "ID_ПОДАРУНКУ_З_FIRESTORE",
        "giftName": "Золотий вініл",
        "type": "nft",
        "rarity": "legendary",
        "animationUrl": "https://...",
        "trackId": "ID_ТРЕКУ_З_FIRESTORE",
        "message": "Чудовий трек!",
        "status": "received",
        "createdAt": "2026-01-15T12:00:00.000Z"
      }
    ],
    "nextCursor": "id_документа_надісланого_подарунку",
    "hasMore": false
  }
}`}</CodeBlock>
            </section>

        </div>
    );
}
