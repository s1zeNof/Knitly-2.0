import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import './SharedPostAttachment.css';
import default_picture from '../../img/Default-Images/default-picture.svg';

const ExternalLinkIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

/**
 * Compact shared-post preview card for chat messages.
 *
 * Props:
 *   postId  — Firestore post ID
 *   prefill — optional { postText, postAuthorNickname, postImageUrl }
 *             used to render instantly (no fetch) when data is pre-sent.
 */
const SharedPostAttachment = ({ postId, prefill }) => {
    const navigate = useNavigate();

    // If prefill is complete enough, skip the fetch
    const canSkipFetch =
        prefill &&
        (prefill.postText !== undefined || prefill.postImageUrl !== undefined) &&
        prefill.postAuthorNickname !== undefined;

    const [post, setPost] = useState(canSkipFetch ? prefill : null);
    const [loading, setLoading] = useState(!canSkipFetch);
    const [errored, setErrored] = useState(false);

    useEffect(() => {
        if (canSkipFetch || !postId) return;
        let cancelled = false;

        (async () => {
            try {
                const snap = await getDoc(doc(db, 'posts', postId));
                if (cancelled) return;
                if (snap.exists()) {
                    const d = snap.data();
                    setPost({
                        postText: d.text || '',
                        postAuthorNickname: d.authors?.[0]?.nickname || d.userNickname || '',
                        postAuthorPhoto: d.authors?.[0]?.photoURL || d.userPhotoURL || null,
                        postImageUrl: d.attachments?.[0]?.url || null,
                    });
                } else {
                    setErrored(true);
                }
            } catch {
                if (!cancelled) setErrored(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [postId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleOpen = (e) => {
        e.stopPropagation();
        if (postId) navigate(`/post/${postId}`);
    };

    /* ── Skeleton ─────────────────────────────────────── */
    if (loading) {
        return (
            <div className="spa-card spa-card--skeleton">
                <div className="spa-skeleton-label" />
                <div className="spa-body">
                    <div className="spa-skeleton-avatar" />
                    <div className="spa-skeleton-lines">
                        <div className="spa-skeleton-line long" />
                        <div className="spa-skeleton-line short" />
                    </div>
                </div>
                <div className="spa-skeleton-text" />
                <div className="spa-skeleton-text med" />
            </div>
        );
    }

    /* ── Deleted / error ─────────────────────────────── */
    if (errored || (!loading && !post)) {
        return (
            <div className="spa-card spa-card--deleted">
                <span className="spa-deleted-icon">📎</span>
                <span>Допис більше недоступний</span>
            </div>
        );
    }

    const {
        postText,
        postAuthorNickname,
        postAuthorPhoto,
        postImageUrl,
    } = post;

    const hasImage = !!postImageUrl;
    const hasText = postText && postText.trim();

    return (
        <button className="spa-card" onClick={handleOpen} type="button">
            {/* Label row */}
            <div className="spa-label-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41A2 2 0 1 1 6.58 14.59l8.13-8.13" />
                </svg>
                <span>Допис</span>
            </div>

            {/* Author */}
            <div className="spa-author-row">
                <img
                    src={postAuthorPhoto || default_picture}
                    alt={postAuthorNickname}
                    className="spa-author-avatar"
                    onError={e => { e.target.onerror = null; e.target.src = default_picture; }}
                />
                <span className="spa-author-nick">@{postAuthorNickname || '...'}</span>
            </div>

            {/* Body */}
            <div className={`spa-body${hasImage ? ' spa-body--with-image' : ''}`}>
                {hasText && (
                    <p className="spa-text">{postText}</p>
                )}
                {hasImage && (
                    <img
                        src={postImageUrl}
                        alt="Зображення допису"
                        className="spa-thumb"
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                )}
            </div>

            {/* Footer */}
            <div className="spa-footer">
                <span>Відкрити допис</span>
                <ExternalLinkIcon />
            </div>
        </button>
    );
};

export default SharedPostAttachment;