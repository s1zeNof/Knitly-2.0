import React, { useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
// --- ПОЧАТОК ЗМІН: Імпортуємо AutoLinkNode разом з LinkNode ---
import { LinkNode, AutoLinkNode } from '@lexical/link';
// --- КІНЕЦЬ ЗМІН ---
import { CustomEmojiNode } from './CustomEmojiNode';
import { EditorTheme } from './EditorTheme';
import './Editor.css';

const PostRenderer = ({ content, openBrowser }) => {
    const editorContainerRef = useRef(null);

    useEffect(() => {
        const container = editorContainerRef.current;
        if (!container || !openBrowser) return;

        const handleClick = (event) => {
            const linkElement = event.target.closest('a');
            if (linkElement && linkElement.href) {
                event.preventDefault();
                openBrowser(linkElement.href);
            }
        };

        container.addEventListener('click', handleClick);
        return () => {
            if (container) {
                container.removeEventListener('click', handleClick);
            }
        };
    }, [openBrowser]);

    if (!content || content === 'null') {
        return null;
    }

    let initialEditorState;
    try {
        JSON.parse(content);
        initialEditorState = content;
    } catch (e) {
        console.error("Invalid JSON content for PostRenderer:", content);
        return null;
    }
  
    const initialConfig = {
        editorState: initialEditorState,
        editable: false,
        namespace: 'KnitlyPostRenderer',
        theme: EditorTheme,
        // --- ПОЧАТОК ЗМІН: Додаємо AutoLinkNode ---
        nodes: [CustomEmojiNode, LinkNode, AutoLinkNode],
        // --- КІНЕЦЬ ЗМІН ---
        onError(error) {
            console.error("Lexical Renderer Error:", error);
        },
    };

    return (
        <div ref={editorContainerRef} className="post-text"> 
            <LexicalComposer initialConfig={initialConfig}>
                <div className="editor-container read-only">
                    <RichTextPlugin
                        contentEditable={<ContentEditable className="editor-input" />}
                        placeholder={null}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                </div>
            </LexicalComposer>
        </div>
    );
};

export default PostRenderer;