import React from 'react';

const SECTIONS = [
    'Copyright on the Platform',
    'What You Cannot Upload',
    'Audio Recognition System',
    'Filing a Complaint (DMCA)',
    'Complaint Form',
    'Counter-Notice',
    'Repeat Infringers',
    'Artist Verification & "Claim Your Music"',
];

export default function CopyrightContentEn() {
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
                <strong>Important:</strong> Knitly respects intellectual property and expects the same from its users. We actively combat piracy and have a transparent DMCA-compliant takedown procedure.
            </div>

            {/* 1 */}
            <section id="s1" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">1</span>
                    <h2 className="lp-section-title">Copyright on the Platform</h2>
                </div>
                <p>
                    All content uploaded by users to Knitly remains the property of the respective authors and rights holders. Knitly claims no ownership over user-uploaded content.
                </p>
                <p>
                    The design, logo, the "Knitly" name, interface, and other elements of the Platform are Knitly's intellectual property, protected by international treaties.
                </p>
                <p>
                    Knitly acts as a "service provider" (invoking the "Safe Harbor" principle under the DMCA). We are not strictly liable for third-party uploads, provided we act expeditiously to remove infringing material upon proper notification.
                </p>
            </section>

            {/* 2 */}
            <section id="s2" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">2</span>
                    <h2 className="lp-section-title">What You Cannot Upload</h2>
                </div>
                <p>Without the rights holder's explicit permission, you must NOT upload:</p>
                <ul>
                    <li>Songs, albums, or parts thereof owned by others.</li>
                    <li>Unlicensed remixes or cover versions.</li>
                    <li>Music videos or audiovisual works you lack distribution rights for.</li>
                    <li>Any content with removed or altered copyright management information.</li>
                </ul>
                <div className="lp-warning">
                    <strong>Note:</strong> Renaming a track, pitch shifting, or adding silence/noise at the beginning or end does not bypass copyright restrictions. Our recognition systems detect such modifications.
                </div>
            </section>

            {/* 3 */}
            <section id="s3" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">3</span>
                    <h2 className="lp-section-title">Audio Recognition System</h2>
                </div>
                <p>
                    Knitly utilizes audio fingerprinting technology to automatically detect potentially infringing content. This system:
                </p>
                <ul>
                    <li>Analyzes the audio signal of uploaded tracks regardless of metadata.</li>
                    <li>Compares it against a database of millions of copyrighted works.</li>
                    <li>Flags matches for manual review by our moderation team.</li>
                </ul>
                <p>
                    If your original song was falsely flagged, you can appeal the decision by contacting <a href="mailto:copyright@knitly.app">copyright@knitly.app</a>.
                </p>
            </section>

            {/* 4 */}
            <section id="s4" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">4</span>
                    <h2 className="lp-section-title">Filing a Complaint (DMCA Takedown Notice)</h2>
                </div>
                <p>
                    If you are a copyright owner or authorized agent and believe your content has been infringed on Knitly, you may submit a formal DMCA Takedown Notice.
                </p>
                <p><strong>Your notice must include:</strong></p>
                <ol>
                    <li>Your name and contact info (email, phone, address).</li>
                    <li>Identification of the copyrighted work claimed to have been infringed.</li>
                    <li>The exact URL of the infringing material on Knitly.</li>
                    <li>A statement that you are the rights holder or authorized to act on their behalf.</li>
                    <li>A statement of good faith belief: "I have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner."</li>
                    <li>Your physical or electronic signature.</li>
                </ol>
                <div className="lp-info">
                    We will review the complaint within <strong>5 business days</strong>. If the notice is valid, the content will be removed expeditiously.
                </div>
            </section>

            {/* 5 */}
            <section id="s5" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">5</span>
                    <h2 className="lp-section-title">Complaint Form</h2>
                </div>
                <p>
                    Send copyright notices to:{' '}
                    <a href="mailto:copyright@knitly.app">copyright@knitly.app</a>
                </p>
                <p>
                    You can also use the <strong>"⚠️ Report"</strong> button located under every track or post.
                </p>
                <div className="lp-highlight">
                    <strong>Notice Template:</strong><br /><br />
                    I, [Your Name], the copyright owner / authorized agent of [Organization], hereby notify you that the track at [URL] infringes on the copyrighted work [Title of Work]. Please remove this material. I have a good faith belief that this use is not authorized. The information in this notification is accurate.
                </div>
                <div className="lp-warning">
                    <strong>Warning:</strong> Knowingly misrepresenting that material is infringing may incur legal liability under Section 512(f) of the DMCA.
                </div>
            </section>

            {/* 6 */}
            <section id="s6" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">6</span>
                    <h2 className="lp-section-title">Counter-Notice</h2>
                </div>
                <p>
                    If your content was removed via a complaint you believe was a mistake (e.g., you have a license or it constitutes Fair Use), you may file a Counter-Notice containing:
                </p>
                <ol>
                    <li>Your contact info.</li>
                    <li>Identification of the removed material and its former URL.</li>
                    <li>A statement under penalty of perjury that the material was removed by mistake or misidentification.</li>
                    <li>Consent to the jurisdiction of the relevant court.</li>
                    <li>Your signature.</li>
                </ol>
                <p>
                    Upon receiving a valid counter-notice, we will notify the original complainant. If they do not file a lawsuit within 10-14 days, the material will be restored.
                </p>
            </section>

            {/* 7 */}
            <section id="s7" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">7</span>
                    <h2 className="lp-section-title">Repeat Infringers</h2>
                </div>
                <p>
                    Knitly maintains a strict policy against users who repeatedly infringe copyrights:
                </p>
                <ul>
                    <li><strong>1st Offense (Strike 1):</strong> Content removal + formal warning.</li>
                    <li><strong>2nd Offense (Strike 2):</strong> Content removal + temporary upload ban (30 days).</li>
                    <li><strong>3rd Offense (Strike 3):</strong> Permanent account termination.</li>
                </ul>
            </section>

            {/* 8 */}
            <section id="s8" className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-section-num">8</span>
                    <h2 className="lp-section-title">Artist Verification & "Claim Your Music"</h2>
                </div>
                <p>
                    Verified artists on Knitly have access to advanced content management tools:
                </p>
                <ul>
                    <li>
                        <strong>"Claim Your Music"</strong> — If your tracks were uploaded by others, you can claim them, transfer them to your profile, or request immediate removal.
                    </li>
                    <li>
                        <strong>Priority Moderation</strong> — Complaints from verified artists bypass standard queues.
                    </li>
                </ul>
                <p>
                    To get verified, email us at <a href="mailto:verify@knitly.app">verify@knitly.app</a>.
                </p>
            </section>

            {/* Contact */}
            <div className="lp-contact-card">
                <h3>Copyright Inquiries</h3>
                <p>
                    Infringement notices: <a href="mailto:copyright@knitly.app">copyright@knitly.app</a><br />
                    Artist Verification: <a href="mailto:verify@knitly.app">verify@knitly.app</a><br />
                    Review time: up to 5 business days.
                </p>
            </div>
        </div>
    );
}
