import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, query, orderBy, getDocs, addDoc, doc, runTransaction, serverTimestamp, increment, getDoc } from 'firebase/firestore'; // Додано getDoc
import { useForm } from 'react-hook-form';
import { db } from '../../firebase';
import { useUserContext } from '../../UserContext';
import Comment from './Comment';
import toast from 'react-hot-toast';
import './Post.css';

const fetchComments = async (postId) => {
    const commentsQuery = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(commentsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const CommentSection = ({ postId, postAuthorId }) => {
    const { user: currentUser } = useUserContext();
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

    const { data: comments, isLoading: isLoadingComments } = useQuery(['comments', postId], () => fetchComments(postId));

    // --- НОВИЙ ЗАПИТ: Отримуємо дані самого поста, щоб знайти ID закріпленого коментаря ---
    const { data: postData } = useQuery(['post', postId], async () => {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        return postSnap.exists() ? postSnap.data() : null;
    });

    const pinnedCommentId = postData?.pinnedCommentId;

    // --- НОВИЙ ЗАПИТ: Якщо є ID закріпленого коментаря, завантажуємо його дані ---
    const { data: pinnedComment, isLoading: isLoadingPinned } = useQuery(
        ['pinnedComment', postId, pinnedCommentId],
        async () => {
            const commentRef = doc(db, 'posts', postId, 'comments', pinnedCommentId);
            const commentSnap = await getDoc(commentRef);
            return commentSnap.exists() ? { id: commentSnap.id, ...commentSnap.data() } : null;
        },
        {
            enabled: !!pinnedCommentId, // Цей запит виконається, тільки якщо pinnedCommentId існує
        }
    );

    const addCommentMutation = useMutation(
        async (newCommentData) => {
            if (!currentUser) throw new Error("Потрібно увійти в акаунт");
            
            const postRef = doc(db, 'posts', postId);
            const commentsColRef = collection(db, 'posts', postId, 'comments');
            
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) throw "Допис не знайдено!";
                
                const newCommentRef = doc(commentsColRef);
                transaction.set(newCommentRef, {...newCommentData, id: newCommentRef.id});
                transaction.update(postRef, { commentsCount: increment(1) });
            });
        },
        {
            onSuccess: () => {
                reset();
                queryClient.invalidateQueries(['comments', postId]);
                // --- Оновлюємо також і сам пост (для лічильника) ---
                queryClient.invalidateQueries(['post', postId]);
                queryClient.invalidateQueries(['feedPosts', null]);
            },
            onError: (error) => {
                toast.error(`Не вдалося додати коментар: ${error.message}`);
            }
        }
    );

    const onCommentSubmit = (data) => {
        if (!data.commentText.trim()) return;
        const newComment = {
            text: data.commentText,
            authorId: currentUser.uid,
            authorUsername: currentUser.nickname,
            authorAvatarUrl: currentUser.photoURL,
            createdAt: serverTimestamp(),
            isEdited: false,
            reactions: {}
        };
        addCommentMutation.mutate(newComment);
    };

    const isLoading = isLoadingComments || isLoadingPinned;

    return (
        <div className="comment-section">
            <div className="comment-list">
                {isLoading && <p>Завантаження коментарів...</p>}
                
                {/* --- РЕНДЕРИМО ЗАКРІПЛЕНИЙ КОМЕНТАР ПЕРШИМ --- */}
                {pinnedComment && (
                    <Comment 
                        key={pinnedComment.id} 
                        comment={pinnedComment} 
                        postId={postId}
                        postAuthorId={postAuthorId}
                        isPinned={true} // Передаємо прапорець, що це закріплений коментар
                    />
                )}

                {/* --- РЕНДЕРИМО РЕШТУ, ВІДФІЛЬТРОВУЮЧИ ЗАКРІПЛЕНИЙ, ЩОБ НЕ БУЛО ДУБЛІВ --- */}
                {comments && comments
                    .filter(comment => comment.id !== pinnedCommentId) // Виключаємо закріплений
                    .map(comment => 
                        <Comment 
                            key={comment.id} 
                            comment={comment} 
                            postId={postId}
                            postAuthorId={postAuthorId}
                            isPinned={false} // Це звичайний коментар
                        />
                )}
            </div>
            {currentUser && (
                <form className="comment-form" onSubmit={handleSubmit(onCommentSubmit)}>
                    <input
                        {...register('commentText', { required: true })}
                        type="text"
                        placeholder="Написати коментар..."
                        className="comment-input"
                        disabled={isSubmitting}
                        autoComplete="off"
                    />
                    <button type="submit" className="comment-submit-button" disabled={isSubmitting}>
                        ➤
                    </button>
                </form>
            )}
        </div>
    );
};

export default CommentSection;