import React, { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $getSelection, $isRangeSelection, $createTextNode } from 'lexical';
import { EditorTheme } from './EditorTheme';
import './Editor.css';

// <<< НОВИЙ ПЛАГІН ДЛЯ ВСТАВКИ ТЕКСТУ (EMOJI) >>>
const InsertTextPlugin = ({ textToInsert, onTextInserted }) => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // Якщо є текст для вставки
        if (textToInsert) {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    selection.insertText(textToInsert);
                }
            });
            // Повідомляємо батьківський компонент, що вставку виконано
            onTextInserted();
        }
    }, [textToInsert, onTextInserted, editor]);

    return null;
};


const Editor = ({ onChange, placeholder, emojiToInsert, onEmojiInserted }) => {
  const initialConfig = {
    namespace: 'KnitlyPostEditor',
    theme: EditorTheme,
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
        {/* <<< ПІДКЛЮЧАЄМО НАШ НОВИЙ ПЛАГІН >>> */}
        <InsertTextPlugin textToInsert={emojiToInsert} onTextInserted={onEmojiInserted} />
      </div>
    </LexicalComposer>
  );
};

export default Editor;