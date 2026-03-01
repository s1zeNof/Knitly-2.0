import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUserContext } from '../contexts/UserContext';
import PostCard from '../components/posts/PostCard';
import CommentSection from '../components/posts/CommentSection';
import LeftSidebar from '../components/layout/LeftSidebar';
import './PostPage.css';

const BackIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);

const PostPage = ({ openShareModal }) => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useUserContext();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!postId) { setNotFound(true); setLoading(false); return; }
        const fetchPost = async () => {
            try {
                const snap = await getDoc(doc(db, 'posts', postId));
                if (snap.exists()) {
                    setPost({ id: snap.id, ...snap.data() });
                } else {
                    setNotFound(true);
                }
            } catch (err) {
                console.error('PostPage fetch error:', err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [postId]);

    useEffect(() => {
        if (!loading && window.location.hash) {
            const el = document.querySelector(window.location.hash);
            if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
        }
    }, [loading]);

    const primaryAuthor = post
        ? (post.authors ? post.authors[0] : { uid: post.authorId, nickname: post.authorUsername, photoURL: post.authorAvatarUrl })
        : null;

    return (
        <div className="home-container">
            <LeftSidebar isOpen={true} />
            <main className="main-content post-page-main">
                <div className="post-page-wrapper">
                    <button className="post-page-back" onClick={() => navigate(-1)}>
                        <BackIcon />
                        <span>Назад</span>
                    </button>

                    {loading ? (
                        <div className="post-page-skeleton">
                            <div className="post-skeleton-header" />
                            <div className="post-skeleton-body" />
                            <div className="post-skeleton-body short" />
                        </div>
                    ) : notFound ? (
                        <div className="post-page-not-found">
                            <span>😶</span>
                            <h2>Допис не знайдено</h2>
                            <p>Його могли видалити або у вас немає доступу.</p>
                            <button onClick={() => navigate('/')}>На головну</button>
                        </div>
                    ) : (
                        <>
                            {/* Post — detail view (no hover/click navigation) */}
                            <div className="post-page-card">
                                <PostCard
                                    post={post}
                                    currentUser={currentUser}
                                    openBrowser={() => {}}
                                    openShareModal={openShareModal || (() => {})}
                                    isDetailView={true}
                                />
                            </div>

                            {/* Divider */}
                            <div className="post-page-divider" />

                            {/* Comment compose + full paginated list */}
                            <CommentSection
                                postId={post.id}
                                postAuthorId={primaryAuthor?.uid}
                                inputOnly={false}
                            />
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PostPage;
