import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import './SharedPostAttachment.css';
import PostCard from '../posts/PostCard'; 

const SharedPostAttachment = ({ postId }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const postRef = doc(db, 'posts', postId);
                const postSnap = await getDoc(postRef);
                if (postSnap.exists()) {
                    setPost({ id: postSnap.id, ...postSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching shared post:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    if (loading) {
        return <div className="shared-post-loading">Завантаження...</div>;
    }

    if (!post) {
        return <div className="shared-post-deleted">Допис було видалено.</div>;
    }

    return (
        <div className="shared-post-attachment">
            <PostCard post={post} isAttachment={true} />
        </div>
    );
};

export default SharedPostAttachment;