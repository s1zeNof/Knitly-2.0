import React from 'react';
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from '../../services/firebase';
import './UserManagementTable.css';
import default_picture from '../../img/Default-Images/default-picture.svg';

// --- ПОЧАТОК ЗМІН: Приймаємо новий prop 'onEditRoles' ---
const UserManagementTable = ({ users, onActionSuccess, onEditRoles }) => {
// --- КІНЕЦЬ ЗМІН ---

    const toggleBanStatus = async (user) => {
        const newBanStatus = !(user.status?.isBanned || false);
        const action = newBanStatus ? 'забанити' : 'розбанити';

        if (!window.confirm(`Ви впевнені, що хочете ${action} користувача ${user.displayName}?`)) {
            return;
        }

        const userRef = doc(db, 'users', user.id);
        try {
            await updateDoc(userRef, {
                "status.isBanned": newBanStatus
            });
            alert(`Користувача успішно ${action}но.`);
            onActionSuccess();
        } catch (error) {
            console.error(`Помилка:`, error);
            alert(`Не вдалося виконати дію: ${error.message}`);
        }
    };

    const handleDeleteUserDoc = async (user) => {
        if (!window.confirm(`УВАГА! Ви видаляєте лише запис користувача "${user.displayName}" з бази даних. Його акаунт для входу залишиться. Продовжити?`)) {
            return;
        }

        const userRef = doc(db, 'users', user.id);
        try {
            await deleteDoc(userRef);
            alert('Документ користувача видалено.');
            onActionSuccess();
        } catch (error) {
            console.error(`Помилка видалення документа:`, error);
            alert(`Не вдалося видалити документ: ${error.message}`);
        }
    };

    return (
        <div className="table-container">
            <table className="user-table">
                <thead>
                    <tr>
                        <th>Користувач</th>
                        <th>Email</th>
                        <th>Ролі</th>
                        <th>Статус</th>
                        <th>Дата реєстрації</th>
                        <th>Дії</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td data-label="Користувач">
                                <div className="user-info-cell">
                                    <img 
                                        src={user.photoURL || default_picture} 
                                        alt={user.displayName} 
                                        className="user-avatar-table"
                                    />
                                    <div className="user-details-table">
                                        <span>{user.displayName || 'N/A'}</span>
                                        <small>@{user.nickname}</small>
                                    </div>
                                </div>
                            </td>
                            <td data-label="Email">{user.email}</td>
                            <td data-label="Ролі">
                                <div className="roles-container">
                                    {user.roles?.length > 0 
                                        ? user.roles.map(role => <span key={role} className={`role-badge ${role}`}>{role}</span>)
                                        : <span className="role-badge">user</span>
                                    }
                                </div>
                            </td>
                            <td data-label="Статус">
                                {user.status?.isBanned 
                                    ? <span className="status-badge banned">Забанений</span>
                                    : <span className="status-badge active">Активний</span>
                                }
                            </td>
                            <td data-label="Дата реєстрації">{user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                            <td data-label="Дії">
                                <div className="action-buttons">
                                    {/* --- ПОЧАТОК ЗМІН: Нова кнопка --- */}
                                    <button className="edit" onClick={() => onEditRoles(user)}>
                                        Ролі
                                    </button>
                                    {/* --- КІНЕЦЬ ЗМІН --- */}
                                    <button onClick={() => toggleBanStatus(user)}>
                                        {user.status?.isBanned ? 'Розбанити' : 'Забанити'}
                                    </button>
                                    <button className="delete" onClick={() => handleDeleteUserDoc(user)}>
                                        Видалити (DB)
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagementTable;