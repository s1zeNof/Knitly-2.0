import React from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = [
    'General Provisions',
    'Registration and Account',
    'Content and Intellectual Property',
    'Prohibited Content',
    'Monetization and Gifts',
    'Limitation of Liability',
    'Changes to Terms and Termination',
    'Applicable Law',
];

export default function TermsContentEn() {
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
                <strong>In Brief:</strong> Knitly is an open platform for musicians. By using the service, you agree to these terms and assume responsibility for the content you publish.
            </div>

            {/* 1 */}
            <section id="s1" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">1</span>
                    <h2 className="lp-section-title">General Provisions</h2>
                </div>
                <p>
                    These Terms of Service ("Terms") govern your access to and use of the <strong>knitly.app</strong> website and all related services (hereinafter "Platform") provided by Knitly.
                </p>
                <p>
                    By accessing or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree with any provision, you must immediately stop using the Platform.
                </p>
                <p>
                    Use of the Platform by persons under the age of 13 is prohibited. Persons between the ages of 13 and 18 may use the Platform only with the permission of their parents or legal guardians.
                </p>
            </section>

            {/* 2 */}
            <section id="s2" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">2</span>
                    <h2 className="lp-section-title">Registration and Account</h2>
                </div>
                <p>
                    Registration is required to gain full access to the Platform's features. You agree to:
                </p>
                <ul>
                    <li>Provide accurate and up-to-date information during registration.</li>
                    <li>Maintain the confidentiality of your credentials and password.</li>
                    <li>Immediately notify Knitly of any unauthorized access to your account.</li>
                    <li>Be responsible for all activities that occur under your account.</li>
                </ul>
                <p>
                    Knitly reserves the right to suspend or terminate your account without notice in the event of a violation of these Terms.
                </p>
                <div className="lp-info">
                    We recommend enabling two-factor authentication (2FA) in your account settings to enhance security.
                </div>
            </section>

            {/* 3 */}
            <section id="s3" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">3</span>
                    <h2 className="lp-section-title">Content and Intellectual Property (UGC Disclaimer)</h2>
                </div>
                <p>
                    All content is User Generated Content. Knitly does not pre-screen it and is not liable for violations. By publishing any content on the Platform (music, lyrics, images, videos), you confirm and warrant that you:
                </p>
                <ul>
                    <li>Are the sole owner or have all necessary licenses, rights, and permissions for such content.</li>
                    <li>Do not infringe upon the copyrights, trademarks, or other rights of third parties.</li>
                    <li>Do not violate applicable laws and international norms.</li>
                </ul>
                <p>
                    By posting content, you grant Knitly a non-exclusive, royalty-free, worldwide license to reproduce, distribute, and display such content solely for the purpose of providing Platform services.
                </p>
                <p>
                    <strong>Indemnification:</strong> If Knitly faces a lawsuit by a third party (e.g., a label or artist) due to a track or other content that YOU uploaded, you are obligated to compensate us for all legal and court expenses.
                </p>
                <div className="lp-highlight">
                    The procedure for filing copyright infringement claims is described in our <Link to="/copyright">Copyright & DMCA Policy</Link>.
                </div>
            </section>

            {/* 4 */}
            <section id="s4" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">4</span>
                    <h2 className="lp-section-title">Prohibited Content and Moderation</h2>
                </div>
                <p>
                    Knitly reserves the right, at its sole discretion, to remove any content or ban an account without providing a reason and without prior notice.
                </p>
                <p>The following is strictly prohibited on the Platform:</p>
                <ul>
                    <li>Posting content that infringes on third-party copyrights without the rights holder's permission.</li>
                    <li>Publishing materials that contain hate speech, discrimination, or threats of violence.</li>
                    <li>Distributing spam, viruses, or malicious software.</li>
                    <li>Promoting terrorism or extremism.</li>
                </ul>
            </section>

            {/* 5 */}
            <section id="s5" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">5</span>
                    <h2 className="lp-section-title">Monetization and Gifts</h2>
                </div>
                <p>
                    The Platform may provide monetization opportunities for content creators, including a digital gift system. Monetization terms are governed by separate agreements.
                </p>
                <p>
                    All transactions are carried out exclusively through the Platform's official payment systems.
                </p>
            </section>

            {/* 6 */}
            <section id="s6" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">6</span>
                    <h2 className="lp-section-title">Limitation of Liability</h2>
                </div>
                <p>
                    The Platform is provided "as is" without any warranties regarding its availability, uninterrupted operation, or fitness for a particular purpose. Knitly is not responsible for:
                </p>
                <ul>
                    <li>Data or content loss due to technical failures.</li>
                    <li>Actions or content of third parties (users) on the Platform.</li>
                    <li>Indirect, incidental, or consequential damages.</li>
                </ul>
            </section>

            {/* 7 */}
            <section id="s7" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">7</span>
                    <h2 className="lp-section-title">Changes to Terms and Termination</h2>
                </div>
                <p>
                    Knitly reserves the right to modify these Terms at any time. Continued use of the Platform after changes take effect constitutes your acceptance of the updated Terms.
                </p>
                <p>
                    You may delete your account at any time via the Settings section. After deletion, the rules of our <Link to="/privacy">Privacy Policy</Link> apply.
                </p>
            </section>

            {/* 8 */}
            <section id="s8" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">8</span>
                    <h2 className="lp-section-title">Applicable Law</h2>
                </div>
                <p>
                    These Terms are governed by and construed in accordance with the laws of Ukraine. All disputes arising in connection with the use of the Platform shall be resolved in the courts of Ukraine, unless mandatory provisions of the laws of your country of residence require otherwise.
                </p>
                <p>
                    If you are a consumer in the European Union, you may also benefit from the mandatory consumer protection provisions of the law in your country of residence, including the right to bring claims before your local courts.
                </p>
            </section>

            {/* Contact */}
            <div className="lp-contact-card">
                <h3>Questions about the terms?</h3>
                <p>
                    If you have any questions regarding these Terms, please contact us: <a href="mailto:legal@knitly.app">legal@knitly.app</a>
                </p>
            </div>
        </div>
    );
}
