import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import UserManagementTable from './UserManagementTable';
import EditUserRolesModal from './EditUserRolesModal'; // <-- ІМПОРТ
import './AdminPage.css';

const fetchUsers = async () => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

const AdminPage = () => {
    const queryClient = useQueryClient();
    const { data: users, isLoading, error } = useQuery('allUsers', fetchUsers);

    // --- ПОЧАТОК ЗМІН: Стан для модального вікна ---
    const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    // --- КІНЕЦЬ ЗМІН ---

    const refetchUsers = () => {
        queryClient.invalidateQueries('allUsers');
    };

    // --- ПОЧАТОК ЗМІН: Функції для управління модальним вікном ---
    const handleOpenRolesModal = (user) => {
        setSelectedUser(user);
        setIsRolesModalOpen(true);
    };

    const handleCloseRolesModal = () => {
        setIsRolesModalOpen(false);
        setSelectedUser(null);
    };

    const handleSaveRoles = async (userId, newRoles) => {
        const userRef = doc(db, 'users', userId);
        try {
            await updateDoc(userRef, { roles: newRoles });
            alert('Ролі користувача успішно оновлено.');
            refetchUsers();
        } catch (err) {
            console.error("Помилка оновлення ролей:", err);
            alert(`Не вдалося оновити ролі: ${err.message}`);
        } finally {
            handleCloseRolesModal();
        }
    };
    // --- КІНЕЦЬ ЗМІН ---

    if (isLoading) {
        return <div className="admin-page-loader">Завантаження користувачів...</div>;
    }

    if (error) {
        return <div className="admin-page-error">Помилка: {error.message}. Переконайтесь, що ви адміністратор і правила безпеки оновлено.</div>;
    }

    return (
        <div className="admin-page-container">
            <header className="admin-page-header">
                <h1>Панель Адміністратора</h1>
                <p>Керування користувачами платформи Knitly.</p>
            </header>
            
            <UserManagementTable 
                users={users} 
                onActionSuccess={refetchUsers}
                onEditRoles={handleOpenRolesModal} // <-- ПЕРЕДАЄМО ФУНКЦІЮ
            />

            {/* --- ПОЧАТОК ЗМІН: Відображення модального вікна --- */}
            {isRolesModalOpen && selectedUser && (
                <EditUserRolesModal
                    user={selectedUser}
                    onClose={handleCloseRolesModal}
                    onSave={handleSaveRoles}
                />
            )}
            {/* --- КІНЕЦЬ ЗМІН --- */}
        </div>
    );
};

export default AdminPage;