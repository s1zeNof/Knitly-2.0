import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { db, storage } from '../../services/firebase';
import { doc, runTransaction, updateDoc, deleteDoc, getDoc, collection, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useUserContext } from '../../contexts/UserContext';
import { usePlayerContext } from '../../contexts/PlayerContext';
import toast from 'react-hot-toast';
import default_picture from '../../img/Default-Images/default-picture.svg';
import CommentSection from './CommentSection';
import EmojiPickerPlus from '../chat/EmojiPickerPlus';
import LottieRenderer from '../common/LottieRenderer';
import { isPackAnimated } from '../../utils/emojiPackCache';
import PostRenderer from '../lexical/PostRenderer';
import PollAttachment from './PollAttachment';
import PostEditor from './PostEditor';
import './Post.css';

// Іконки
const HeartIcon = () => <svg viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const CommentIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const AddReactionIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>;
const OptionsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>;

const formatPostTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const postDate = timestamp.toDate();
    const diffSeconds = Math.floor((now - postDate) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 1) return 'щойно';
    if (diffMinutes < 60) return `${diffMinutes} хв. тому`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} год. тому`;
    return postDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
};

const PostCard = ({ post }) => {
    const { user: currentUser } = useUserContext();
    const { handlePlayPause } = usePlayerContext();
    const queryClient = useQueryClient();
    const menuRef = useRef(null);

    const [commentsVisible, setCommentsVisible] = useState(false);
    const [showFullPicker, setShowFullPicker] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isPlayAttachmentLoading, setIsPlayAttachmentLoading] = useState(false);
    const [isAvatarLoaded, setAvatarLoaded] = useState(false); // <-- ДОДАНО: Стан для завантаження аватара

    const isNewFormat = !!post.authors;
    const primaryAuthor = isNewFormat ? post.authors[0] : { uid: post.authorId, nickname: post.authorUsername, photoURL: post.authorAvatarUrl };
    const allAuthors = isNewFormat ? post.authors : [primaryAuthor];
    const authorUids = isNewFormat ? post.authorUids : [post.authorId];

    const canManagePost = currentUser?.uid && authorUids?.includes(currentUser.uid);
    const isLiked = currentUser && post.reactions?.['unicode_❤️']?.uids.includes(currentUser.uid);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const reactionMutation = useMutation({
        mutationFn: async ({ reactionId, customUrl, isAnimated }) => {
            if (!currentUser) throw new Error("Потрібно увійти в акаунт");
            const postRef = doc(db, "posts", post.id);
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) throw "Допис не знайдено!";
                const reactions = postDoc.data().reactions || {};
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
                const newLikesCount = reactions['unicode_❤️']?.uids.length || 0;
                transaction.update(postRef, { reactions, likesCount: newLikesCount });
            });
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['feedPosts', null]);
            const { reactionId } = variables;
            const isLiking = !post.reactions?.[reactionId]?.uids.includes(currentUser.uid);
            if (reactionId === 'unicode_❤️' && isLiking && primaryAuthor.uid !== currentUser.uid) {
                const notificationRef = collection(db, 'users', primaryAuthor.uid, 'notifications');
                addDoc(notificationRef, {
                    type: 'post_like',
                    fromUser: { uid: currentUser.uid, nickname: currentUser.nickname, photoURL: currentUser.photoURL },
                    entityId: post.id, entityLink: `/user/${primaryAuthor.nickname}`,
                    timestamp: serverTimestamp(), read: false
                });
            }
        },
        onError: (error) => console.error("Reaction error:", error),
    });

    const updatePostMutation = useMutation(
        (newEditorStateJSON) => updateDoc(doc(db, 'posts', post.id), {
            editorState: newEditorStateJSON,
            isEdited: true
        }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['feedPosts', null]);
                setIsEditing(false);
                toast.success("Допис оновлено!");
            },
            onError: (error) => toast.error(`Помилка: ${error.message}`)
        }
    );

    const deletePostMutation = useMutation(
        async () => {
            if (post.attachment?.storagePath) await deleteObject(ref(storage, post.attachment.storagePath));
            await deleteDoc(doc(db, 'posts', post.id));
        },
        { onSuccess: () => queryClient.invalidateQueries(['feedPosts', null]) }
    );

    const handleLikeClick = () => { if (!reactionMutation.isLoading) reactionMutation.mutate({ reactionId: 'unicode_❤️' })};

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

    const handleDeletePost = () => { if (window.confirm('Ви впевнені, що хочете видалити цей допис?')) deletePostMutation.mutate(); };

    const renderAuthors = (authors) => {
        if (!authors || authors.length === 0) return null;
        return (
            <div className="post-author-links">
                {authors.map((author, index) => (
                    <React.Fragment key={author.uid}>
                        <Link to={`/user/${author.nickname}`} className="post-author-name"> @{author.nickname} </Link>
                        {index < authors.length - 2 && ', '}
                        {index === authors.length - 2 && ' та '}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const renderAttachment = (attachment) => {
        if (!attachment) return null;
        if (attachment.type === 'poll') {
            return <PollAttachment post={post} />;
        }
        const playAttachment = async (e) => {
            e.stopPropagation();
            if (attachment.type !== 'track' || !attachment.id) return;
            const postRef = doc(db, 'posts', post.id);
            await updateDoc(postRef, { attachmentClicks: increment(1) }).catch(err => console.error("Failed to increment clicks:", err));
            setIsPlayAttachmentLoading(true);
            try {
                const trackRef = doc(db, 'tracks', attachment.id);
                const trackSnap = await getDoc(trackRef);
                if (trackSnap.exists()) handlePlayPause({ id: trackSnap.id, ...trackSnap.data() });
                else toast.error("На жаль, цей трек більше не доступний.");
            } catch (error) { toast.error("Не вдалося відтворити трек."); }
            finally { setIsPlayAttachmentLoading(false); }
        };
        return (
            <div className="post-attachment-card">
                <Link to={`/${attachment.type}/${attachment.id}`} className="attachment-link-wrapper">
                    <img src={attachment.coverArtUrl || default_picture} alt={attachment.title} className="attachment-cover"/>
                    <div className="attachment-info">
                        <span className="attachment-type">{attachment.type === 'track' ? 'ТРЕК' : 'АЛЬБОМ'}</span>
                        <p className="attachment-title">{attachment.title}</p>
                        <p className="attachment-author">{attachment.authorName || attachment.artistName}</p>
                    </div>
                </Link>
                <button className="attachment-play-button" onClick={playAttachment} disabled={isPlayAttachmentLoading}>
                    {isPlayAttachmentLoading ? <div className="mini-loader"></div> : <svg height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"></path></svg>}
                </button>
            </div>
        );
    };

    return (
        <>
            <div className="post-card">
                <div className="post-thread-container">
                    <div className="post-main-content">
                        
                        {/* ================================================= */}
                        {/* --- ОСЬ ОНОВЛЕНИЙ БЛОК АВАТАРА --- */}
                        {/* ================================================= */}
                        <Link to={`/user/${primaryAuthor.nickname}`} className="post-avatar-link">
                            <div className={`post-avatar-wrapper ${!isAvatarLoaded ? 'skeleton' : ''}`}>
                                <img
                                    key={post.id} 
                                    src={primaryAuthor.photoURL || default_picture}
                                    alt={primaryAuthor.nickname}
                                    className="post-author-avatar"
                                    onLoad={() => setAvatarLoaded(true)}
                                    onError={() => setAvatarLoaded(true)}
                                    style={{ opacity: isAvatarLoaded ? 1 : 0 }}
                                />
                            </div>
                        </Link>

                        <div className="post-content">
                            <div className="post-header">
                                <div className="post-header-main">
                                    {renderAuthors(allAuthors)}
                                    <span className="post-timestamp">
                                        · {formatPostTime(post.createdAt)} {post.isEdited && '(ред.)'}
                                    </span>
                                </div>
                                {canManagePost && (
                                    <div className="post-options-container" ref={menuRef}>
                                        <button className="options-button" onClick={() => setShowMenu(!showMenu)}>
                                            <OptionsIcon />
                                        </button>
                                        {showMenu && (
                                            <div className="options-menu-small">
                                                {(post.editorState && post.editorState !== 'null') && <button onClick={() => { setIsEditing(true); setShowMenu(false); }}>Редагувати</button>}
                                                <button className="option-delete" onClick={handleDeletePost}>Видалити</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {isEditing ? (
                                <PostEditor
                                    initialStateJSON={post.editorState}
                                    onSave={(newEditorState) => {
                                        updatePostMutation.mutate(JSON.stringify(newEditorState));
                                    }}
                                    onCancel={() => setIsEditing(false)}
                                    isSaving={updatePostMutation.isLoading}
                                />
                            ) : (
                                <>
                                    {post.editorState && post.editorState !== 'null' ? <PostRenderer content={post.editorState} /> : null}
                                    {renderAttachment(post.attachment)}
                                </>
                            )}

                            {!isEditing && (
                                <>
                                    {post.reactions && Object.keys(post.reactions).length > 0 && (
                                        <div className="post-reactions-container">
                                            {Object.entries(post.reactions).map(([reactionId, reactionData]) => {
                                                if (!reactionData?.uids?.length) return null;
                                                const isCustom = !reactionId.startsWith('unicode_');
                                                const userHasReacted = currentUser && reactionData.uids.includes(currentUser.uid);
                                                return (
                                                    <div key={reactionId} className={`reaction-badge ${userHasReacted ? 'user-reacted' : ''}`} onClick={() => reactionMutation.mutate({ reactionId, customUrl: reactionData.url, isAnimated: reactionData.isAnimated })}>
                                                        {isCustom ? ( reactionData.isAnimated ? <LottieRenderer url={reactionData.url} className="reaction-emoji-custom" /> : <img src={reactionData.url} alt={reactionId} className="reaction-emoji-custom" /> ) : ( <span className="reaction-emoji">{reactionId.substring(8)}</span> )}
                                                        <span className="reaction-count">{reactionData.uids.length}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="post-actions">
                                        <button className="post-action-button" onClick={() => setCommentsVisible(!commentsVisible)}><CommentIcon /><span>{post.commentsCount || 0}</span></button>
                                        <button className={`post-action-button like ${isLiked ? 'liked' : ''}`} onClick={handleLikeClick} disabled={reactionMutation.isLoading}><HeartIcon /><span>{post.likesCount || 0}</span></button>
                                        <button className="post-action-button" onClick={() => setShowFullPicker(true)}><AddReactionIcon /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {commentsVisible && <CommentSection postId={post.id} postAuthorId={primaryAuthor.uid} />}
                </div>
            </div>
            {showFullPicker && (<EmojiPickerPlus onClose={() => setShowFullPicker(false)} onEmojiSelect={handleReactionSelect}/>)}
        </>
    );
};

export default PostCard;