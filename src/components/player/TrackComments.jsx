/**
 * TrackComments.jsx — Knitly Track Comments
 *
 * Unified comment component used in two contexts:
 *   compact=true  → NowPlayingPanel (dark, space-constrained, 5 latest)
 *   compact=false → TrackPage (full list, paginated)
 *
 * Firestore: tracks/{trackId}/comments/{commentId}
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    collection, query, orderBy, limit, doc,
    onSnapshot, runTransaction,
    arrayUnion, arrayRemove, increment, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useUserContext } from '../../contexts/UserContext';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import default_picture from '../../img/Default-Images/default-picture.svg';
import './TrackComments.css';

/* ── Icons ───────────────────────────────────────────────────── */
const HeartIcon = ({ filled }) => (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" fill={filled ? 'currentColor' : 'none'}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);
const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
);
const SmileIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 13s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
);

/* ── Helpers ─────────────────────────────────────────────────── */
const formatRelativeTime = (timestamp) => {
    if (!timestamp?.toDate) return '';
    const diff = Math.floor((Date.now() - timestamp.toDate()) / 1000);
    if (diff < 60)      return 'щойно';
    if (diff < 3600)    return `${Math.floor(diff / 60)} хв`;
    if (diff < 86400)   return `${Math.floor(diff / 3600)} год`;
    if (diff < 604800)  return `${Math.floor(diff / 86400)} дн`;
    return timestamp.toDate().toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
};

/* ── Single comment row ──────────────────────────────────────── */
const CommentRow = ({ comment, trackId, currentUser, compact }) => {
    const isLiked = comment.likedBy?.includes(currentUser?.uid);
    const [processing, setProcessing] = useState(false);

    const handleLike = async () => {
        if (!currentUser || processing) return;
        setProcessing(true);
        try {
            const ref = doc(db, 'tracks', trackId, 'comments', comment.id);
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(ref);
                if (!snap.exists()) return;
                const delta = isLiked ? -1 : 1;
                tx.update(ref, {
                    likesCount: (snap.data().likesCount || 0) + delta,
                    likedBy: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
                });
            });
        } catch (err) {
            console.error('[TrackComments] like error:', err);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className={`tc-comment ${compact ? 'tc-comment--compact' : ''}`}>
            <Link to={`/${comment.authorUsername}`} className="tc-comment-avatar-link">
                <img
                    src={comment.authorPhotoURL || default_picture}
                    alt={comment.authorDisplayName}
                    className="tc-comment-avatar"
                    onError={(e) => { e.target.src = default_picture; }}
                />
            </Link>
            <div className="tc-comment-body">
                <div className="tc-comment-header">
                    <Link to={`/${comment.authorUsername}`} className="tc-comment-author">
                        {comment.authorDisplayName}
                    </Link>
                    <span className="tc-comment-time">
                        {formatRelativeTime(comment.timestamp)}
                    </span>
                </div>
                <p className="tc-comment-text">{comment.text}</p>
                <button
                    className={`tc-like-btn ${isLiked ? 'tc-like-btn--liked' : ''}`}
                    onClick={handleLike}
                    disabled={!currentUser || processing}
                    aria-label={isLiked ? 'Прибрати лайк' : 'Вподобати'}
                >
                    <HeartIcon filled={isLiked} />
                    {comment.likesCount > 0 && (
                        <span>{comment.likesCount}</span>
                    )}
                </button>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════ */
/**
 * TrackComments
 * @param {string}  trackId       — Firestore track document ID
 * @param {string}  trackAuthorId — UID of the track owner
 * @param {boolean} compact       — true = panel mode, false = full page mode
 */
const TrackComments = ({ trackId, trackAuthorId, compact = false }) => {
    const { user: currentUser } = useUserContext();

    const [comments, setComments]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [commentText, setText]    = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [fetchLimit, setFetchLimit] = useState(compact ? 5 : 20);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiPos, setEmojiPos] = useState({ top: 0, left: 0, width: 300, height: 350 });

    const textareaRef    = useRef(null);
    const emojiPickerRef = useRef(null);
    const emojiButtonRef = useRef(null);

    /* ── Close emoji picker on outside click ────────────────── */
    useEffect(() => {
        if (!showEmojiPicker) return;
        const handleClickOutside = (e) => {
            if (
                emojiPickerRef.current && !emojiPickerRef.current.contains(e.target) &&
                emojiButtonRef.current && !emojiButtonRef.current.contains(e.target)
            ) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

    /* ── Real-time listener ─────────────────────────────────── */
    useEffect(() => {
        if (!trackId) return;
        setLoading(true);

        const q = query(
            collection(db, 'tracks', trackId, 'comments'),
            orderBy('timestamp', compact ? 'desc' : 'asc'),
            limit(fetchLimit),
        );

        const unsub = onSnapshot(q, (snap) => {
            setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, (err) => {
            console.error('[TrackComments] snapshot error:', err);
            setLoading(false);
        });

        return () => unsub();
    }, [trackId, compact, fetchLimit]);

    /* ── Submit ─────────────────────────────────────────────── */
    const handleSubmit = useCallback(async () => {
        if (!currentUser || !commentText.trim() || submitting) return;
        setSubmitting(true);
        try {
            const trackRef    = doc(db, 'tracks', trackId);
            const commentsCol = collection(db, 'tracks', trackId, 'comments');

            await runTransaction(db, async (tx) => {
                const newRef = doc(commentsCol);
                tx.set(newRef, {
                    authorId:          currentUser.uid,
                    authorDisplayName: currentUser.displayName || 'Користувач',
                    authorPhotoURL:    currentUser.photoURL || null,
                    authorUsername:    currentUser.nickname || currentUser.uid,
                    text:              commentText.trim(),
                    timestamp:         serverTimestamp(),
                    likesCount:        0,
                    likedBy:           [],
                });
                tx.update(trackRef, { commentsCount: increment(1) });
            });

            setText('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } catch (err) {
            console.error('[TrackComments] submit error:', err);
        } finally {
            setSubmitting(false);
        }
    }, [currentUser, commentText, submitting, trackId]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleChange = (e) => {
        setText(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    };

    /* ── Emoji picker ────────────────────────────────────────── */
    const handleToggleEmojiPicker = () => {
        if (!showEmojiPicker && emojiButtonRef.current) {
            const rect    = emojiButtonRef.current.getBoundingClientRect();
            const pickerW = compact ? 280 : 320;
            const pickerH = compact ? 340 : 400;

            // Open upward by default; if not enough space, open downward
            let top  = rect.top - pickerH - 8;
            if (top < 8) top = rect.bottom + 8;

            // Align right edge with button, keep within viewport
            let left = rect.right - pickerW;
            if (left < 8) left = 8;
            if (left + pickerW > window.innerWidth - 8) left = window.innerWidth - pickerW - 8;

            setEmojiPos({ top, left, width: pickerW, height: pickerH });
        }
        setShowEmojiPicker(v => !v);
    };

    const insertEmoji = useCallback((emojiData) => {
        const emoji = emojiData.emoji;
        const ta = textareaRef.current;
        if (!ta) {
            setText(prev => prev + emoji);
            return;
        }
        const start   = ta.selectionStart;
        const end     = ta.selectionEnd;
        const newText = commentText.substring(0, start) + emoji + commentText.substring(end);
        setText(newText);
        // Restore cursor after emoji
        requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start + emoji.length;
            ta.focus();
        });
    }, [commentText]);

    const handleLoadMore = () => setFetchLimit(prev => prev + 20);

    /* ── Render ─────────────────────────────────────────────── */
    return (
        <div className={`tc-root ${compact ? 'tc-root--compact' : 'tc-root--full'}`}>

            {/* ── Compose ───────────────────────────────────── */}
            {currentUser ? (
                <div className="tc-compose">
                    <img
                        src={currentUser.photoURL || default_picture}
                        alt=""
                        className="tc-compose-avatar"
                        onError={(e) => { e.target.src = default_picture; }}
                    />
                    <div className="tc-compose-wrapper">
                        <div className="tc-compose-field">
                            <textarea
                                ref={textareaRef}
                                value={commentText}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                placeholder={compact ? 'Коментар...' : 'Написати коментар до треку...'}
                                className="tc-compose-textarea"
                                rows={1}
                                disabled={submitting}
                            />
                            <button
                                ref={emojiButtonRef}
                                type="button"
                                className={`tc-emoji-btn ${showEmojiPicker ? 'tc-emoji-btn--active' : ''}`}
                                onClick={handleToggleEmojiPicker}
                                aria-label="Emoji"
                                tabIndex={-1}
                            >
                                <SmileIcon />
                            </button>
                            <button
                                className="tc-send-btn"
                                onClick={handleSubmit}
                                disabled={!commentText.trim() || submitting}
                                aria-label="Відправити"
                            >
                                <SendIcon />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="tc-login-hint">
                    <Link to="/login">Увійдіть</Link>, щоб залишити коментар
                </p>
            )}

            {/* ── Emoji Picker (position:fixed to escape overflow:hidden) ── */}
            {showEmojiPicker && (
                <div
                    ref={emojiPickerRef}
                    className="tc-emoji-picker-wrap"
                    style={{ top: emojiPos.top, left: emojiPos.left }}
                >
                    <EmojiPicker
                        onEmojiClick={insertEmoji}
                        emojiStyle={EmojiStyle.APPLE}
                        theme="dark"
                        width={emojiPos.width}
                        height={emojiPos.height}
                        searchPlaceholder="Пошук emoji..."
                        previewConfig={{ showPreview: false }}
                        lazyLoadEmojis
                    />
                </div>
            )}

            {/* ── Comment list ──────────────────────────────── */}
            {loading ? (
                <p className="tc-state-msg">Завантаження...</p>
            ) : comments.length === 0 ? (
                <p className="tc-state-msg tc-state-msg--empty">
                    Коментарів ще немає — будьте першим
                </p>
            ) : (
                <div className="tc-list">
                    {comments.map(comment => (
                        <CommentRow
                            key={comment.id}
                            comment={comment}
                            trackId={trackId}
                            currentUser={currentUser}
                            compact={compact}
                        />
                    ))}
                </div>
            )}

            {/* Full mode: load more */}
            {!compact && !loading && comments.length >= fetchLimit && (
                <button className="tc-load-more" onClick={handleLoadMore}>
                    Показати більше коментарів
                </button>
            )}
        </div>
    );
};

export default TrackComments;
