import React from 'react';
import './GroupInfoPanel.css';
import default_picture from './img/Default-Images/default-picture.svg';

const EditIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;

const GroupInfoPanel = ({ conversation, onClose, currentUser }) => {
    if (!conversation || !conversation.isGroup) return null;

    const admins = conversation.admins || [];
    const isCurrentUserAdmin = admins.includes(currentUser.uid);

    return (
        <div className="info-panel-overlay" onClick={onClose}>
            <div className="info-panel" onClick={e => e.stopPropagation()}>
                <div className="info-panel-header">
                    <h4>Про групу</h4>
                    <button onClick={onClose}>&times;</button>
                </div>
                <div className="info-panel-content">
                    <div className="group-main-info">
                        <img src={conversation.groupPhotoURL || default_picture} alt={conversation.groupName} className="group-info-avatar" />
                        <div className="group-info-name-container">
                             <h2>{conversation.groupName}</h2>
                             {isCurrentUserAdmin && <button className="edit-group-button" title="Редагувати"><EditIcon /></button>}
                        </div>
                        <p>{conversation.participants.length} учасників</p>
                    </div>

                    <div className="info-section">
                        <p className="info-section-title">УЧАСНИКИ</p>
                        <div className="members-list">
                            {conversation.participantInfo.map(member => (
                                <div key={member.uid} className="member-item">
                                    <img src={member.photoURL || default_picture} alt={member.displayName} />
                                    <div className="member-details">
                                        <p className="member-name">{member.displayName}</p>
                                        {admins.includes(member.uid) && <p className="member-role admin">адмін</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupInfoPanel;