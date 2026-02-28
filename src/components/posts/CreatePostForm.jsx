import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, query, where, getDocs, limit, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useUserContext } from '../../contexts/UserContext';
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
// --- ПОЧАТОК ЗМІН: Імпортуємо AutoLinkNode разом з LinkNode ---
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
// --- КІНЕЦЬ ЗМІН ---

import { CustomEmojiNode, $createCustomEmojiNode } from '../lexical/CustomEmojiNode';
import { EditorTheme } from '../lexical/EditorTheme';
import default_picture from '../../img/Default-Images/default-picture.svg';
import ShareMusicModal from '../common/ShareMusicModal';
import ExpandableMenu from './ExpandableMenu';
import EmojiPickerPlus from '../chat/EmojiPickerPlus';
import { isPackAnimated } from '../../utils/emojiPackCache';
import '../lexical/Editor.css';
import './Post.css';
import { diag } from '../../utils/diagnostics';


const URL_MATCHER = /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const MATCHERS = [
  (text) => {
    const match = URL_MATCHER.exec(text);
    if (match === null) {
      return null;
    }
    const fullMatch = match[0];
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch.startsWith('http') ? fullMatch : `https://` + fullMatch,
      attributes: { rel: 'noopener noreferrer', target: '_blank' },
    };
  },
];


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
    const nicknameQuery = query(collection(db, "users"), where("nickname", ">=", term), where("nickname", "<=", endTerm), limit(5));
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

    // Логуємо монтування Lexical редактора (може бути важким)
    useEffect(() => {
        diag('CreatePostForm: МОНТУВАННЯ (Lexical editor init)');
        return () => diag('CreatePostForm: ДЕМОНТУВАННЯ');
    }, []);
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
    const [isCreatingPoll, setIsCreatingPoll] = useState(false);
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState([{ id: 1, text: "" }, { id: 2, text: "" }]);

    const { data: searchResults, isLoading: isSearchingCollab } = useQuery(
        ['collabSearch', debouncedSearchTerm, user],
        () => searchUsers(debouncedSearchTerm, user),
        { enabled: !!debouncedSearchTerm }
    );

    const initialConfig = {
        namespace: 'KnitlyPostEditor',
        theme: EditorTheme,
        // --- ПОЧАТОК ЗМІН: Додаємо AutoLinkNode до списку ---
        nodes: [CustomEmojiNode, LinkNode, AutoLinkNode],
        // --- КІНЕЦЬ ЗМІН ---
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
                if (!user.roles?.includes('creator')) {
                    await updateDoc(userRef, {
                        roles: arrayUnion('creator')
                    });
                }
            }
        },
        onSuccess: () => {
            toast.success('Ваш допис опубліковано!');
            if (editorInstance) editorInstance.update(() => { $getRoot().clear().append($createParagraphNode()); });
            setAttachment(null);
            setCollaborators([]);
            setShowCollabInput(false);
            setCollabSearchTerm('');
            handleCancelPoll();
            queryClient.invalidateQueries('feedPosts');
        },
        onError: (error) => {
            toast.error(`Помилка: ${error.message}`);
            console.error('Error creating post:', error);
        },
    });

    const onSubmit = (e) => {
        e.preventDefault();
        if (!user || !user.uid || !user.nickname) { toast.error('Ваш профіль ще завантажується, зачекайте хвилинку.'); return; }
        if (isEditorEmpty && !attachment) { toast.error("Допис не може бути порожнім без вкладення."); return; }

        const mainAuthor = { uid: user.uid, nickname: user.nickname, photoURL: user.photoURL, displayName: user.displayName };
        const allAuthors = [mainAuthor, ...collaborators.map(c => ({ uid: c.uid, nickname: c.nickname, photoURL: c.photoURL, displayName: c.displayName }))];
        const authorUids = allAuthors.map(a => a.uid);

        const newPost = {
            editorState: editorState ? JSON.stringify(editorState) : null,
            authors: allAuthors, authorUids: authorUids,
            createdAt: serverTimestamp(), attachment: attachment,
            likesCount: 0, commentsCount: 0, reactions: {}, isEdited: false,
        };
        
        createPostMutation.mutate(newPost);
    };

    const handleAddCollaborator = (userToAdd) => {
        if (collaborators.length >= 3) { toast.error("Можна додати не більше 3 співавторів."); return; }
        if (userToAdd.uid === user.uid) { toast.error("Ви не можете додати себе в співавтори."); return; }
        if (collaborators.some(c => c.uid === userToAdd.uid)) { toast.error("Цей користувач вже є співавтором."); return; }
        setCollaborators(prev => [...prev, userToAdd]);
        setCollabSearchTerm("");
    };

    const handleRemoveCollaborator = (uid) => setCollaborators(prev => prev.filter(c => c.uid !== uid));

    const handleEditorChange = (currentEditorState) => {
        setEditorState(currentEditorState);
        currentEditorState.read(() => {
            const root = $getRoot();
            const textContent = root.getTextContent().trim();
            const children = root.getChildren();
            setIsEditorEmpty(textContent === '' && children.every(node => node.getType() === 'paragraph' && node.isEmpty()));
        });
    };

    const handleMenuAction = (actionId) => {
        switch (actionId) {
            case 'music': setIsCreatingPoll(false); setIsShareModalOpen(true); break;
            case 'emoji': setIsEmojiPickerOpen(true); break;
            case 'poll': setAttachment(null); setIsCreatingPoll(true); break;
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
        setAttachment({
            id: item.id, type: type, title: item.title,
            coverArtUrl: item.coverArtUrl,
            ...(type === 'track' && { authorName: item.authorName, trackUrl: item.trackUrl }),
            ...(type === 'album' && { artistName: item.artistName }),
        });
    };
    
    const handlePollOptionChange = (index, value) => {
        const newOptions = [...pollOptions];
        newOptions[index].text = value;
        setPollOptions(newOptions);
    };

    const addPollOption = () => { if (pollOptions.length < 10) setPollOptions([...pollOptions, { id: Date.now(), text: "" }]); };
    
    const removePollOption = (index) => { if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, i) => i !== index)); };
    
    const handleAttachPoll = () => {
        if (!pollQuestion.trim()) { toast.error("Питання не може бути порожнім"); return; }
        const validOptions = pollOptions.filter(opt => opt.text.trim() !== "");
        if (validOptions.length < 2) { toast.error("Потрібно мінімум два варіанти відповіді"); return; }
        setAttachment({
            type: 'poll', question: pollQuestion,
            options: validOptions.map(opt => ({ id: crypto.randomUUID(), text: opt.text, votes: 0 })),
            voters: {}, totalVotes: 0,
        });
        setIsCreatingPoll(false);
    };

    const handleCancelPoll = () => {
        setIsCreatingPoll(false);
        setPollQuestion("");
        setPollOptions([{id: 1, text: ""}, {id: 2, text: ""}]);
    };

    if (!user) { return null; }

    const renderPollCreator = () => (
        <div className="poll-creator-container">
            <input type="text" className="form-input" placeholder="Ваше питання..." value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} maxLength="250"/>
            <div className="poll-options-creator">
                {pollOptions.map((opt, index) => (
                    <div key={opt.id} className="poll-option-input-wrapper">
                        <input type="text" className="form-input" placeholder={`Варіант ${index + 1}`} value={opt.text} onChange={e => handlePollOptionChange(index, e.target.value)} maxLength="80"/>
                         {pollOptions.length > 2 && <button type="button" onClick={() => removePollOption(index)}>&times;</button>}
                    </div>
                ))}
            </div>
            {pollOptions.length < 10 && <button type="button" className="add-option-btn" onClick={addPollOption}>+ Додати варіант</button>}
            <div className="poll-creator-actions">
                <button type="button" className="button-secondary" onClick={handleCancelPoll}>Скасувати</button>
                <button type="button" className="button-primary" onClick={handleAttachPoll}>Додати опитування</button>
            </div>
        </div>
    );

    return (
        <>
            <form onSubmit={onSubmit} className="create-post-form">
                <div className="form-header">
                    <img src={user.photoURL || default_picture} alt="Ваш аватар" className="user-avatar" />
                    <LexicalComposer initialConfig={initialConfig}>
                        <div className="editor-container">
                            <RichTextPlugin contentEditable={<ContentEditable className="editor-input" />} placeholder={<div className="editor-placeholder">{`Що нового, ${user.displayName}?`}</div>} ErrorBoundary={LexicalErrorBoundary} />
                            <HistoryPlugin />
                            <OnChangePlugin onChange={handleEditorChange} />
                            <EditorAccessPlugin onEditorReady={setEditorInstance} />
                            <AutoLinkPlugin matchers={MATCHERS} />
                        </div>
                    </LexicalComposer>
                </div>

                {isCreatingPoll ? renderPollCreator() : (
                    attachment && (
                        attachment.type === 'poll' ? (
                             <div className="attachment-preview poll-preview">
                                <span>📊 Опитування: "{attachment.question}"</span>
                                <button type="button" className="remove-attachment-btn" onClick={() => setAttachment(null)}>&times;</button>
                            </div>
                        ) : (
                             <div className="attachment-preview">
                                <img src={attachment.coverArtUrl || default_picture} alt="preview" />
                                <div className="attachment-preview-info">
                                    <p className="attachment-preview-type">{attachment.type === 'track' ? 'Трек' : 'Альбом'}</p>
                                    <p className="attachment-preview-title">{attachment.title}</p>
                                </div>
                                <button type="button" className="remove-attachment-btn" onClick={() => setAttachment(null)}>&times;</button>
                            </div>
                        )
                    )
                )}

                <div className="collaborators-section">
                    <div className="collaborators-display">
                        {collaborators.map(c => <CollaboratorTag key={c.uid} user={c} onRemove={handleRemoveCollaborator}/>)}
                    </div>
                    {showCollabInput && (
                        <div className="collaborator-input-container">
                            <div className="collaborator-input-wrapper">
                                <span className="at-symbol">@</span>
                                <input type="text" value={collabSearchTerm} onChange={(e) => setCollabSearchTerm(e.target.value)} placeholder="Нікнейм..." className="collaborator-input" />
                            </div>
                            { (debouncedSearchTerm && (isSearchingCollab || searchResults)) && (
                                <div className="collaborator-search-results">
                                    {isSearchingCollab && <div className="search-loader">Пошук...</div>}
                                    {searchResults?.following.length > 0 && (<>
                                        <div className="results-separator">Ви підписані</div>
                                        {searchResults.following.map(u => (<div key={u.uid} className="search-item" onClick={() => handleAddCollaborator(u)}><img src={u.photoURL || default_picture} alt={u.displayName}/><span>{u.displayName} <small>@{u.nickname}</small></span></div>))}
                                    </>)}
                                    {searchResults?.others.length > 0 && (<>
                                        <div className="results-separator">Інші користувачі</div>
                                        {searchResults.others.map(u => (<div key={u.uid} className="search-item" onClick={() => handleAddCollaborator(u)}><img src={u.photoURL || default_picture} alt={u.displayName}/><span>{u.displayName} <small>@{u.nickname}</small></span></div>))}
                                    </>)}
                                    {!isSearchingCollab && !searchResults?.following.length && !searchResults?.others.length && debouncedSearchTerm && <div className="search-loader">Не знайдено</div>}
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
            <ShareMusicModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onShare={handleSelectMusic}/>
            {isEmojiPickerOpen && (<EmojiPickerPlus onClose={() => setIsEmojiPickerOpen(false)} onEmojiSelect={handleEmojiSelect}/>)}
        </>
    );
};

export default CreatePostForm;