import React, { useState } from 'react';
import './PinnedMessagesBar.css';

const PinIcon = () => <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;

const PinnedMessagesBar = ({ pinnedMessages, onMessageSelect }) => {
    const [showList, setShowList] = useState(false);

    if (!pinnedMessages || pinnedMessages.length === 0) {
        return null;
    }

    const latestPin = pinnedMessages[pinnedMessages.length - 1];

    return (
        <div className="pinned-bar-container">
            <div className="pinned-bar-main" onClick={() => setShowList(!showList)}>
                <PinIcon />
                <div className="pinned-bar-info">
                    <p className="pinned-bar-title">Закріплені повідомлення ({pinnedMessages.length})</p>
                    <p className="pinned-bar-content">{latestPin.content}</p>
                </div>
            </div>
            {showList && (
                <div className="pinned-list-overlay">
                    <div className="pinned-list">
                        {pinnedMessages.map((pin, index) => (
                            <div key={index} className="pinned-list-item" onClick={() => { onMessageSelect(pin.messageId); setShowList(false); }}>
                                <p className="pinned-list-sender">{pin.senderName}</p>
                                <p className="pinned-list-content">{pin.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PinnedMessagesBar;