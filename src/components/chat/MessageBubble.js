import React, { useRef, useState } from 'react';
import { usePlayerContext } from '../../contexts/PlayerContext';
import LottieRenderer from '../common/LottieRenderer';
import default_picture from '../../img/Default-Images/default-picture.svg';
import './MessageBubble.css';
import SharedPostAttachment from './SharedPostAttachment';

/* ─── tiny inline icons ─── */
const PlayIcon = () => <svg height="20" width="20" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>;
const ForwardIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12l-7.5-7.5v4.5H4v6h8.5v4.5L20 12z" /></svg>;
const EditedLabel = () => <span style={{ fontSize: '0.7rem', opacity: 0.7, marginRight: '2px' }}>ред.</span>;

/* ─── linkify helper ─── */
const Linkify = ({ text, openBrowser }) => {
    if (!text || typeof text !== 'string') return <>{text}</>;
    const urlRegex = /((https?:\/\/(www\.)?)|www\.)[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g;
    const parts = text.split(urlRegex);
    return (
        <>
            {parts.map((part, i) => {
                if (part && (part.startsWith('http') || part.startsWith('www'))) {
                    const href = part.startsWith('www.') ? `http://${part}` : part;
                    return <a key={i} href={href} onClick={e => { e.preventDefault(); openBrowser?.(href); }} target="_blank" rel="noopener noreferrer">{part}</a>;
                }
                return part;
            })}
        </>
    );
};

/* ─── shimmer avatar placeholder ─── */
const AvatarWithShimmer = ({ src, alt }) => {
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);
    return (
        <div className="message-avatar-wrapper">
            {!loaded && <div className="message-avatar-shimmer" />}
            <img
                src={(!errored && src) ? src : default_picture}
                alt={alt || ''}
                className={`message-avatar ${loaded ? 'loaded' : 'avatar-hidden'}`}
                onLoad={() => setLoaded(true)}
                onError={() => { setErrored(true); setLoaded(true); }}
            />
        </div>
    );
};

/* ─── lottie reaction wrapper ─── */
const LottieReaction = ({ url }) => (
    <div className="reaction-lottie-wrapper">
        <LottieRenderer url={url} />
    </div>
);

/* ─────────────────── MAIN COMPONENT ─────────────────── */
const MessageBubble = ({
    message,
    isSent,
    isGroup,
    senderInfo,
    selectionMode,
    isSelected,
    isDeleting,
    deleteAnimationClass,
    onContextMenu,
    onLongPress,
    onTap,
    isSavedContext,
    onReaction,
    onOpenImage,
    openBrowser,
}) => {
    const { playTrack, currentTrack, isPlaying } = usePlayerContext();
    const longPressTimer = useRef(null);

    if (!message) return null;

    /* ─── timestamp ─── */
    const ts = message.timestamp?.toDate?.();
    const timeStr = ts ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    /* ─── content ─── */
    const content = message.content;

    const handleLongPressStart = () => {
        longPressTimer.current = setTimeout(() => onLongPress?.(message), 500);
    };
    const handleLongPressEnd = () => clearTimeout(longPressTimer.current);

    const handleClick = (e) => {
        if (selectionMode) { e.preventDefault(); onTap?.(message); }
    };

    const handleCtxMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, message);
    };

    /* ─── wrapper classes ─── */
    const wrapperClass = [
        'message-wrapper',
        isSent ? 'sent' : 'received',
        isSelected ? 'selected' : '',
        isDeleting ? (deleteAnimationClass || 'animation-vortex-out') : '',
    ].filter(Boolean).join(' ');

    const showSenderName = isGroup && !isSent && !isSavedContext;

    return (
        <div
            className={wrapperClass}
            data-message-id={message.id}
            onContextMenu={handleCtxMenu}
            onClick={handleClick}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
        >
            {/* Avatar for received messages */}
            {!isSent && !isSavedContext && (
                <AvatarWithShimmer src={senderInfo?.photoURL} alt={senderInfo?.displayName} />
            )}

            <div className="message-content-wrapper">
                {/* Sender name in group chats */}
                {showSenderName && (
                    <span className="sender-name">{senderInfo?.displayName || 'Користувач'}</span>
                )}

                <div className="message-bubble">
                    {/* Forwarded header */}
                    {message.forwardedFrom && (
                        <div className="forwarded-header">
                            <ForwardIcon />
                            <span>Переслано від {message.forwardedFrom.name}</span>
                        </div>
                    )}

                    {/* Reply preview */}
                    {message.replyTo && (
                        <div className="reply-preview-bubble">
                            <p className="reply-sender">{message.replyTo.senderName}</p>
                            <p className="reply-text">{message.replyTo.text?.substring(0, 60)}</p>
                        </div>
                    )}

                    {/* TEXT */}
                    {message.type === 'text' && typeof content === 'string' && (
                        <p><Linkify text={content} openBrowser={openBrowser} /></p>
                    )}

                    {/* IMAGE */}
                    {message.type === 'image' && content?.url && (
                        <div
                            className="image-message-content"
                            onClick={() => onOpenImage?.({ url: content.url, alt: content.originalName })}
                        >
                            <img src={content.url} alt={content.originalName || 'Зображення'} className="chat-image" />
                            {content.quality === 'hd' && <span className="hd-badge">HD</span>}
                        </div>
                    )}

                    {/* GIF */}
                    {message.type === 'image_gif' && content?.url && (
                        <div className="image-message-content">
                            <img src={content.url} alt="GIF" className="chat-gif chat-image" />
                        </div>
                    )}

                    {/* VIDEO */}
                    {message.type === 'video' && content?.url && (
                        <div className="video-message-content">
                            <video src={content.url} controls className="chat-video" />
                        </div>
                    )}

                    {/* TRACK */}
                    {message.type === 'track' && content && (
                        <div className="music-attachment-message" onClick={() => playTrack(content)}>
                            <img src={content.coverArtUrl || default_picture} alt="Обкладинка" />
                            <div className="music-info">
                                <p className="title">{content.title}</p>
                                <p className="artist">{content.artistName}</p>
                            </div>
                            {currentTrack?.id === content.id && isPlaying && <PlayIcon />}
                        </div>
                    )}

                    {/* ALBUM */}
                    {message.type === 'album' && content && (
                        <div className="album-message-card">
                            <img src={content.coverArtUrl || default_picture} alt="Альбом" />
                            <div className="album-message-info">
                                <p className="album-label">Альбом</p>
                                <p className="album-title">{content.title}</p>
                                <p className="album-author">{content.artistName}</p>
                            </div>
                        </div>
                    )}

                    {/* SHARED POST */}
                    {message.type === 'shared_post' && (
                        <>
                            {typeof content === 'string' && content && (
                                <p><Linkify text={content} openBrowser={openBrowser} /></p>
                            )}
                            <SharedPostAttachment postId={message.postId} />
                        </>
                    )}

                    {/* Metadata row */}
                    <div className="message-metadata">
                        {message.isEdited && <EditedLabel />}
                        <span>{timeStr}</span>
                    </div>
                </div>

                {/* Reactions */}
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="reactions-container">
                        {Object.entries(message.reactions).map(([reactionId, reactionData]) => {
                            if (!reactionData?.uids?.length) return null;
                            const isCustom = !reactionId.startsWith('unicode_');
                            return (
                                <div
                                    key={reactionId}
                                    className="reaction-badge"
                                    onClick={e => {
                                        e.stopPropagation();
                                        onReaction?.(message, reactionId, isCustom ? reactionData.url : null);
                                    }}
                                >
                                    {isCustom ? (
                                        reactionData.isAnimated
                                            ? <LottieReaction url={reactionData.url} />
                                            : <img src={reactionData.url} alt={reactionId} className="reaction-emoji-custom" />
                                    ) : (
                                        <span className="reaction-emoji">{reactionId.substring(8)}</span>
                                    )}
                                    <span className="reaction-count">{reactionData.uids.length}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;