import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useUserContext } from '../../UserContext';
import { useDebounce } from 'use-debounce';
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

const CollaboratorTag = ({ user, onRemove }) => (
    <div className="collaborator-tag">
        <img src={user.photoURL || default_picture} alt={user.displayName} />
        <span>@{user.nickname}</span>
        <button type="button" onClick={() => onRemove(user.uid)}>&times;</button>
    </div>
);

const searchUsers = async (searchTerm, currentUser) => {
    if (!searchTerm) return { following: [], others: [] };

    const term = searchTerm.toLowerCase();
    const endTerm = term + '\uf8ff';

    const nicknameQuery = query(
        collection(db, "users"),
        where("nickname", ">=", term),
        where("nickname", "<=", endTerm),
        limit(5)
    );
    
    const snapshot = await getDocs(nicknameQuery);
    const allResults = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

    const followingIds = currentUser.following || [];
    const following = allResults.filter(u => followingIds.includes(u.uid) && u.uid !== currentUser.uid);
    const others = allResults.filter(u => !followingIds.includes(u.uid) && u.uid !== currentUser.uid);

    return { following, others };
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

    const [showCollabInput, setShowCollabInput] = useState(false);
    const [collaborators, setCollaborators] = useState([]);
    const [collabSearchTerm, setCollabSearchTerm] = useState("");
    const [debouncedSearchTerm] = useDebounce(collabSearchTerm, 300);

    const { data: searchResults, isLoading: isSearchingCollab } = useQuery(
        ['collabSearch', debouncedSearchTerm, user],
        () => searchUsers(debouncedSearchTerm, user),
        { enabled: !!debouncedSearchTerm }
    );

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
            setCollaborators([]);
            setShowCollabInput(false);
            setCollabSearchTerm('');
            queryClient.invalidateQueries('feedPosts');
        },
        onError: (error) => {
            toast.error(`Помилка: ${error.message}`);
            console.error('Error creating post:', error);
        },
    });

    const onSubmit = (e) => {
        e.preventDefault();
        if (!user || !user.uid || !user.nickname) { // Додаткова перевірка
            toast.error('Ваш профіль ще завантажується, зачекайте хвилинку.');
            return;
        }
        if (isEditorEmpty && !attachment) {
            toast.error("Допис не може бути порожнім без вкладення.");
            return;
        }

        const mainAuthor = {
            uid: user.uid,
            nickname: user.nickname,
            photoURL: user.photoURL,
            displayName: user.displayName,
        };

        const allAuthors = [mainAuthor, ...collaborators.map(c => ({
            uid: c.uid,
            nickname: c.nickname,
            photoURL: c.photoURL,
            displayName: c.displayName,
        }))];

        const authorUids = allAuthors.map(a => a.uid);

        const newPost = {
            editorState: editorState ? JSON.stringify(editorState) : null,
            authors: allAuthors,
            authorUids: authorUids,
            createdAt: serverTimestamp(),
            attachment: attachment,
            likesCount: 0,
            commentsCount: 0,
            reactions: {},
            isEdited: false,
        };
        createPostMutation.mutate(newPost);
    };

    const handleAddCollaborator = (userToAdd) => {
        if (collaborators.length >= 3) {
            toast.error("Можна додати не більше 3 співавторів.");
            return;
        }
        if (userToAdd.uid === user.uid) {
             toast.error("Ви не можете додати себе в співавтори.");
            return;
        }
        if (collaborators.some(c => c.uid === userToAdd.uid)) {
            toast.error("Цей користувач вже є співавтором.");
            return;
        }
        setCollaborators(prev => [...prev, userToAdd]);
        setCollabSearchTerm("");
    };

    const handleRemoveCollaborator = (uid) => {
        setCollaborators(prev => prev.filter(c => c.uid !== uid));
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

    const handleSelectMusic = async (item, type) => {
        setIsShareModalOpen(false);
        if (type === 'track') {
            try {
                const trackRef = doc(db, 'tracks', item.id);
                const trackSnap = await getDoc(trackRef);
                if (trackSnap.exists()) {
                    const freshTrackData = trackSnap.data();
                    setAttachment({
                        id: item.id,
                        type: 'track',
                        title: freshTrackData.title,
                        authorName: freshTrackData.authorName,
                        coverArtUrl: freshTrackData.coverArtUrl,
                        trackUrl: freshTrackData.trackUrl,
                    });
                } else {
                    toast.error('Вибраний трек не знайдено в базі.');
                }
            } catch (error) {
                console.error("Error fetching full track data:", error);
                toast.error('Не вдалося додати трек.');
            }
        } else if (type === 'album') {
            setAttachment({
                id: item.id,
                type: 'album',
                title: item.title,
                artistName: item.artistName,
                coverArtUrl: item.coverArtUrl,
            });
        }
    };

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
                <div className="collaborators-section">
                    <div className="collaborators-display">
                        {collaborators.map(c => <CollaboratorTag key={c.uid} user={c} onRemove={handleRemoveCollaborator}/>)}
                    </div>
                    {showCollabInput && (
                        <div className="collaborator-input-container">
                            <div className="collaborator-input-wrapper">
                                <span className="at-symbol">@</span>
                                <input
                                    type="text"
                                    value={collabSearchTerm}
                                    onChange={(e) => setCollabSearchTerm(e.target.value)}
                                    placeholder="Нікнейм..."
                                    className="collaborator-input"
                                />
                            </div>
                            { (debouncedSearchTerm && (isSearchingCollab || searchResults)) && (
                                <div className="collaborator-search-results">
                                    {isSearchingCollab && <div className="search-loader">Пошук...</div>}
                                    {searchResults?.following.length > 0 && (
                                        <>
                                            <div className="results-separator">Ви підписані</div>
                                            {searchResults.following.map(u => (
                                                <div key={u.uid} className="search-item" onClick={() => handleAddCollaborator(u)}>
                                                    <img src={u.photoURL || default_picture} alt={u.displayName}/>
                                                    <span>{u.displayName} <small>@{u.nickname}</small></span>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                    {searchResults?.others.length > 0 && (
                                         <>
                                            <div className="results-separator">Інші користувачі</div>
                                            {searchResults.others.map(u => (
                                                <div key={u.uid} className="search-item" onClick={() => handleAddCollaborator(u)}>
                                                    <img src={u.photoURL || default_picture} alt={u.displayName}/>
                                                    <span>{u.displayName} <small>@{u.nickname}</small></span>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                    {!isSearchingCollab && !searchResults?.following.length && !searchResults?.others.length && debouncedSearchTerm &&
                                        <div className="search-loader">Не знайдено</div>
                                    }
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="form-footer">
                    <div className="form-footer-left">
                        <ExpandableMenu onAction={handleMenuAction} />
                         <button
                            type="button"
                            className="add-collaborator-btn"
                            title="Додати співавтора"
                            onClick={() => setShowCollabInput(!showCollabInput)}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"></path></svg>
                        </button>
                    </div>
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