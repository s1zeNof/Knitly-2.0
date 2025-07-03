import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import { CustomEmojiNode } from './CustomEmojiNode';
import { EditorTheme } from './EditorTheme';
import './Editor.css';

const Editor = ({ onChange, placeholder, initialStateJSON }) => { // <<< ДОДАНО ПРОПС initialStateJSON
  const initialConfig = {
    // <<< ЗМІНА: Використовуємо або початковий стан, або null >>>
    editorState: initialStateJSON ? initialStateJSON : null,
    namespace: 'KnitlyEditor',
    theme: EditorTheme,
    nodes: [CustomEmojiNode], // Переконуємось, що кастомні вузли зареєстровані
    onError(error) {
      throw error;
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container">
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={<div className="editor-placeholder">{placeholder}</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={(editorState) => onChange(editorState)} />
      </div>
    </LexicalComposer>
  );
};

export default Editor;