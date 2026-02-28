/**
 * LexicalPostContent — легкий рендерер для відображення постів.
 *
 * ЗАМІСТЬ LexicalComposer (повноцінний editor instance зі scheduler-ом),
 * парсимо Lexical JSON вручну та рендеримо React-елементи напряму.
 *
 * Це виключає 6 Lexical editor instances на Home сторінці,
 * що було причиною накопичення пам'яті та "Сторінка не відповідає".
 */
import React, { useMemo } from 'react';
import LottieRenderer from '../common/LottieRenderer';
import './Editor.css';

// TEXT_FORMAT bitmask constants (відповідають Lexical)
const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 4;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;

/**
 * Рекурсивно конвертує Lexical node у React-елементи.
 * Не створює жодного Lexical editor instance.
 */
const renderNode = (node, openBrowser, key) => {
    if (!node) return null;

    switch (node.type) {
        case 'root':
            return (node.children || []).map((child, i) =>
                renderNode(child, openBrowser, `r-${i}`)
            );

        case 'paragraph': {
            const kids = (node.children || []).map((c, i) =>
                renderNode(c, openBrowser, `p-${i}`)
            );
            // Порожній параграф → пустий рядок
            return (
                <div key={key} dir={node.direction || undefined} className="lexical-paragraph">
                    {kids.length ? kids : <br />}
                </div>
            );
        }

        case 'heading': {
            const Tag = node.tag || 'h2';
            const kids = (node.children || []).map((c, i) =>
                renderNode(c, openBrowser, `h-${i}`)
            );
            return <Tag key={key}>{kids}</Tag>;
        }

        case 'quote': {
            const kids = (node.children || []).map((c, i) =>
                renderNode(c, openBrowser, `q-${i}`)
            );
            return <blockquote key={key}>{kids}</blockquote>;
        }

        case 'list': {
            const Tag = node.listType === 'bullet' ? 'ul' : 'ol';
            const kids = (node.children || []).map((c, i) =>
                renderNode(c, openBrowser, `l-${i}`)
            );
            return <Tag key={key}>{kids}</Tag>;
        }

        case 'listitem': {
            const kids = (node.children || []).map((c, i) =>
                renderNode(c, openBrowser, `li-${i}`)
            );
            return <li key={key} value={node.value}>{kids}</li>;
        }

        case 'code': {
            const kids = (node.children || []).map((c, i) =>
                renderNode(c, openBrowser, `cd-${i}`)
            );
            return <pre key={key}><code>{kids}</code></pre>;
        }

        case 'code-highlight':
        case 'text': {
            const raw = node.text;
            if (raw === undefined || raw === null) return null;
            // Порожній текст — може бути просто пробілом
            const fmt = node.format || 0;
            let el = raw;
            if (fmt & FORMAT_BOLD) el = <strong key="b">{el}</strong>;
            if (fmt & FORMAT_ITALIC) el = <em key="i">{el}</em>;
            if (fmt & FORMAT_STRIKETHROUGH) el = <s key="s">{el}</s>;
            if (fmt & FORMAT_UNDERLINE) el = <u key="u">{el}</u>;
            if (fmt & FORMAT_CODE) el = <code key="c">{el}</code>;
            return <React.Fragment key={key}>{el}</React.Fragment>;
        }

        case 'linebreak':
            return <br key={key} />;

        case 'link':
        case 'autolink': {
            const url = node.url || '#';
            const kids = (node.children || []).map((c, i) =>
                renderNode(c, openBrowser, `a-${i}`)
            );
            return (
                <a
                    key={key}
                    href={url}
                    onClick={openBrowser ? (e) => { e.preventDefault(); openBrowser(url); } : undefined}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {kids}
                </a>
            );
        }

        case 'custom-emoji': {
            if (node.isAnimated) {
                return (
                    <LottieRenderer
                        key={key}
                        url={node.src}
                        className="custom-emoji-in-editor"
                    />
                );
            }
            return (
                <img
                    key={key}
                    src={node.src}
                    alt={node.alt || ''}
                    className="custom-emoji-in-editor"
                />
            );
        }

        default:
            // Невідомий тип — рекурсивно рендеримо children
            if (node.children && node.children.length > 0) {
                return (node.children || []).map((c, i) =>
                    renderNode(c, openBrowser, `u-${i}`)
                );
            }
            return null;
    }
};

const LexicalPostContent = React.memo(({ content, openBrowser }) => {
    const rendered = useMemo(() => {
        if (!content || content === 'null') return null;
        try {
            const parsed = JSON.parse(content);
            const root = parsed.root;
            if (!root) return null;
            return renderNode(root, openBrowser, 'root');
        } catch (e) {
            // Не Lexical JSON (старий формат — plain text)
            return <p>{content}</p>;
        }
    }, [content, openBrowser]);

    if (!rendered) return null;

    return (
        <div className="post-text editor-container read-only">
            <div className="editor-input">
                {rendered}
            </div>
        </div>
    );
});

LexicalPostContent.displayName = 'LexicalPostContent';

export default LexicalPostContent;
