import React, { useState } from 'react';
import { useUserContext } from '../../contexts/UserContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import './CreateGroupModal.css';
import default_picture from '../../img/Default-Images/default-picture.svg';

const LockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
    const { user: currentUser } = useUserContext();
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // Map of uid -> 'allowed' | 'blocked' | 'following_only'
    const [privacyMap, setPrivacyMap] = useState({});

    const handleSearch = async (term) => {
        setSearchTerm(term);
        if (term.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            // Firestore prefix search by nickname
            const q = query(
                collection(db, 'users'),
                where('nickname', '>=', term.toLowerCase()),
                where('nickname', '<=', term.toLowerCase() + '\uf8ff')
            );
            const snap = await getDocs(q);
            const results = snap.docs
                .map(d => ({ uid: d.id, ...d.data() }))
                .filter(u => u.uid !== currentUser.uid);
            setSearchResults(results);

            // For each result, check groupInvitePrivacy vs currentUser
            const newPrivacyMap = {};
            for (const u of results) {
                const privacy = u.settings?.privacy?.groupInvitePrivacy || 'everyone';
                if (privacy === 'everyone') {
                    newPrivacyMap[u.uid] = 'allowed';
                } else if (privacy === 'following') {
                    // Check if the target user follows currentUser (i.e., currentUser is in their following list)
                    const allowed = u.following?.includes(currentUser.uid) ||
                        currentUser.following?.includes(u.uid);
                    newPrivacyMap[u.uid] = allowed ? 'allowed' : 'following_only';
                } else {
                    // nobody — check if requests allowed
                    newPrivacyMap[u.uid] = 'blocked';
                }
            }
            setPrivacyMap(newPrivacyMap);
        } catch (err) {
            console.error('Пошук користувачів:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleToggleMember = (member) => {
        const status = privacyMap[member.uid];
        if (status === 'blocked') {
            toast.error(`${member.displayName} не приймає запрошення в групи.`);
            return;
        }
        if (status === 'following_only') {
            toast.error(`${member.displayName} приймає запрошення лише від тих, на кого підписаний.`);
            return;
        }
        setSelectedMembers(prev =>
            prev.some(m => m.uid === member.uid)
                ? prev.filter(m => m.uid !== member.uid)
                : [...prev, member]
        );
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedMembers.length < 1) {
            toast.error('Вкажіть назву групи та оберіть хоча б одного учасника.');
            return;
        }
        setIsLoading(true);

        const allParticipants = [currentUser, ...selectedMembers];
        const participantIds = allParticipants.map(p => p.uid);
        const participantInfo = allParticipants.map(p => ({
            uid: p.uid,
            displayName: p.displayName || 'Користувач',
            photoURL: p.photoURL || null,
        }));
        const unreadCounts = {};
        participantIds.forEach(id => { unreadCounts[id] = 0; });

        try {
            const newChatRef = doc(collection(db, 'chats'));
            await setDoc(newChatRef, {
                isGroup: true,
                groupName,
                participants: participantIds,
                participantInfo,
                admins: [currentUser.uid],
                createdBy: currentUser.uid,
                lastMessage: {
                    text: `${currentUser.displayName || 'Користувач'} створив(ла) групу "${groupName}"`,
                    senderId: 'system',
                },
                lastUpdatedAt: serverTimestamp(),
                unreadCounts,
            });
            onGroupCreated(newChatRef.id);
        } catch (error) {
            console.error('Помилка створення групи:', error);
            toast.error('Не вдалося створити групу.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content create-group-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h4>Нова група</h4>
                    <button onClick={onClose} className="modal-close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <input
                        type="text"
                        className="form-input group-name-input"
                        placeholder="Назва групи"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                    />

                    {/* Selected members chips */}
                    {selectedMembers.length > 0 && (
                        <div className="selected-members-chips">
                            {selectedMembers.map(m => (
                                <span key={m.uid} className="member-chip" onClick={() => handleToggleMember(m)}>
                                    <img src={m.photoURL || default_picture} alt={m.displayName} />
                                    {m.displayName}
                                    <span className="chip-remove">×</span>
                                </span>
                            ))}
                        </div>
                    )}

                    <input
                        type="text"
                        className="form-input search-users-input"
                        placeholder="Пошук будь-якого користувача за нікнеймом..."
                        value={searchTerm}
                        onChange={e => handleSearch(e.target.value)}
                    />
                    {isSearching && <p className="search-hint">Пошук...</p>}
                    {!isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
                        <p className="no-followers-message">Користувачів не знайдено.</p>
                    )}
                    {searchTerm.length < 2 && (
                        <p className="search-hint">Введіть мінімум 2 символи для пошуку.</p>
                    )}

                    <div className="followers-list">
                        {searchResults.map(user => {
                            const status = privacyMap[user.uid];
                            const isSelected = selectedMembers.some(m => m.uid === user.uid);
                            const isBlocked = status === 'blocked' || status === 'following_only';
                            return (
                                <div
                                    key={user.uid}
                                    className={`follower-item ${isBlocked ? 'blocked' : ''}`}
                                    onClick={() => handleToggleMember(user)}
                                    title={isBlocked ? 'Цей користувач обмежив запрошення в групи' : ''}
                                >
                                    <input type="checkbox" checked={isSelected} readOnly disabled={isBlocked} />
                                    <img src={user.photoURL || default_picture} alt={user.displayName} />
                                    <div className="follower-info">
                                        <p className="follower-name">
                                            {user.displayName}
                                            {isBlocked && <LockIcon />}
                                        </p>
                                        <p className="follower-nickname">@{user.nickname}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="modal-button-cancel" onClick={onClose}>Скасувати</button>
                    <button
                        className="modal-button-confirm"
                        onClick={handleCreateGroup}
                        disabled={isLoading || !groupName.trim() || selectedMembers.length === 0}
                    >
                        {isLoading ? 'Створення...' : `Створити групу${selectedMembers.length > 0 ? ` (${selectedMembers.length})` : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;