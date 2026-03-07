import React from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = [
    'What Data We Collect',
    'How We Use Your Data',
    'Where Data is Stored',
    'Sharing Data with Third Parties',
    'Your Rights (Right to be Forgotten)',
    'Cookies',
    'Data Security',
    'Changes to this Policy',
];

export default function PrivacyContentEn() {
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
                <strong>In Brief:</strong> We collect only the data necessary to provide our service. We do not sell your data. You have the right to request the complete deletion of any of your data ("Right to be Forgotten").
            </div>

            {/* 1 */}
            <section id="s1" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">1</span>
                    <h2 className="lp-section-title">What Data We Collect</h2>
                </div>
                <p><strong>Data you provide directly to us:</strong></p>
                <ul>
                    <li>Email address and password (upon registration)</li>
                    <li>Username (nickname) and display name</li>
                    <li>Profile picture and banner</li>
                    <li>Profile description, social media links</li>
                    <li>Audio files, covers, track lyrics (content you upload)</li>
                    <li>Chat messages (encrypted)</li>
                </ul>
                <p><strong>Data collected automatically:</strong></p>
                <ul>
                    <li>IP address and approximate geolocation</li>
                    <li>Device type, operating system, browser</li>
                    <li>Date and time of visit, pages viewed</li>
                    <li>Playback statistics (number of track plays)</li>
                </ul>
                <div className="lp-info">
                    We do not collect credit card data — all payments are processed through secure payment gateways.
                </div>
            </section>

            {/* 2 */}
            <section id="s2" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">2</span>
                    <h2 className="lp-section-title">How We Use Your Data</h2>
                </div>
                <p>Knitly uses the collected data exclusively for the following purposes:</p>
                <ul>
                    <li><strong>Service Provision:</strong> authentication, profile display, music playback.</li>
                    <li><strong>Service Improvement:</strong> usage analysis, bug detection and fixing.</li>
                    <li><strong>Personalization:</strong> track and artist recommendations based on your preferences.</li>
                    <li><strong>Security:</strong> fraud detection, protection against unauthorized access.</li>
                    <li><strong>Communication:</strong> sending important notifications regarding service changes.</li>
                    <li><strong>Legal Obligations:</strong> compliance with legal requirements.</li>
                </ul>
                <p>
                    We <strong>do not</strong> sell your personal data to third parties. We <strong>do not</strong> use your data for targeted advertising without your explicit consent.
                </p>
            </section>

            {/* 3 */}
            <section id="s3" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">3</span>
                    <h2 className="lp-section-title">Where Data is Stored</h2>
                </div>
                <p>
                    Knitly uses reliable cloud infrastructures to store your data:
                </p>
                <ul>
                    <li>
                        <strong>Firebase / Google Cloud (Alphabet Inc., USA)</strong> — database, authentication.
                        Data is encrypted at rest (AES-256) and in transit (TLS).
                    </li>
                    <li>
                        <strong>Supabase Storage</strong> — media file storage (avatars, covers, audio files).
                    </li>
                    <li>
                        <strong>Cloudflare</strong> — CDN and attack protection.
                    </li>
                </ul>
                <p>
                    Data transfers to third countries (outside the EU/Ukraine) are based on standard contractual clauses in accordance with GDPR requirements.
                </p>
            </section>

            {/* 4 */}
            <section id="s4" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">4</span>
                    <h2 className="lp-section-title">Sharing Data with Third Parties</h2>
                </div>
                <p>We may share your data in the following cases:</p>
                <ul>
                    <li><strong>With your consent</strong> — when using third-party authorization functions.</li>
                    <li><strong>Service Providers</strong> — technical partners (Firebase, Supabase, Cloudflare) solely for providing the service.</li>
                    <li><strong>Legal Requirements</strong> — upon request of authorized government bodies (in accordance with applicable law, GDPR, CCPA).</li>
                    <li><strong>Protection of Rights</strong> — to investigate fraud or violations of the Terms of Service.</li>
                </ul>
                <div className="lp-warning">
                    Knitly never shares your personal data with advertising networks or data brokers.
                </div>
            </section>

            {/* 5 */}
            <section id="s5" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">5</span>
                    <h2 className="lp-section-title">Your Rights (Right to be Forgotten)</h2>
                </div>
                <p>
                    In accordance with the GDPR, CCPA, and Ukrainian data protection laws, you have the following rights:
                </p>
                <ul>
                    <li><strong>Right of Access:</strong> to obtain a copy of your personal data.</li>
                    <li><strong>Right to Rectification:</strong> to correct inaccurate data (via Profile Settings).</li>
                    <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> to request the complete deletion of your account and all associated data. This can be done in Settings or by writing to us.</li>
                    <li><strong>Right to Restriction of Processing:</strong> to temporarily block the processing of your data.</li>
                    <li><strong>Right to Data Portability:</strong> to receive your data in a machine-readable format.</li>
                    <li><strong>Right to Object:</strong> to object to certain types of data processing.</li>
                </ul>
                <p>
                    To exercise any of these rights, use your profile settings or send a request to <a href="mailto:privacy@knitly.app">privacy@knitly.app</a>. We will process your request within 30 days.
                </p>
            </section>

            {/* 6 */}
            <section id="s6" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">6</span>
                    <h2 className="lp-section-title" id="cookies">Cookies</h2>
                </div>
                <p>
                    Knitly uses cookies and similar technologies to ensure the service functions properly:
                </p>
                <ul>
                    <li><strong>Strictly Necessary Cookies:</strong> authentication, session security — cannot be disabled.</li>
                    <li><strong>Functional Cookies:</strong> saving preferences (dark theme, language).</li>
                    <li><strong>Analytical Cookies:</strong> anonymous usage statistics.</li>
                </ul>
            </section>

            {/* 7 */}
            <section id="s7" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">7</span>
                    <h2 className="lp-section-title">Data Security</h2>
                </div>
                <p>We employ a comprehensive set of measures to protect your data:</p>
                <ul>
                    <li>Data encryption at rest (AES-256) and in transit (TLS 1.3).</li>
                    <li>Protection against unauthorized access via Firebase Security Rules.</li>
                </ul>
                <p>
                    If a data breach occurs that might impact your rights, we will notify you and the appropriate authorities within 72 hours.
                </p>
            </section>

            {/* 8 */}
            <section id="s8" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">8</span>
                    <h2 className="lp-section-title">Changes to this Policy</h2>
                </div>
                <p>
                    We may update this Privacy Policy. For material changes, we will notify you via email.
                </p>
            </section>

            {/* Contact */}
            <div className="lp-contact-card">
                <h3>Privacy Inquiries</h3>
                <p>
                    For questions regarding personal data protection, contact: <a href="mailto:privacy@knitly.app">privacy@knitly.app</a><br />
                    We respond within 30 business days.
                </p>
            </div>
        </div>
    );
}
