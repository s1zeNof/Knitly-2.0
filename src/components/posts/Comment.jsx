import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { doc, updateDoc, runTransaction, increment } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useUserContext } from '../../contexts/UserContext';
import default_picture from '../../img/Default-Images/default-picture.svg';
import EmojiPickerPlus from '../chat/EmojiPickerPlus';
import LottieRenderer from '../common/LottieRenderer';
import { isPackAnimated } from '../../utils/emojiPackCache';
import './Post.css';

// Іконки
const OptionsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>;
const AddReactionIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>;
// --- НОВА ІКОНКА ---
const PinIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;


const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};

// --- ДОДАНО ПРОПС isPinned ---
const Comment = ({ comment, postId, postAuthorId, isPinned }) => {
    const { user: currentUser } = useUserContext();
    const queryClient = useQueryClient();
    const menuRef = useRef(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(comment.text);
    const [showMenu, setShowMenu] = useState(false);
    const [showFullPicker, setShowFullPicker] = useState(false);

    const canEdit = currentUser?.uid === comment.authorId;
    // --- ЗМІНЕНО: тепер і автор поста може видаляти ---
    const canDelete = canEdit || currentUser?.uid === postAuthorId || currentUser?.roles?.includes('admin');
    // --- НОВА УМОВА: Закріплювати може лише автор поста ---
    const canPin = currentUser?.uid === postAuthorId;


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const updateCommentMutation = useMutation(
        (newText) => updateDoc(doc(db, 'posts', postId, 'comments', comment.id), { text: newText, isEdited: true }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['comments', postId]);
                setIsEditing(false);
            }
        }
    );

    const deleteCommentMutation = useMutation(
        async () => {
            const postRef = doc(db, 'posts', postId);
            const commentRef = doc(db, 'posts', postId, 'comments', comment.id);
            await runTransaction(db, async (transaction) => {
                transaction.delete(commentRef);
                transaction.update(postRef, { commentsCount: increment(-1) });
            });
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['comments', postId]);
                // --- ЗМІНЕНО: Інвалідація конкретного поста, а не всіх ---
                queryClient.invalidateQueries(['post', postId]);
            }
        }
    );

    // --- НОВА МУТАЦІЯ ДЛЯ ЗАКРІПЛЕННЯ ---
    const pinCommentMutation = useMutation(
        async () => {
            const postRef = doc(db, 'posts', postId);
            // Якщо коментар вже закріплено, ми його відкріплюємо (встановлюємо null)
            const newPinnedId = isPinned ? null : comment.id;
            await updateDoc(postRef, { pinnedCommentId: newPinnedId });
        },
        {
            onSuccess: () => {
                // Оновлюємо дані поста і коментарів, щоб UI перебудувався
                queryClient.invalidateQueries(['post', postId]);
                queryClient.invalidateQueries(['comments', postId]);
                setShowMenu(false);
            }
        }
    );

    const reactionMutation = useMutation(
        async ({ reactionId, customUrl, isAnimated }) => {
            if (!currentUser) throw new Error("Потрібно увійти в акаунт");
            const commentRef = doc(db, 'posts', postId, 'comments', comment.id);
            await runTransaction(db, async (transaction) => {
                const commentDoc = await transaction.get(commentRef);
                if (!commentDoc.exists()) throw new Error("Коментар не знайдено!");
                const reactions = commentDoc.data().reactions || {};
                const currentReaction = reactions[reactionId] || { uids: [] };
                const userIndex = currentReaction.uids.indexOf(currentUser.uid);
                if (userIndex > -1) {
                    currentReaction.uids.splice(userIndex, 1);
                } else {
                    currentReaction.uids.push(currentUser.uid);
                    if (customUrl) {
                        currentReaction.url = customUrl;
                        currentReaction.isAnimated = isAnimated;
                    }
                }
                if (currentReaction.uids.length > 0) reactions[reactionId] = currentReaction;
                else delete reactions[reactionId];
                transaction.update(commentRef, { reactions });
            });
        },
        {
            onSuccess: () => queryClient.invalidateQueries(['comments', postId]),
            onError: (error) => console.error("Comment reaction error:", error),
        }
    );

    const handleReactionSelect = (emoji, isCustom = false) => {
        let reactionId, customUrl = null, isAnimated = false;
        if (isCustom) {
            reactionId = `${emoji.packId}_${emoji.name}`;
            customUrl = emoji.url;
            isAnimated = isPackAnimated(emoji.packId);
        } else {
            reactionId = `unicode_${emoji}`;
        }
        reactionMutation.mutate({ reactionId, customUrl, isAnimated });
        setShowFullPicker(false);
    };

    const handleUpdateComment = (e) => { e.preventDefault(); if (editedText.trim()) { updateCommentMutation.mutate(editedText); } };
    const handleDeleteComment = () => { if (window.confirm('Видалити коментар?')) { deleteCommentMutation.mutate(); } };
    
    return (
        <>
            {/* --- ОГОРТКА ДЛЯ СТИЛІЗАЦІЇ ЗАКРІПЛЕНОГО КОМЕНТАРЯ --- */}
            <div className={`comment-thread-item ${isPinned ? 'pinned' : ''}`}>
                {isPinned && (
                    <div className="pinned-badge">
                        <PinIcon />
                        <span>Закріплено автором</span>
                    </div>
                )}
                <div className="comment-item">
                    <Link to={`/user/${comment.authorUsername}`}>
                        <img src={comment.authorAvatarUrl || default_picture} alt={comment.authorUsername} className="comment-author-avatar"/>
                    </Link>
                    <div className="comment-content-wrapper">
                        <div className="comment-bubble">
                            <div className="comment-header">
                                <Link to={`/user/${comment.authorUsername}`} className="comment-author-name">@{comment.authorUsername}</Link>
                                <span className="comment-timestamp">{formatTime(comment.createdAt)} {comment.isEdited && '(ред.)'}</span>
                            </div>
                            {isEditing ? (
                                <form onSubmit={handleUpdateComment} className="comment-edit-form">
                                    <textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} className="comment-edit-textarea" rows="2" autoFocus />
                                    <div className="comment-edit-actions">
                                        <button type="button" onClick={() => setIsEditing(false)}>Скасувати</button>
                                        <button type="submit" disabled={updateCommentMutation.isLoading}>{updateCommentMutation.isLoading ? '...' : 'Зберегти'}</button>
                                    </div>
                                </form>
                            ) : (
                                <p className="comment-text">{comment.text}</p>
                            )}
                        </div>
                        
                        <div className="comment-footer">
                            {comment.reactions && Object.keys(comment.reactions).length > 0 && (
                                <div className="comment-reactions-container">
                                    {Object.entries(comment.reactions).map(([reactionId, reactionData]) => {
                                        if (!reactionData?.uids?.length) return null;
                                        const isCustom = !reactionId.startsWith('unicode_');
                                        const userHasReacted = currentUser && reactionData.uids.includes(currentUser.uid);
                                        return (
                                            <div key={reactionId} className={`reaction-badge ${userHasReacted ? 'user-reacted' : ''}`} onClick={() => reactionMutation.mutate({ reactionId, customUrl: reactionData.url, isAnimated: reactionData.isAnimated })}>
                                                {isCustom ? (reactionData.isAnimated ? <LottieRenderer url={reactionData.url} className="reaction-emoji-custom" /> : <img src={reactionData.url} alt={reactionId} className="reaction-emoji-custom" />) : <span className="reaction-emoji">{reactionId.substring(8)}</span>}
                                                <span className="reaction-count">{reactionData.uids.length}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="comment-actions">
                                {currentUser && (
                                    <button className="comment-action-btn" onClick={() => setShowFullPicker(true)} title="Додати реакцію">
                                        <AddReactionIcon />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {(canEdit || canDelete || canPin) && (
                        <div className="comment-options-container" ref={menuRef}>
                            <button className="options-button" onClick={() => setShowMenu(!showMenu)}><OptionsIcon /></button>
                            {showMenu && (
                                <div className="options-menu-small">
                                    {/* --- КНОПКА ЗАКРІПЛЕННЯ --- */}
                                    {canPin && (
                                        <button onClick={() => pinCommentMutation.mutate()}>
                                            {isPinned ? 'Відкріпити' : 'Закріпити'}
                                        </button>
                                    )}
                                    {canEdit && <button onClick={() => { setIsEditing(true); setShowMenu(false); }}>Редагувати</button>}
                                    {canDelete && <button className="option-delete" onClick={handleDeleteComment}>Видалити</button>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {showFullPicker && <EmojiPickerPlus onClose={() => setShowFullPicker(false)} onEmojiSelect={handleReactionSelect} />}
        </>
    );
};

export default Comment;