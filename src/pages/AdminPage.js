import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import UserManagementTable from '../components/admin/UserManagementTable';
import EditUserRolesModal from '../components/common/EditUserRolesModal';
import GiftManagement from '../components/admin/GiftManagement'; // <-- ІМПОРТ
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

    const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const refetchUsers = () => {
        queryClient.invalidateQueries('allUsers');
    };

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
                <p>Керування користувачами та контентом платформи Knitly.</p>
            </header>
            
            {/* Додаємо новий блок керування подарунками */}
            <GiftManagement />
            
            <h2 style={{marginTop: '3rem'}}>Керування користувачами</h2>
            <UserManagementTable 
                users={users} 
                onActionSuccess={refetchUsers}
                onEditRoles={handleOpenRolesModal}
            />

            {isRolesModalOpen && selectedUser && (
                <EditUserRolesModal
                    user={selectedUser}
                    onClose={handleCloseRolesModal}
                    onSave={handleSaveRoles}
                />
            )}
        </div>
    );
};

export default AdminPage;