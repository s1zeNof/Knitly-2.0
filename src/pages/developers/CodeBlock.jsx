/**
 * CodeBlock — reusable syntax-highlighted code block with a copy button.
 * Used across all /developers/* content pages.
 *
 * Props:
 *   lang     {string}   Language label shown in the header (e.g. "bash", "json")
 *   children {string}   Raw code string
 */

import React, { useState } from 'react';

export default function CodeBlock({ lang = 'code', children }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(children).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="dp-code-wrap">
            <div className="dp-code-label">
                <span className="dp-code-lang">{lang}</span>
                <button
                    className={`dp-copy-btn ${copied ? 'dp-copy-btn--copied' : ''}`}
                    onClick={handleCopy}
                    aria-label={copied ? 'Copied' : 'Copy to clipboard'}
                >
                    {copied ? '✓ Copied' : 'Copy'}
                </button>
            </div>
            <pre className="dp-code"><code>{children}</code></pre>
        </div>
    );
}
