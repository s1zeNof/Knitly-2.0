import React, { useState } from 'react';

const Room = () => {
    const [roomName, setRoomName] = useState('');

    const handleCreateRoom = () => {
        // Логіка для створення кімнати
        console.log("Створена кімната: ", roomName);
        setRoomName('');
    };

    return (
        <div>
            <h2>Створити кімнату</h2>
            <input 
                type="text" 
                placeholder="Назва кімнати" 
                value={roomName} 
                onChange={(e) => setRoomName(e.target.value)} 
            />
            <button onClick={handleCreateRoom}>Створити</button>

            {/* Тут може бути список доступних кімнат */}
        </div>
    );
};

export default Room;
