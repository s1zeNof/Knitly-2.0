import React from 'react';
// ВИПРАВЛЕНО ШЛЯХ: Піднімаємось з 'posts' до 'components', потім заходимо в 'lexical'
import PostRenderer from '../lexical/PostRenderer';
// ВИПРАВЛЕНО ШЛЯХ: Піднімаємось з 'posts' до 'components', потім до 'src', і там шукаємо 'img'
import default_picture from '../../img/Default-Images/default-picture.svg';
import './PostAnalyticsCard.css';

// Іконки для статистики
const LikesIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const CommentsIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>;
const ClicksIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>;

const PostAnalyticsCard = ({ post }) => {
  const hasText = post.editorState && post.editorState !== 'null';

  return (
    <div className="post-analytics-card">
      <div className="post-analytics-content">
        {hasText ? (
          <div className="post-snippet">
            <PostRenderer content={post.editorState} />
          </div>
        ) : (
          <p className="post-snippet-placeholder">Допис без тексту</p>
        )}
        {post.attachment && (
          <div className="post-analytics-attachment">
            <img src={post.attachment.coverArtUrl || default_picture} alt="attachment" />
            <span>{post.attachment.title}</span>
          </div>
        )}
      </div>
      <div className="post-analytics-stats">
        <div className="stat-item">
          <LikesIcon />
          <span>{post.likesCount || 0}</span>
          <div className="stat-tooltip">Вподобання</div>
        </div>
        <div className="stat-item">
          <CommentsIcon />
          <span>{post.commentsCount || 0}</span>
           <div className="stat-tooltip">Коментарі</div>
        </div>
        {post.attachment && (
            <div className="stat-item">
                <ClicksIcon />
                <span>{post.attachmentClicks || 0}</span>
                 <div className="stat-tooltip">Переходи на трек</div>
            </div>
        )}
      </div>
    </div>
  );
};

export default PostAnalyticsCard;