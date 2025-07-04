import React from 'react';
import { Link } from 'react-router-dom';
import default_picture from '../../img/Default-Images/default-picture.svg';

const formatTime = (timestamp) => {
    if (!timestamp) return 'нещодавно';
    const now = new Date();
    const past = timestamp.toDate();
    const diffSeconds = Math.floor((now - past) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 1) return 'щойно';
    if (diffMinutes < 60) return `${diffMinutes} хв тому`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} год тому`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} дн тому`;
};

const NotificationItem = ({ notification }) => {
    const { fromUser, type, entityLink, entityTitle, timestamp, read } = notification;

    const renderText = () => {
        switch (type) {
            case 'new_follower':
                return <>тепер стежить за вами.</>;
            case 'post_like':
                return <>вподобав(-ла) ваш допис.</>;
            case 'post_comment':
                return <>прокоментував(-ла) ваш допис.</>;
            case 'track_like':
                return <>вподобав(-ла) ваш трек <strong>{entityTitle}</strong>.</>;
            case 'mention_post':
                 return <>згадав(-ла) вас у дописі.</>;
            default:
                return <>взаємодіяв(-ла) з вашим контентом.</>;
        }
    };

    return (
        <Link to={entityLink || `/user/${fromUser.nickname}`} className={`notification-item-wrapper ${!read ? 'unread' : ''}`}>
            <img 
                src={fromUser.photoURL || default_picture} 
                alt={fromUser.nickname} 
                className="notification-avatar"
            />
            <div className="notification-content">
                <p className="notification-text">
                    <span className="notification-user-link">@{fromUser.nickname}</span>
                    &nbsp;{renderText()}
                </p>
                <span className="notification-timestamp">{formatTime(timestamp)}</span>
            </div>
            {!read && <div className="unread-dot"></div>}
        </Link>
    );
};

export default NotificationItem;