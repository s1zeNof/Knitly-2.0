import React from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = [
    'Our Values',
    'What is Encouraged',
    'What is Prohibited',
    'Music and Copyrights',
    'Interacting with Others',
    'Reporting Violations',
    'Consequences of Violations',
    'Appeals',
];

const DO_RULES = [
    { icon: '🎵', text: 'Upload your original music, covers, and remixes with rights holders\' permission.' },
    { icon: '🤝', text: 'Support and promote independent musicians — comment, react, and share.' },
    { icon: '💬', text: 'Engage in constructive discussions on music, techniques, and production.' },
    { icon: '🎨', text: 'Share your creative process, sketches, and behind-the-scenes content.' },
    { icon: '🔗', text: 'Share links to external resources that are relevant to music and art.' },
    { icon: '📢', text: 'Announce your concerts, releases, and collaborations.' },
];

const DONT_RULES = [
    { icon: '🚫', text: 'Do not upload music you do not own or lack permission to distribute.' },
    { icon: '💀', text: 'Do not post content that incites violence, terrorism, or extremism.' },
    { icon: '🎭', text: 'Do not impersonate another artist or an official account.' },
    { icon: '🤡', text: 'Do not spread misinformation or fake news.' },
    { icon: '📛', text: 'Do not insult, harass, or bully other users.' },
    { icon: '🔞', text: 'Do not post explicit sexual content (especially involving minors) — strictly prohibited.' },
    { icon: '🤖', text: 'Do not use bots, scripts, or automated tools for fake engagement/plays.' },
    { icon: '💸', text: 'Do not engage in fraud, phishing, or illegal commercial activities.' },
    { icon: '📩', text: 'Do not send spam or unsolicited promotional messages via DMs or comments.' },
];

export default function GuidelinesContentEn() {
    return (
        <div className="lp-content">
            {/* ── Table of contents ── */}
            <nav className="lp-toc" aria-label="Table of Contents">
                <p className="lp-toc-title">Table of Contents</p>
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
                <strong>Our Goal:</strong> Knitly is a place where musicians and music lovers can freely create, share, and support each other. These rules help maintain a safe, welcoming, and inspiring environment for everyone.
            </div>

            {/* 1 */}
            <section id="s1" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">1</span>
                    <h2 className="lp-section-title">Our Values</h2>
                </div>
                <p>The Knitly community is built on three core values:</p>
                <ul>
                    <li>
                        <strong>🎵 Creativity without barriers</strong> — Everyone, regardless of fame or experience, deserves a platform to express their creativity.
                    </li>
                    <li>
                        <strong>🤝 Mutual support</strong> — We build an environment where artists help each other grow, rather than destructively competing.
                    </li>
                    <li>
                        <strong>⚖️ Fairness</strong> — We respect the rights of creators and protect everyone from abuse and exploitation.
                    </li>
                </ul>
            </section>

            {/* 2 */}
            <section id="s2" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">2</span>
                    <h2 className="lp-section-title">What is Encouraged</h2>
                </div>
                <p>On Knitly, we love seeing you:</p>
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
                    <h2 className="lp-section-title">What is Prohibited</h2>
                </div>
                <p>The following are strictly forbidden on Knitly:</p>
                <ul>
                    {DONT_RULES.map(({ icon, text }, i) => (
                        <li key={i} style={{ listStyle: 'none', marginBottom: '0.5rem' }}>
                            <span style={{ marginRight: '0.5rem' }}>{icon}</span>{text}
                        </li>
                    ))}
                </ul>
                <div className="lp-warning">
                    Certain violations (e.g., CSAM or terrorist content) will result in an immediate and permanent account ban and will be reported to law enforcement authorities.
                </div>
            </section>

            {/* 4 */}
            <section id="s4" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">4</span>
                    <h2 className="lp-section-title">Music and Copyrights</h2>
                </div>
                <p>
                    Music is the heart of Knitly, so we take copyright protection very seriously:
                </p>
                <ul>
                    <li>Only upload music you own the rights to or have a license for.</li>
                    <li>When uploading a cover, clearly credit the original artist in the description.</li>
                    <li>Remixes require written permission from the original rights holder or a valid Creative Commons license.</li>
                    <li>Tracks containing samples must be backed by appropriate sampling clearance documentation.</li>
                </ul>
                <p>
                    For more details on copyright protection and DMCA, read our <Link to="/copyright">Copyright Policy</Link>.
                </p>
            </section>

            {/* 5 */}
            <section id="s5" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">5</span>
                    <h2 className="lp-section-title">Interacting with Others</h2>
                </div>
                <p>
                    We want Knitly to remain a place of constructive interaction:
                </p>
                <ul>
                    <li><strong>Constructive Criticism</strong> — Feedback on music should be respectful and aimed at helping the artist grow.</li>
                    <li><strong>No Insults</strong> — Personal attacks, bullying, and intimidation will not be tolerated.</li>
                    <li><strong>Respect Diversity</strong> — Knitly connects artists of different styles, regions, and cultures. Discrimination is unacceptable.</li>
                    <li><strong>Direct Messages</strong> — Do not send unsolicited commercial pitches, promotions, or spam in DMs.</li>
                </ul>
            </section>

            {/* 6 */}
            <section id="s6" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">6</span>
                    <h2 className="lp-section-title">Reporting Violations</h2>
                </div>
                <p>If you encounter content or behavior that violates these guidelines:</p>
                <ol>
                    <li>Click the <strong>"⚠️ Report"</strong> button under the track, post, or comment.</li>
                    <li>Select the applicable violation category (e.g., copyright infringement, offensive content, spam).</li>
                    <li>Provide a brief description of the situation (optional but recommended).</li>
                    <li>Submit the report — we will review it within <strong>48 hours</strong>.</li>
                </ol>
                <p>
                    For urgent safety issues, email <a href="mailto:safety@knitly.app">safety@knitly.app</a>.
                </p>
                <div className="lp-info">
                    Your report is strictly confidential and anonymous to the reported party. We value your courage in reporting issues.
                </div>
            </section>

            {/* 7 */}
            <section id="s7" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">7</span>
                    <h2 className="lp-section-title">Consequences of Violations</h2>
                </div>
                <p>
                    Depending on the severity and frequency of the violation, the following actions may be taken:
                </p>
                <ul>
                    <li>📝 <strong>Warning</strong> — Issued for a first-time, minor violation.</li>
                    <li>🗑 <strong>Content Removal</strong> — The offending content will be deleted from the platform.</li>
                    <li>🔇 <strong>Temporary Restrictions</strong> — A temporary ban on posting or commenting.</li>
                    <li>⏸ <strong>Temporary Account Suspension</strong> — Ranging from 7 to 90 days.</li>
                    <li>🚫 <strong>Permanent Ban</strong> — Account deletion with no chance of recovery for severe or systematic violations.</li>
                </ul>
                <p>
                    Knitly reserves the right to take action at its sole discretion, without prior notice, in cases of serious offenses.
                </p>
            </section>

            {/* 8 */}
            <section id="s8" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">8</span>
                    <h2 className="lp-section-title">Appeals</h2>
                </div>
                <p>
                    If you believe your account was unfairly restricted or penalized, you may submit an appeal:
                </p>
                <ol>
                    <li>Send an email to <a href="mailto:appeals@knitly.app">appeals@knitly.app</a> within 30 days of receiving the decision.</li>
                    <li>Include your username, the date of the moderation action, and the reason for your appeal.</li>
                    <li>Attach any evidence or context that supports your case.</li>
                </ol>
                <p>
                    We will review the appeal within 7 business days and notify you of the final decision. Appeal decisions are final.
                </p>
            </section>

            {/* Contact */}
            <div className="lp-contact-card">
                <h3>Community Safety</h3>
                <p>
                    Urgent safety matters: <a href="mailto:safety@knitly.app">safety@knitly.app</a><br />
                    Appeals: <a href="mailto:appeals@knitly.app">appeals@knitly.app</a><br />
                    General inquiries: <a href="mailto:hello@knitly.app">hello@knitly.app</a>
                </p>
            </div>
        </div>
    );
}
