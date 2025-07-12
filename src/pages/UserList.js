// UserList.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../shared/services/firebase';
import { useUserContext } from '../contexts/UserContext'; // Ensure this is correctly imported
import default_picture from '../img/Default-Images/default-picture.svg';
import verifiedIcon from '../img/Profile-Settings/verified_icon-lg-bl.svg';
import './UserList.css'; // Assuming you have a CSS file for UserList
import '../styles/Global.css';


const UserList = () => {
    const [users, setUsers] = useState([]);
    const [followingUsers, setFollowingUsers] = useState([]);
    const { user: currentUser } = useUserContext();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersCollectionRef = collection(db, 'users');
                const usersSnapshot = await getDocs(usersCollectionRef);
                const usersList = usersSnapshot.docs.map(doc => ({
                    id: doc.id, 
                    ...doc.data()
                }));
                setUsers(usersList);

                // Відфільтруйте користувачів, на яких підписаний поточний користувач
                const myFollowingUsers = usersList.filter(user => currentUser.following.includes(user.id));
                setFollowingUsers(myFollowingUsers);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, [currentUser]);

    return (
        <div className="settings-container">
            <aside className="sidebar sidebar-background">
                <h3>You are Following</h3>
                <div className="sidebar-content">
                {followingUsers.map((user) => (
                        <div key={user.id} className="user-card-in-sidebar">
                            <img src={user.photoURL || '/path/to/default-avatar.jpg'} alt={`${user.displayName || 'User'}'s Avatar`} className="sidebar-user-picture" />
                            <div>
                                {/*<p>{user.displayName || 'No Name'}</p>*/}
                                <Link to={`/user/${user.nickname || user.id}`}>
                                <p>
                                    @{user.nickname || user.id}
                                    {user.isVerified && <img src={verifiedIcon} className="verified-badge" alt="Verified" />}
                                </p>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
            <main className="settings-content">
                <div className="settings-section">
                    <h2>Registered Users</h2>
                    <div className="user-list">
                        {users.map((user) => (
                            <div key={user.id} className="user-card">
                               {/*<img src={user.photoURL || '/path/to/default-avatar.jpg'} alt={`${user.displayName || 'User'}'s Avatar`} className="profile-picture" />*/}
                               <img 
                                src={user.photoURL || default_picture} 
                                alt={`${user.displayName || 'User'}'s Avatar`} 
                                className="profile-picture" 
                            />
                                <div className="user-list-info">
                        <h3>
                            {currentUser && user.id === currentUser.uid ? 
                                <Link to="/profile">
                                    <>{user.displayName || 'No Name'}{user.isVerified && <img src={verifiedIcon} className="verified-badge" alt="Verified" />}</>
                                </Link> : 
                                <Link to={`/user/${user.nickname || user.id}`}>
                                    <>{user.displayName || 'No Name'}{user.isVerified && <img src={verifiedIcon} className="verified-badge" alt="Verified" />}</>
                                </Link>
                            }
                        </h3>
                        <p>@{user.nickname || user.id}</p>
                    </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserList;
