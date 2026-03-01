import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { db } from '../../services/firebase';
import { doc, runTransaction, updateDoc, deleteDoc, getDoc, collection, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { useUserContext } from '../../contexts/UserContext';
import { usePlayerContext } from '../../contexts/PlayerContext';
import toast from 'react-hot-toast';
import default_picture from '../../img/Default-Images/default-picture.svg';
import CommentSection from './CommentSection';
import EmojiPickerPlus from '../chat/EmojiPickerPlus';
import LottieRenderer from '../common/LottieRenderer';
import { isPackAnimated } from '../../utils/emojiPackCache';
import LexicalPostContent from '../lexical/LexicalPostContent';
import PollAttachment from './PollAttachment';
import PostEditor from './PostEditor';
import './Post.css';

import { Heart, MessageCircle, Smile, Send, Repeat } from 'lucide-react';

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

const PostCard = ({ post, openBrowser, openShareModal, isDetailView = false }) => {
    const { user: currentUser } = useUserContext();
    const { handlePlayPause } = usePlayerContext();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const menuRef = useRef(null);

    const [commentsVisible, setCommentsVisible] = useState(false);
    const [showFullPicker, setShowFullPicker] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isPlayAttachmentLoading, setIsPlayAttachmentLoading] = useState(false);
    const [isAvatarLoaded, setAvatarLoaded] = useState(false);

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
                if (!postDoc.exists()) throw new Error("Допис не знайдено!");
                const reactions = { ...postDoc.data().reactions } || {};
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
            queryClient.invalidateQueries(['feedPosts']);
            const { reactionId } = variables;
            const isLiking = post.reactions?.[reactionId]?.uids.includes(currentUser.uid) ? false : true;

            if (reactionId === 'unicode_❤️' && isLiking && primaryAuthor.uid !== currentUser.uid) {
                const notificationRef = collection(db, 'users', primaryAuthor.uid, 'notifications');
                addDoc(notificationRef, {
                    type: 'post_like',
                    fromUser: { uid: currentUser.uid, nickname: currentUser.nickname, photoURL: currentUser.photoURL },
                    toUserId: primaryAuthor.uid, // 🔥 ОСЬ ГОЛОВНЕ ВИПРАВЛЛЕННЯ 🔥
                    entityId: post.id,
                    entityLink: `/post/${post.id}`,
                    timestamp: serverTimestamp(),
                    read: false
                });
            }
        },
        onError: (error) => {
            console.error("Помилка реакції:", error);
            toast.error(`Помилка: ${error.message}`);
        },
    });

    const updatePostMutation = useMutation(
        (newEditorStateJSON) => updateDoc(doc(db, 'posts', post.id), {
            editorState: newEditorStateJSON,
            isEdited: true
        }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['feedPosts']);
                setIsEditing(false);
                toast.success("Допис оновлено!");
            },
            onError: (error) => toast.error(`Помилка: ${error.message}`)
        }
    );

    const deletePostMutation = useMutation(
        async () => {
            // Примітка: файл вкладення в Supabase Storage залишається — очищення вручну.
            await deleteDoc(doc(db, 'posts', post.id));
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['feedPosts']);
                toast.success("Допис видалено");
            }
        }
    );

    const handleLikeClick = () => { if (!reactionMutation.isLoading) reactionMutation.mutate({ reactionId: 'unicode_❤️' }) };

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

    const handleShare = (e) => {
        e.stopPropagation();
        if (openShareModal) {
            openShareModal(post);
        }
    };

    const handleRepost = () => {
        toast('Repost скоро™', { icon: '🔁' });
    };

    const handleDeletePost = () => { if (window.confirm('Ви впевнені, що хочете видалити цей допис?')) deletePostMutation.mutate(); };

    const handleCardClick = (e) => {
        if (isDetailView) return;
        if (e.target.closest('button, a, input, [role="button"], .reaction-badge, .post-options-container')) return;
        navigate(`/${primaryAuthor.nickname}/status/${post.id}`);
    };

    const renderAuthors = (authors) => {
        if (!authors || authors.length === 0) return null;
        return (
            <div className="post-author-links">
                {authors.map((author, index) => (
                    <React.Fragment key={author.uid}>
                        <Link to={`/${author.nickname}`} className="post-author-name"> @{author.nickname} </Link>
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
                    <img src={attachment.coverArtUrl || default_picture} alt={attachment.title} className="attachment-cover" />
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
            <div className={`post-card${isDetailView ? ' detail-view' : ''}`} onClick={handleCardClick}>
                <div className="post-thread-container">
                    <div className="post-main-content">
                        <Link to={`/${primaryAuthor.nickname}`} className="post-avatar-link">
                            <div className={`post-avatar-wrapper ${!isAvatarLoaded ? 'skeleton' : ''}`}>
                                <img
                                    key={post.id}
                                    src={primaryAuthor.photoURL || default_picture}
                                    alt=""
                                    className="post-author-avatar"
                                    onLoad={() => setAvatarLoaded(true)}
                                    onError={(e) => { e.target.onerror = null; e.target.src = default_picture; setAvatarLoaded(true); }}
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
                                    {post.editorState && post.editorState !== 'null' ? <LexicalPostContent content={post.editorState} openBrowser={openBrowser} /> : null}
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
                                                        {isCustom ? (reactionData.isAnimated ? <LottieRenderer url={reactionData.url} className="reaction-emoji-custom" /> : <img src={reactionData.url} alt={reactionId} className="reaction-emoji-custom" />) : (<span className="reaction-emoji">{reactionId.substring(8)}</span>)}
                                                        <span className="reaction-count">{reactionData.uids.length}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="post-actions">
                                        <button className={`post-action-button like ${isLiked ? 'liked' : ''}`} onClick={handleLikeClick} disabled={reactionMutation.isLoading} title="Подобається">
                                            <Heart size={18} />
                                            <span>{post.likesCount || 0}</span>
                                        </button>
                                        {!isDetailView && (
                                            <button className="post-action-button" onClick={() => setCommentsVisible(!commentsVisible)} title="Коментарі">
                                                <MessageCircle size={18} />
                                                <span>{post.commentsCount || 0}</span>
                                            </button>
                                        )}
                                        {isDetailView && (
                                            <span className="post-action-button post-action-static" title="Коментарі">
                                                <MessageCircle size={18} />
                                                <span>{post.commentsCount || 0}</span>
                                            </span>
                                        )}
                                        <button className="post-action-button" onClick={() => setShowFullPicker(true)} title="Реакції">
                                            <Smile size={18} />
                                        </button>
                                        <button className="post-action-button" onClick={handleShare} title="Поширити">
                                            <Send size={18} />
                                        </button>
                                        <div className="post-actions-right">
                                            <button className="post-action-button" onClick={handleRepost} title="Репост">
                                                <Repeat size={18} />
                                                <span>{post.repostsCount || 0}</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {commentsVisible && !isDetailView && <CommentSection postId={post.id} postAuthorId={primaryAuthor.uid} inputOnly={true} />}
                </div>
            </div>
            {showFullPicker && (<EmojiPickerPlus onClose={() => setShowFullPicker(false)} onEmojiSelect={handleReactionSelect} />)}
        </>
    );
};

export default React.memo(PostCard);