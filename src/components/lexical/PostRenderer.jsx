import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { CustomEmojiNode } from './CustomEmojiNode'; // Імпорт нашого вузла
import { EditorTheme } from './EditorTheme';
import './Editor.css';

const PostRenderer = ({ content }) => {
  let initialEditorState;
  try {
    JSON.parse(content);
    initialEditorState = content;
  } catch (e) {
    initialEditorState = null;
  }

  if (!initialEditorState) {
    return null;
  }
  
  const initialConfig = {
    editorState: initialEditorState,
    editable: false,
    namespace: 'KnitlyPostRenderer',
    theme: EditorTheme,
    nodes: [CustomEmojiNode], // Реєстрація вузла тут
    onError(error) {
      console.error("Lexical Renderer Error:", error);
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container read-only">
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
    </LexicalComposer>
  );
};

export default PostRenderer;