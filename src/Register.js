import React, { useState } from 'react';
import { auth } from './firebase'; // Імпортуйте auth з вашого файлу firebase.js

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async (event) => {
        event.preventDefault(); // Зупинити стандартну поведінку форми
      
        try {
          const userCredential = await auth.createUserWithEmailAndPassword(email, password);
          console.log(userCredential); // Інформація про користувача, якщо реєстрація успішна
        } catch (error) {
          console.error("Error in registration: ", error.message); // Вивести помилку, якщо така є
        }
      };

    return (
        <div>
            {/* Форма реєстрації */}
        </div>
    );
};

export default Register;
