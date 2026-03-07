import React from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = [
    'Наші цінності',
    'Що дозволено',
    'Що заборонено',
    'Музика та авторські права',
    'Взаємодія з іншими',
    'Як повідомити про порушення',
    'Наслідки порушень',
    'Апеляція',
];

const DO_RULES = [
    { icon: '🎵', text: 'Завантажувати власну музику, кавери та ремікси з дозволу правовласника.' },
    { icon: '🤝', text: 'Підтримувати та просувати музикантів спільноти — коментарі, реакції, репости.' },
    { icon: '💬', text: 'Вести конструктивні дискусії про музику, техніки виконання, виробництво.' },
    { icon: '🎨', text: 'Ділитися творчим процесом, скетчами, бекстейджем.' },
    { icon: '🔗', text: 'Ділитись посиланнями на зовнішні ресурси, що стосуються музики та мистецтва.' },
    { icon: '📢', text: 'Оголошувати про концерти, релізи, колаборації.' },
];

const DONT_RULES = [
    { icon: '🚫', text: 'Завантажувати чужу музику без дозволу правовласника.' },
    { icon: '💀', text: 'Публікувати контент із закликами до насильства, тероризму або екстремізму.' },
    { icon: '🎭', text: 'Видавати себе за іншого артиста або офіційний акаунт.' },
    { icon: '🤡', text: 'Розповсюджувати дезінформацію або фейкові новини.' },
    { icon: '📛', text: 'Ображати, залякувати або цькувати інших користувачів.' },
    { icon: '🔞', text: 'Публікувати сексуальний контент (особливо з участю неповнолітніх) — суворо заборонено.' },
    { icon: '🤖', text: 'Використовувати ботів, скрипти або автоматизовані засоби для накрутки активності.' },
    { icon: '💸', text: 'Здійснювати шахрайство, фішинг або незаконну комерційну діяльність.' },
    { icon: '📩', text: 'Розсилати спам або небажані рекламні повідомлення.' },
];

export default function GuidelinesContentUk() {
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
                <strong>Наша мета:</strong> Knitly — це місце, де музиканти та меломани можуть вільно творити, ділитись та підтримувати один одного. Ці правила допомагають зберегти безпечне та надихаюче середовище для всіх.
            </div>

            {/* 1 */}
            <section id="s1" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">1</span>
                    <h2 className="lp-section-title">Наші цінності</h2>
                </div>
                <p>Спільнота Knitly будується на трьох основних цінностях:</p>
                <ul>
                    <li>
                        <strong>🎵 Творчість без бар'єрів</strong> — кожен, незалежно від рівня популярності чи досвіду, заслуговує на майданчик для вираження своєї творчості.
                    </li>
                    <li>
                        <strong>🤝 Взаємна підтримка</strong> — ми будуємо середовище, де артисти допомагають одне одному рости, а не конкурують деструктивно.
                    </li>
                    <li>
                        <strong>⚖️ Справедливість</strong> — ми поважаємо права авторів та захищаємо кожного від зловживань.
                    </li>
                </ul>
            </section>

            {/* 2 */}
            <section id="s2" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">2</span>
                    <h2 className="lp-section-title">Що дозволено</h2>
                </div>
                <p>На Knitly вітається:</p>
                <ul className="lp-check-list">
                    {DO_RULES.map(({ icon, text }, i) => (
                        <li key={i} style={{ listStyle: 'none', marginBottom: '0.5rem' }}>
                            <span style={{ marginRight: '0.5rem' }}>{icon}</span>{text}
                        </li>
                    ))}
                </ul>
            </section>

            {/* 3 */}
            <section id="s3" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">3</span>
                    <h2 className="lp-section-title">Що заборонено</h2>
                </div>
                <p>На Knitly суворо заборонено:</p>
                <ul>
                    {DONT_RULES.map(({ icon, text }, i) => (
                        <li key={i} style={{ listStyle: 'none', marginBottom: '0.5rem' }}>
                            <span style={{ marginRight: '0.5rem' }}>{icon}</span>{text}
                        </li>
                    ))}
                </ul>
                <div className="lp-warning">
                    Деякі порушення (наприклад, CSAM або терористичний контент) тягнуть за собою негайне постійне блокування акаунту та передачу даних до правоохоронних органів.
                </div>
            </section>

            {/* 4 */}
            <section id="s4" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">4</span>
                    <h2 className="lp-section-title">Музика та авторські права</h2>
                </div>
                <p>
                    Музика — серце Knitly, тому ми особливо ретельно ставимось до захисту авторських прав:
                </p>
                <ul>
                    <li>Завантажуйте лише ту музику, на яку маєте права або ліцензію.</li>
                    <li>При завантаженні кавер-версії зазначайте оригінального виконавця в описі.</li>
                    <li>Для ремікс-версій необхідний дозвіл від власника оригінального твору або ліцензія Creative Commons.</li>
                    <li>Треки, що містять семпли, повинні мати відповідну документацію на використання семплів.</li>
                </ul>
                <p>
                    Детальніше про захист авторських прав та DMCA читайте в нашій <Link to="/copyright">Політиці авторських прав</Link>.
                </p>
            </section>

            {/* 5 */}
            <section id="s5" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">5</span>
                    <h2 className="lp-section-title">Взаємодія з іншими</h2>
                </div>
                <p>
                    Ми хочемо, щоб Knitly залишався місцем конструктивної взаємодії:
                </p>
                <ul>
                    <li><strong>Конструктивна критика</strong> — коментарі щодо музики мають бути поважними та спрямованими на розвиток.</li>
                    <li><strong>Ніяких образ</strong> — особисті нападки, булінг та залякування суворо заборонені.</li>
                    <li><strong>Повага до різноманіття</strong> — Knitly об'єднує артистів різних стилів, регіонів та культур. Дискримінація неприйнятна.</li>
                    <li><strong>Приватні повідомлення</strong> — не надсилайте небажані комерційні пропозиції або спам у DM.</li>
                </ul>
            </section>

            {/* 6 */}
            <section id="s6" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">6</span>
                    <h2 className="lp-section-title">Як повідомити про порушення</h2>
                </div>
                <p>Якщо ви побачили контент, що порушує ці правила:</p>
                <ol>
                    <li>Натисніть кнопку <strong>«⚠️ Поскаржитись»</strong> під треком, постом або коментарем.</li>
                    <li>Оберіть категорію скарги (порушення авторських прав, образливий контент, спам тощо).</li>
                    <li>За бажанням додайте опис ситуації.</li>
                    <li>Надішліть скаргу — ми розглянемо її протягом <strong>48 годин</strong>.</li>
                </ol>
                <p>
                    Для термінових питань пишіть на <a href="mailto:safety@knitly.app">safety@knitly.app</a>.
                </p>
                <div className="lp-info">
                    Ваша скарга залишається анонімною для особи, на яку ви скаржитесь. Ми цінуємо сміливість повідомляти про порушення.
                </div>
            </section>

            {/* 7 */}
            <section id="s7" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">7</span>
                    <h2 className="lp-section-title">Наслідки порушень</h2>
                </div>
                <p>
                    Залежно від серйозності та частоти порушень можуть застосовуватись такі заходи:
                </p>
                <ul>
                    <li>📝 <strong>Попередження</strong> — перше незначне порушення.</li>
                    <li>🗑 <strong>Видалення контенту</strong> — порушуючий контент видаляється.</li>
                    <li>🔇 <strong>Тимчасові обмеження</strong> — заборона публікувати контент або коментувати на певний термін.</li>
                    <li>⏸ <strong>Тимчасове блокування</strong> — від 7 до 90 днів залежно від порушення.</li>
                    <li>🚫 <strong>Постійне блокування</strong> — без права відновлення за грубі або систематичні порушення.</li>
                </ul>
                <p>
                    Knitly залишає за собою право застосовувати заходи на власний розсуд без попередження у разі серйозних порушень.
                </p>
            </section>

            {/* 8 */}
            <section id="s8" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">8</span>
                    <h2 className="lp-section-title">Апеляція</h2>
                </div>
                <p>
                    Якщо ви вважаєте, що до вашого облікового запису було застосовано несправедливі обмеження, ви можете подати апеляцію:
                </p>
                <ol>
                    <li>Надішліть email на <a href="mailto:appeals@knitly.app">appeals@knitly.app</a> протягом 30 днів після отримання рішення.</li>
                    <li>Вкажіть ваш нікнейм, дату рішення та причину апеляції.</li>
                    <li>Додайте будь-які докази на вашу підтримку.</li>
                </ol>
                <p>
                    Ми розглянемо апеляцію протягом 7 робочих днів та повідомимо вас про підсумкове рішення. Рішення за апеляцією є остаточним.
                </p>
            </section>

            {/* Contact */}
            <div className="lp-contact-card">
                <h3>Безпека спільноти</h3>
                <p>
                    Термінові питання безпеки: <a href="mailto:safety@knitly.app">safety@knitly.app</a><br />
                    Апеляції: <a href="mailto:appeals@knitly.app">appeals@knitly.app</a><br />
                    Загальні питання: <a href="mailto:hello@knitly.app">hello@knitly.app</a>
                </p>
            </div>
        </div>
    );
}
