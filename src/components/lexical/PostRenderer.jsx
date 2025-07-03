import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { CustomEmojiNode } from './CustomEmojiNode';
import { EditorTheme } from './EditorTheme';
import './Editor.css';

const PostRenderer = ({ content }) => {
  // <<< ПОЧАТОК ВИПРАВЛЕННЯ: Додаємо надійну перевірку контенту >>>
  // Якщо контент відсутній або є рядком "null", нічого не рендеримо
  if (!content || content === 'null') {
    return null; 
  }
  // <<< КІНЕЦЬ ВИПРАВЛЕННЯ >>>

  let initialEditorState;
  try {
    JSON.parse(content);
    initialEditorState = content;
  } catch (e) {
    console.error("Invalid JSON content for PostRenderer:", content);
    return null; // Не рендеримо, якщо JSON невалідний
  }
  
  const initialConfig = {
    editorState: initialEditorState,
    editable: false,
    namespace: 'KnitlyPostRenderer',
    theme: EditorTheme,
    nodes: [CustomEmojiNode],
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