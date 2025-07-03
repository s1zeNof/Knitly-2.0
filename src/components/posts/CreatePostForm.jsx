import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc } from 'firebase/firestore'; // Додано getDoc
import { db } from '../../firebase';
import { useUserContext } from '../../UserContext';
import toast from 'react-hot-toast';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $getRoot, $getSelection, $isRangeSelection, $createParagraphNode } from 'lexical';

import { CustomEmojiNode, $createCustomEmojiNode } from '../lexical/CustomEmojiNode';
import { EditorTheme } from '../lexical/EditorTheme';
import '../lexical/Editor.css';
import default_picture from '../../img/Default-Images/default-picture.svg';
import ShareMusicModal from '../../ShareMusicModal';
import ExpandableMenu from './ExpandableMenu';
import EmojiPickerPlus from '../../EmojiPickerPlus';
import { isPackAnimated } from '../../emojiPackCache';
import './Post.css';

const EditorAccessPlugin = ({ onEditorReady }) => {
    const [editor] = useLexicalComposerContext();
    useEffect(() => { onEditorReady(editor); }, [editor, onEditorReady]);
    return null;
};

const CreatePostForm = () => {
    const { user } = useUserContext();
    const queryClient = useQueryClient();
    const [editorInstance, setEditorInstance] = useState(null);
    const [attachment, setAttachment] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [editorState, setEditorState] = useState(null);
    const [isEditorEmpty, setIsEditorEmpty] = useState(true);

    const initialConfig = {
        namespace: 'KnitlyPostEditor',
        theme: EditorTheme,
        nodes: [CustomEmojiNode],
        onError(error) { throw error; },
    };

    const createPostMutation = useMutation({
        mutationFn: async (newPostData) => {
            const postsCollectionRef = collection(db, 'posts');
            const docRef = await addDoc(postsCollectionRef, newPostData);
            await updateDoc(docRef, { postId: docRef.id });
            if (user?.uid) {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, { postsCount: increment(1) });
            }
        },
        onSuccess: () => {
            toast.success('Ваш допис опубліковано!');
            if (editorInstance) {
                editorInstance.update(() => {
                    const root = $getRoot();
                    root.clear().append($createParagraphNode());
                });
            }
            setAttachment(null);
            queryClient.invalidateQueries('feedPosts');
        },
        onError: (error) => {
            toast.error(`Помилка: ${error.message}`);
            console.error('Error creating post:', error);
        },
    });

    const onSubmit = (e) => {
        e.preventDefault();
        if (!user) {
            toast.error('Потрібно увійти в акаунт, щоб створити допис.');
            return;
        }
        if (isEditorEmpty && !attachment) {
            toast.error("Допис не може бути порожнім без вкладення.");
            return;
        }
        const newPost = {
            editorState: editorState ? JSON.stringify(editorState) : null,
            authorId: user.uid,
            authorUsername: user.nickname,
            authorAvatarUrl: user.photoURL,
            createdAt: serverTimestamp(),
            attachment: attachment,
            likesCount: 0,
            commentsCount: 0,
            reactions: {},
            isEdited: false,
        };
        createPostMutation.mutate(newPost);
    };

    const handleEditorChange = (currentEditorState) => {
        setEditorState(currentEditorState);
        currentEditorState.read(() => {
            const root = $getRoot();
            const textContent = root.getTextContent().trim();
            const children = root.getChildren();
            const isEffectivelyEmpty = textContent === '' && children.every(node => node.getType() === 'paragraph' && node.isEmpty());
            setIsEditorEmpty(isEffectivelyEmpty);
        });
    };

    const handleMenuAction = (actionId) => {
        switch (actionId) {
            case 'music': setIsShareModalOpen(true); break;
            case 'emoji': setIsEmojiPickerOpen(true); break;
            default: toast('Цей функціонал буде додано згодом.'); break;
        }
    };

    const handleEmojiSelect = (emoji, isCustom) => {
        if (editorInstance) {
            editorInstance.focus();
            editorInstance.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    if (isCustom) {
                        const emojiNode = $createCustomEmojiNode(emoji.url, emoji.name, isPackAnimated(emoji.packId));
                        selection.insertNodes([emojiNode]);
                    } else {
                        selection.insertText(emoji);
                    }
                }
            });
        }
        setIsEmojiPickerOpen(false);
    };

    // --- ПОЧАТОК КАРДИНАЛЬНОГО ВИПРАВЛЕННЯ ---
    const handleSelectMusic = async (item, type) => {
        setIsShareModalOpen(false); // Закриваємо модалку одразу

        if (type === 'track') {
            try {
                // Робимо запит до Firestore, щоб отримати повний, свіжий документ треку
                const trackRef = doc(db, 'tracks', item.id);
                const trackSnap = await getDoc(trackRef);

                if (trackSnap.exists()) {
                    const freshTrackData = trackSnap.data();
                    // Створюємо об'єкт вкладення з гарантовано актуальними даними
                    const newAttachment = {
                        id: item.id,
                        type: 'track',
                        title: freshTrackData.title,
                        authorName: freshTrackData.authorName,
                        coverArtUrl: freshTrackData.coverArtUrl,
                        trackUrl: freshTrackData.trackUrl, // <-- Тепер це поле точно буде тут
                    };
                    setAttachment(newAttachment);
                } else {
                    toast.error('Вибраний трек не знайдено в базі.');
                }
            } catch (error) {
                console.error("Error fetching full track data:", error);
                toast.error('Не вдалося додати трек.');
            }
        } else if (type === 'album') {
            // Логіка для альбомів залишається, як і раніше
            setAttachment({
                id: item.id,
                type: 'album',
                title: item.title,
                artistName: item.artistName,
                coverArtUrl: item.coverArtUrl,
            });
        }
    };
    // --- КІНЕЦЬ КАРДИНАЛЬНОГО ВИПРАВЛЕННЯ ---

    if (!user) { return null; }

    return (
        <>
            <form onSubmit={onSubmit} className="create-post-form">
                <div className="form-header">
                    <img src={user.photoURL || default_picture} alt="Ваш аватар" className="user-avatar" />
                    <LexicalComposer initialConfig={initialConfig}>
                        <div className="editor-container">
                            <RichTextPlugin
                                contentEditable={<ContentEditable className="editor-input" />}
                                placeholder={<div className="editor-placeholder">{`Що нового, ${user.displayName}?`}</div>}
                                ErrorBoundary={LexicalErrorBoundary}
                            />
                            <HistoryPlugin />
                            <OnChangePlugin onChange={handleEditorChange} />
                            <EditorAccessPlugin onEditorReady={setEditorInstance} />
                        </div>
                    </LexicalComposer>
                </div>
                {attachment && (
                    <div className="attachment-preview">
                        <img src={attachment.coverArtUrl || default_picture} alt="preview" />
                        <div className="attachment-preview-info">
                            <p className="attachment-preview-type">{attachment.type === 'track' ? 'Трек' : 'Альбом'}</p>
                            <p className="attachment-preview-title">{attachment.title}</p>
                        </div>
                        <button type="button" className="remove-attachment-btn" onClick={() => setAttachment(null)}>&times;</button>
                    </div>
                )}
                <div className="form-footer">
                    <ExpandableMenu onAction={handleMenuAction} />
                    <button type="submit" className="button-primary" disabled={createPostMutation.isLoading}>
                        {createPostMutation.isLoading ? 'Публікуємо...' : 'Опублікувати'}
                    </button>
                </div>
            </form>

            <ShareMusicModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                onShare={handleSelectMusic}
            />
            
            {isEmojiPickerOpen && (
                <EmojiPickerPlus
                    onClose={() => setIsEmojiPickerOpen(false)}
                    onEmojiSelect={handleEmojiSelect}
                />
            )}
        </>
    );
};

export default CreatePostForm;