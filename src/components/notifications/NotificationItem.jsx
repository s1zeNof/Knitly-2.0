import React from 'react';
import default_picture from '../../img/Default-Images/default-picture.svg';
import VerifiedBadge from '../common/VerifiedBadge';

const formatTime = (timestamp) => {
    if (!timestamp) return 'нещодавно';
    const now = new Date();
    const past = timestamp.toDate();
    const diffSec = Math.floor((now - past) / 1000);
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 1) return 'щойно';
    if (diffMin < 60) return `${diffMin} хв тому`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} год тому`;
    return past.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
};

/* ---- Type icon badges ---- */
const IconHeart = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>;
const IconComment = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>;
const IconPerson = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V8H4v2H2v2h2v2h2v-2h2v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>;
const IconMusic = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>;
const IconAt = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" /></svg>;
const IconChevron = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>;
const IconShield = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.47-2.34 6.71-6 7.93-3.66-1.22-6-4.46-6-7.93V7.67L12 5z" /></svg>;
const IconGift = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>;

const TYPE_META = {
    new_follower: { color: '#3b82f6', Icon: IconPerson, label: 'Підписник' },
    post_like: { color: '#ef4444', Icon: IconHeart, label: 'Вподобайка' },
    post_comment: { color: '#22c55e', Icon: IconComment, label: 'Коментар' },
    track_like: { color: '#a855f7', Icon: IconMusic, label: 'Лайк треку' },
    comment_like: { color: '#f97316', Icon: IconHeart, label: 'Лайк коментаря' },
    mention_post: { color: '#f59e0b', Icon: IconAt, label: 'Згадка' },
    report_update: { color: '#a855f7', Icon: IconShield, label: 'Скарга' },
    gift_received: { color: '#ec4899', Icon: IconGift, label: 'Подарунок' },
};

const renderText = (type, entityTitle, notification) => {
    switch (type) {
        case 'new_follower': return <>тепер стежить за вами.</>;
        case 'post_like': return <>вподобав(-ла) ваш допис.</>;
        case 'post_comment': return <>прокоментував(-ла) ваш допис.</>;
        case 'track_like': return <>вподобав(-ла) трек {entityTitle && <strong>«{entityTitle}»</strong>}.</>;
        case 'comment_like': return <>вподобав(-ла) ваш коментар.</>;
        case 'mention_post': return <>згадав(-ла) вас у дописі.</>;
        case 'report_update': {
            const action = notification?.action;
            return action === 'resolved'
                ? <>розглянула вашу скаргу і вжила заходів. Натисніть, щоб дізнатись деталі.</>
                : <>розглянула вашу скаргу. Натисніть, щоб дізнатись результат.</>;
        }
        case 'gift_received': {
            const giftName = typeof entityTitle === 'object'
                ? (entityTitle?.uk || entityTitle?.en || 'Подарунок')
                : (entityTitle || 'Подарунок');
            return <>надіслав(-ла) вам <strong>{giftName}</strong>.</>;
        }
        default: return <>взаємодіяв(-ла) з вашим контентом.</>;
    }
};

const NotificationItem = ({ notification, onRead }) => {
    const { fromUser, type, entityTitle, entityThumbnail, timestamp, read } = notification;

    // report_update — системне сповіщення, без fromUser
    const isSystemNotif = type === 'report_update';
    if (!fromUser && !isSystemNotif) return null;

    const meta = TYPE_META[type] || { color: '#6b7280', Icon: IconHeart, label: 'Активність' };
    const { Icon } = meta;

    const handleClick = () => {
        if (onRead) onRead(notification);
    };

    return (
        <div
            className={`notif-item ${!read ? 'notif-item--unread' : ''}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleClick()}
        >
            {/* Avatar + type badge */}
            <div className="notif-item-avatar-wrap">
                {isSystemNotif ? (
                    <div className="notif-item-system-avatar">
                        <IconShield />
                    </div>
                ) : (
                    <img
                        src={fromUser.photoURL || default_picture}
                        alt={fromUser.nickname}
                        className="notif-item-avatar"
                        onError={e => { e.target.onerror = null; e.target.src = default_picture; }}
                    />
                )}
                <span className="notif-item-type-badge" style={{ backgroundColor: meta.color }}>
                    <Icon />
                </span>
            </div>

            {/* Text body */}
            <div className="notif-item-body">
                <p className="notif-item-text">
                    <span className="notif-item-username">
                        {isSystemNotif ? 'Knitly Safety' : `@${fromUser.nickname}`}
                        {/* 🔮 кастомні емоджі тут у майбутньому */}
                        {!isSystemNotif && fromUser?.roles?.includes('verified') && <VerifiedBadge size="xs" />}
                    </span>
                    {' '}{renderText(type, entityTitle, notification)}
                </p>
                <div className="notif-item-meta">
                    <span className="notif-item-time">{formatTime(timestamp)}</span>
                    <span className="notif-item-type-label" style={{ color: meta.color }}>{meta.label}</span>
                </div>
            </div>

            {/* Optional entity thumbnail */}
            {entityThumbnail && (
                <img src={entityThumbnail} alt="" className="notif-item-thumbnail" />
            )}

            {/* Chevron */}
            <span className="notif-item-chevron"><IconChevron /></span>

            {/* Unread indicator */}
            {!read && <span className="notif-item-unread-dot" />}
        </div>
    );
};

export default NotificationItem;
