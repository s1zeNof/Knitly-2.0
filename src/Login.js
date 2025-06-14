import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const GoogleIcon = () => <svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.999,36.526,44,30.861,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>;

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (event) => {
        event.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/profile');
        } catch (error) {
            console.error("Login Error:", error.code, error.message);
            setError("Неправильна електронна пошта або пароль.");
        }
    };

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        setError('');
        try {
            await signInWithPopup(auth, provider);
            navigate('/profile');
        } catch (error) {
            console.error("Google Sign-In Error:", error.code, error.message);
            if (error.code === 'auth/popup-closed-by-user') {
                setError("Вікно входу було закрито. Спробуйте ще раз.");
            } else {
                setError("Не вдалося увійти через Google. Перевірте консоль.");
            }
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-form-wrapper">
                <div className="auth-header">
                    <h1>Вхід у Knitly</h1>
                    <p>Продовжуйте творити та ділитися музикою.</p>
                </div>
                {error && <p className="auth-error">{error}</p>}
                <form onSubmit={handleLogin} className="auth-form">
                    <input 
                        type="email" 
                        placeholder="Електронна пошта"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-input"
                        required
                    />
                    <button type="submit" className="auth-submit-button">Увійти</button>
                </form>
                <div className="auth-divider">або</div>
                <button onClick={handleGoogleSignIn} className="auth-social-button">
                    <GoogleIcon />
                    Продовжити з Google
                </button>
                <p className="auth-switch-link">
                    Не маєте акаунту? <Link to="/register">Зареєструватися</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;