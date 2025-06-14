import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserContext } from './UserContext';
import { db } from './firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import './Home.css';
import default_picture from './img/Default-Images/default-picture.svg';

// Іконки (можна залишити або замінити на бібліотеку)
const HomeIcon = () => '🏠';
const DiscoverIcon = () => '🧭';
const SettingsIcon = () => '⚙️';

const Home = () => {
    const { user } = useUserContext();
    const [suggestedUsers, setSuggestedUsers] = useState([]);

    // Цей хук керує стилем фону для сторінки Home
    useEffect(() => {
        // Додаємо клас до body, коли компонент монтується
        document.body.classList.add('home-page-background');

        // Прибираємо клас, коли компонент демонтується (перехід на іншу сторінку)
        return () => {
            document.body.classList.remove('home-page-background');
        };
    }, []); // Порожній масив означає, що ефект виконається лише один раз

    // Завантажуємо користувачів для правого сайдбару
    useEffect(() => {
        const fetchUsers = async () => {
            if (!user || !user.uid) {
                setSuggestedUsers([]);
                return;
            }

            try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, limit(10));
                const querySnapshot = await getDocs(q);
                
                const allUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const filteredUsers = allUsers
                    .filter(suggestedUser => 
                        suggestedUser.id !== user.uid && 
                        suggestedUser.nickname 
                    )
                    .slice(0, 5);

                setSuggestedUsers(filteredUsers);
            } catch (error) {
                console.error("Помилка під час завантаження користувачів:", error);
                setSuggestedUsers([]);
            }
        };

        fetchUsers();
    }, [user]);

    return (
        <div className="home-container">
            {/* --- Ліва колонка (Сайдбар) --- */}
            <aside className="left-sidebar">
                <nav className="sidebar-nav">
                    <Link to="/" className="nav-item active"><HomeIcon /> Home</Link>
                    <Link to="/userlist" className="nav-item"><DiscoverIcon /> Discover</Link>
                </nav>
                {user ? (
                    <div className="sidebar-profile">
                        <Link to="/profile" className="profile-link-card">
                            <img src={user.photoURL || default_picture} alt="Avatar" className="profile-avatar" />
                            <div className="profile-info">
                                <span className="profile-name">{user.displayName || 'My Profile'}</span>
                                <span className="profile-nickname">@{user.nickname || 'nickname'}</span>
                            </div>
                        </Link>
                        <Link to="/settings" className="nav-item"><SettingsIcon /> Settings</Link>
                    </div>
                ) : (
                    <div className="sidebar-login-prompt">
                        <p>Log in or Sign up to see your profile and feed.</p>
                        <Link to="/login" className="login-button">Log In</Link>
                    </div>
                )}
            </aside>

            {/* --- Центральна колонка (Основний контент) --- */}
            <main className="main-content">
                <div className="content-header">
                    <h2>Feed</h2>
                    <div className="feed-tabs">
                        <button className="tab-button active">For You</button>
                        <button className="tab-button">Following</button>
                    </div>
                </div>
                <div className="content-card">
                    <div className="card-image-placeholder" style={{backgroundImage: `url('https://via.placeholder.com/600x250/1A1A1A/FFFFFF?text=New+Release')`}}></div>
                    <div className="card-body">
                        <h3>New Release: 'Midnight Bloom' by Ava Harris</h3>
                        <p>The artist's newest single explores themes of love and loss with a haunting melody.</p>
                        <button className="listen-now-btn">Listen Now</button>
                    </div>
                </div>
                <div className="content-card">
                     <div className="card-image-placeholder" style={{backgroundImage: `url('https://via.placeholder.com/600x250/1A1A1A/FFFFFF?text=Trending+Now')`}}></div>
                    <div className="card-body">
                        <h3>Trending Now</h3>
                        <p>Check out the most popular tracks and rising stars on Knitly this week.</p>
                    </div>
                </div>
            </main>

            {/* --- Права колонка --- */}
            <aside className="right-sidebar">
                <h4>Suggested for you</h4>
                <div className="friend-list">
                    {suggestedUsers.length > 0 ? (
                        suggestedUsers.map(suggestedUser => (
                            <Link to={`/user/${suggestedUser.nickname}`} key={suggestedUser.id} className="friend-item">
                                <img src={suggestedUser.photoURL || default_picture} alt={suggestedUser.displayName || 'Користувач'} />
                                <span>{suggestedUser.displayName || suggestedUser.nickname}</span>
                            </Link>
                        ))
                    ) : (
                        <p>Немає пропозицій.</p>
                    )}
                </div>
            </aside>
        </div>
    );
};

export default Home;