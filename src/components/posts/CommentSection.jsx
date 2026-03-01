import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, query, orderBy, getDocs, addDoc, doc, runTransaction, serverTimestamp, increment, getDoc, limit, startAfter } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useUserContext } from '../../contexts/UserContext';
import Comment from './Comment';
import ExpandableMenu from './ExpandableMenu';
import toast from 'react-hot-toast';
import default_picture from '../../img/Default-Images/default-picture.svg';
import './Post.css';

const PAGE_SIZE = 30;

const fetchCommentsPage = async (postId, pageParam) => {
    let q;
    if (pageParam) {
        q = query(
            collection(db, 'posts', postId, 'comments'),
            orderBy('createdAt', 'asc'),
            startAfter(pageParam),
            limit(PAGE_SIZE)
        );
    } else {
        q = query(
            collection(db, 'posts', postId, 'comments'),
            orderBy('createdAt', 'asc'),
            limit(PAGE_SIZE)
        );
    }
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    return { docs, lastDoc, hasMore: snapshot.docs.length === PAGE_SIZE };
};

// inputOnly=true → shows only the compose form, no comment list (used in feed)
// inputOnly=false (default) → shows compose form + full paginated list (used in PostPage)
const CommentSection = ({ postId, postAuthorId, inputOnly = false }) => {
    const { user: currentUser } = useUserContext();
    const queryClient = useQueryClient();
    const [commentText, setCommentText] = useState('');
    const loaderRef = useRef(null);

    // Pinned comment — only in full mode
    const { data: postData } = useQuery(
        ['post', postId],
        async () => {
            const postSnap = await getDoc(doc(db, 'posts', postId));
            return postSnap.exists() ? postSnap.data() : null;
        },
        { enabled: !inputOnly }
    );
    const pinnedCommentId = postData?.pinnedCommentId;

    const { data: pinnedComment } = useQuery(
        ['pinnedComment', postId, pinnedCommentId],
        async () => {
            const snap = await getDoc(doc(db, 'posts', postId, 'comments', pinnedCommentId));
            return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        },
        { enabled: !inputOnly && !!pinnedCommentId }
    );

    // Paginated comment list — only in full mode
    const {
        data: pagesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingComments,
    } = useInfiniteQuery(
        ['comments', postId],
        ({ pageParam = null }) => fetchCommentsPage(postId, pageParam),
        {
            getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastDoc : undefined,
            enabled: !inputOnly,
        }
    );

    // Infinite scroll
    const observerCb = useCallback((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        if (inputOnly) return;
        const observer = new IntersectionObserver(observerCb, { threshold: 0.1 });
        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [observerCb, inputOnly]);

    const addCommentMutation = useMutation(
        async (newCommentData) => {
            if (!currentUser) throw new Error('Потрібно увійти в акаунт');
            const postRef = doc(db, 'posts', postId);
            const commentsColRef = collection(db, 'posts', postId, 'comments');
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) throw new Error('Допис не знайдено!');
                const newCommentRef = doc(commentsColRef);
                transaction.set(newCommentRef, { ...newCommentData, id: newCommentRef.id });
                transaction.update(postRef, { commentsCount: increment(1) });
            });
        },
        {
            onSuccess: () => {
                setCommentText('');
                queryClient.invalidateQueries(['comments', postId]);
                queryClient.invalidateQueries(['post', postId]);
                queryClient.invalidateQueries(['feedPosts', null]);
                if (postAuthorId && postAuthorId !== currentUser.uid) {
                    addDoc(collection(db, 'users', postAuthorId, 'notifications'), {
                        type: 'post_comment',
                        fromUser: { uid: currentUser.uid, nickname: currentUser.nickname, photoURL: currentUser.photoURL },
                        entityId: postId,
                        postId,
                        entityLink: `/post/${postId}`,
                        timestamp: serverTimestamp(),
                        read: false,
                    });
                }
            },
            onError: (err) => toast.error(`Не вдалося додати коментар: ${err.message}`),
        }
    );

    const handleSubmit = () => {
        if (!commentText.trim() || addCommentMutation.isLoading) return;
        addCommentMutation.mutate({
            text: commentText,
            authorId: currentUser.uid,
            authorUsername: currentUser.nickname,
            authorAvatarUrl: currentUser.photoURL,
            createdAt: serverTimestamp(),
            isEdited: false,
            reactions: {},
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleMenuAction = (actionId) => {
        toast(`${actionId} — скоро™`, { icon: '🔧' });
    };

    const allComments = pagesData?.pages.flatMap(p => p.docs) || [];

    return (
        <div className="comment-section">
            {/* Compose row */}
            {currentUser && (
                <div className="comment-compose-row">
                    <img
                        src={currentUser.photoURL || default_picture}
                        alt=""
                        className="comment-compose-avatar"
                    />
                    <div className="comment-compose-body">
                        <textarea
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Написати коментар..."
                            className="comment-compose-input"
                            rows={1}
                            disabled={addCommentMutation.isLoading}
                        />
                        <div className="comment-compose-footer">
                            <ExpandableMenu onAction={handleMenuAction} />
                            <button
                                className="comment-submit-btn"
                                onClick={handleSubmit}
                                disabled={!commentText.trim() || addCommentMutation.isLoading}
                            >
                                {addCommentMutation.isLoading ? '...' : 'Відповісти'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full comment list — only when not inputOnly */}
            {!inputOnly && (
                <div className="comment-list">
                    {isLoadingComments && <p className="comment-loading">Завантаження коментарів...</p>}

                    {pinnedComment && (
                        <Comment
                            key={pinnedComment.id}
                            comment={pinnedComment}
                            postId={postId}
                            postAuthorId={postAuthorId}
                            isPinned={true}
                        />
                    )}

                    {allComments
                        .filter(c => c.id !== pinnedCommentId)
                        .map(comment => (
                            <Comment
                                key={comment.id}
                                comment={comment}
                                postId={postId}
                                postAuthorId={postAuthorId}
                                isPinned={false}
                            />
                        ))}

                    <div ref={loaderRef} style={{ height: 1 }} />
                    {isFetchingNextPage && <p className="comment-loading">Завантаження...</p>}
                </div>
            )}
        </div>
    );
};

export default CommentSection;
