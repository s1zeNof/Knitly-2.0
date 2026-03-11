/**
 * RoomChat.jsx — real-time room chat
 * Auto-scrolls to newest message, shows system events differently.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import default_picture from '../../img/Default-Images/default-picture.svg';
import './RoomChat.css';

const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
);

const EmojiIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
);

const QUICK_REACTIONS = ['🔥', '🎵', '❤️', '👏', '😮', '🎸'];

/* Format timestamp */
const fmtTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
};

const ChatMessage = ({ msg, currentUserId }) => {
    if (msg.type === 'system') {
        return (
            <div className="rchat-system-msg">
                <span>{msg.text}</span>
            </div>
        );
    }

    const isOwn = msg.senderId === currentUserId;

    return (
        <div className={`rchat-msg${isOwn ? ' rchat-msg--own' : ''}`}>
            {!isOwn && (
                <img
                    className="rchat-avatar"
                    src={msg.senderPhotoURL || default_picture}
                    alt={msg.senderDisplayName}
                    onError={(e) => { e.target.src = default_picture; }}
                />
            )}
            <div className="rchat-bubble-group">
                {!isOwn && (
                    <span className="rchat-sender">{msg.senderDisplayName}</span>
                )}
                <div className="rchat-bubble">
                    <p className="rchat-text">{msg.text}</p>
                    <span className="rchat-time">{fmtTime(msg.timestamp)}</span>
                </div>
            </div>
        </div>
    );
};

const RoomChat = ({ messages, currentUserId, onSendMessage }) => {
    const [text, setText] = useState('');
    const [showReactions, setShowReactions] = useState(false);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const inputRef  = useRef(null);

    /* Auto-scroll */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = useCallback(async () => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;
        setSending(true);
        setText('');
        try {
            await onSendMessage(trimmed);
        } catch (e) {
            console.error('[RoomChat] send error:', e);
            setText(trimmed); // restore on failure
        } finally {
            setSending(false);
        }
        inputRef.current?.focus();
    }, [text, sending, onSendMessage]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const sendReaction = (emoji) => {
        onSendMessage(emoji);
        setShowReactions(false);
    };

    return (
        <div className="rchat-root">
            {/* Messages list */}
            <div className="rchat-messages">
                {messages.length === 0 && (
                    <p className="rchat-empty">Будь першим — напиши щось! 👋</p>
                )}
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} msg={msg} currentUserId={currentUserId} />
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Quick reactions */}
            {showReactions && (
                <div className="rchat-reactions">
                    {QUICK_REACTIONS.map((e) => (
                        <button key={e} className="rchat-reaction-btn" onClick={() => sendReaction(e)}>
                            {e}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="rchat-input-row">
                <button
                    className="rchat-emoji-btn"
                    onClick={() => setShowReactions((s) => !s)}
                    aria-label="Реакції"
                    title="Швидкі реакції"
                >
                    <EmojiIcon />
                </button>
                <input
                    ref={inputRef}
                    className="rchat-input"
                    type="text"
                    placeholder="Повідомлення…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={500}
                />
                <button
                    className="rchat-send-btn"
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    aria-label="Надіслати"
                >
                    <SendIcon />
                </button>
            </div>
        </div>
    );
};

export default RoomChat;
