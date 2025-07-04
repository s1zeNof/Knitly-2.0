import React, { useState } from 'react';
import './EditUserRolesModal.css';

// Список всіх можливих ролей у вашій системі
const AVAILABLE_ROLES = ['user', 'moderator', 'admin'];

const EditUserRolesModal = ({ user, onSave, onClose }) => {
    // Ініціалізуємо стан з поточними ролями користувача
    const [selectedRoles, setSelectedRoles] = useState(user.roles || []);

    const handleRoleChange = (role) => {
        // Створюємо новий масив ролей на основі того, чи була відмічена галочка
        const newRoles = selectedRoles.includes(role)
            ? selectedRoles.filter(r => r !== role) // Видалити роль, якщо вона вже є
            : [...selectedRoles, role]; // Додати роль, якщо її немає
        setSelectedRoles(newRoles);
    };

    const handleSaveChanges = () => {
        onSave(user.id, selectedRoles);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">Редагувати ролі для {user.displayName}</h2>
                <div className="roles-checkbox-group">
                    {AVAILABLE_ROLES.map(role => (
                        <label key={role} className="role-checkbox-label">
                            <input
                                type="checkbox"
                                value={role}
                                checked={selectedRoles.includes(role)}
                                onChange={() => handleRoleChange(role)}
                            />
                            <span className="role-name">{role}</span>
                        </label>
                    ))}
                </div>
                <div className="modal-actions">
                    <button className="modal-button secondary" onClick={onClose}>Скасувати</button>
                    <button className="modal-button primary" onClick={handleSaveChanges}>Зберегти зміни</button>
                </div>
            </div>
        </div>
    );
};

export default EditUserRolesModal;