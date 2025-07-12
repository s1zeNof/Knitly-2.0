import React, { useState, useEffect } from 'react';
import { useUserContext } from '../../contexts/UserContext';
import { db } from '../../shared/services/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, documentId } from 'firebase/firestore';
import './CreateGroupModal.css';
import default_picture from '../../img/Default-Images/default-picture.svg';

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
    const { user: currentUser } = useUserContext();
    const [followers, setFollowers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!currentUser?.following || currentUser.following.length === 0) return;

        const fetchFollowers = async () => {
            const followingIds = currentUser.following;
            const chunks = [];
            for (let i = 0; i < followingIds.length; i += 10) {
                chunks.push(followingIds.slice(i, i + 10));
            }
            
            const followersPromises = chunks.map(chunk =>
                getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)))
            );

            const allFollowersSnapshots = await Promise.all(followersPromises);
            
            const followersList = allFollowersSnapshots.flatMap(snapshot =>
                snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
            );

            setFollowers(followersList);
        };

        fetchFollowers();
    }, [currentUser]);

    const handleToggleMember = (member) => {
        setSelectedMembers(prev => 
            prev.some(m => m.uid === member.uid)
                ? prev.filter(m => m.uid !== member.uid)
                : [...prev, member]
        );
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedMembers.length < 1) {
            alert("Будь ласка, вкажіть назву групи та оберіть хоча б одного учасника.");
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
        
        // Створюємо об'єкт лічильників
        const unreadCounts = {};
        participantIds.forEach(id => {
            unreadCounts[id] = 0;
        });

        try {
            const newChatRef = doc(collection(db, 'chats'));
            await setDoc(newChatRef, {
                isGroup: true,
                groupName: groupName,
                participants: participantIds,
                participantInfo: participantInfo,
                admins: [currentUser.uid],
                createdBy: currentUser.uid,
                lastMessage: {
                    text: `${currentUser.displayName || 'Користувач'} створив(ла) групу "${groupName}"`,
                    senderId: 'system',
                },
                lastUpdatedAt: serverTimestamp(),
                unreadCounts: unreadCounts, // <-- ДОДАНО НОВЕ ПОЛЕ
            });
            onGroupCreated(newChatRef.id);
        } catch (error) {
            console.error("Помилка створення групи:", error);
            alert("Не вдалося створити групу.");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredFollowers = followers.filter(f => 
        (f.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.nickname || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <input
                        type="text"
                        className="form-input search-users-input"
                        placeholder="Пошук серед тих, на кого ви підписані..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="followers-list">
                        {filteredFollowers.length > 0 ? filteredFollowers.map(follower => (
                            <div key={follower.uid} className="follower-item" onClick={() => handleToggleMember(follower)}>
                                <input
                                    type="checkbox"
                                    checked={selectedMembers.some(m => m.uid === follower.uid)}
                                    readOnly
                                />
                                <img src={follower.photoURL || default_picture} alt={follower.displayName} />
                                <div className="follower-info">
                                    <p className="follower-name">{follower.displayName}</p>
                                    <p className="follower-nickname">@{follower.nickname}</p>
                                </div>
                            </div>
                        )) : <p className="no-followers-message">Ви ще ні на кого не підписані.</p>}
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="modal-button-cancel" onClick={onClose}>Скасувати</button>
                    <button className="modal-button-confirm" onClick={handleCreateGroup} disabled={isLoading || !groupName.trim() || selectedMembers.length === 0}>
                        {isLoading ? 'Створення...' : 'Створити групу'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;