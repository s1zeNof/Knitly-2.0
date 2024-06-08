import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';


const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    //const auth = getAuth();

    const handleLogin = async (event) => {
        event.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log(userCredential);
            // Обробка успішного входу
        } catch (error) {
            console.error("Error in login: ", error.message);
            // Обробка помилок
        }
    };

    const handleGoogleSignIn = async () => {
        
        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            navigate('/');
            console.log(userCredential);
            // Обробка успішного входу через Google
        } catch (error) {
            console.error("Error in Google sign-in: ", error.message);
            // Обробка помилок
        }
    };

    return (
        <div>
            <h2>Логін</h2>
            <form onSubmit={handleLogin}>
                <input 
                    type="text" 
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input 
                    type="password" 
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Увійти</button>
            </form>
            <button onClick={handleGoogleSignIn}>Увійти через Google</button>
        </div>
    );
};

export default Login;
