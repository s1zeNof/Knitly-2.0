import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, query, orderBy, getDocs, addDoc, doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
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

    const { data: comments, isLoading } = useQuery(['comments', postId], () => fetchComments(postId));

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
                queryClient.invalidateQueries(['feedPosts', postAuthorId]);
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
        };
        addCommentMutation.mutate(newComment);
    };

    return (
        <div className="comment-section">
            <div className="comment-list">
                {isLoading && <p>Завантаження коментарів...</p>}
                {comments && comments.map(comment => 
                    <Comment 
                        key={comment.id} 
                        comment={comment} 
                        postId={postId}
                        postAuthorId={postAuthorId}
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