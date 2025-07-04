import React, { useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import { CustomEmojiNode } from '../lexical/CustomEmojiNode';
import { EditorTheme } from '../lexical/EditorTheme';
import './PostEditor.css';

const PostEditor = ({ initialStateJSON, onSave, onCancel, isSaving }) => {
    const [editorState, setEditorState] = useState(null);

    const initialConfig = {
        editorState: initialStateJSON, // Завантажуємо існуючий контент
        namespace: 'KnitlyPostEditor',
        theme: EditorTheme,
        nodes: [CustomEmojiNode],
        onError(error) { throw error; },
        editable: true, // Редактор активний
    };

    const handleSave = () => {
        if (editorState) {
            onSave(editorState);
        }
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="post-editor-wrapper">
                <RichTextPlugin
                    contentEditable={<ContentEditable className="post-editor-input" />}
                    placeholder={<div className="post-editor-placeholder">Введіть текст...</div>}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <OnChangePlugin onChange={(state) => setEditorState(state)} />
            </div>
            <div className="post-editor-actions">
                <button type="button" className="button-secondary" onClick={onCancel} disabled={isSaving}>
                    Скасувати
                </button>
                <button type="button" className="button-primary" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Збереження...' : 'Зберегти'}
                </button>
            </div>
        </LexicalComposer>
    );
};

export default PostEditor;