import React from 'react';
import { Link } from 'react-router-dom';
import { useUserContext } from './UserContext';
import default_picture from './img/Default-Images/default-picture.svg';
import './MessagesHeader.css';

const SearchIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

const MessagesHeader = ({ isExpanded }) => {
    const { user } = useUserContext();

    return (
        <div className={`messages-header-mobile ${isExpanded ? 'expanded' : ''}`}>
            <div className="messages-header-top-row">
                <div className={`logo-container ${isExpanded ? 'visible' : ''}`}>
                    <Link to="/" className="header-logo">Knitly</Link>
                </div>
                <h2 className="messages-header-title">Чати</h2>
                <div className="avatar-container">
                    <Link to="/profile">
                        <img src={user?.photoURL || default_picture} alt="Avatar" />
                    </Link>
                </div>
            </div>
            <div className="messages-header-search-bar">
                <SearchIcon />
                <input type="text" placeholder="Пошук" />
            </div>
        </div>
    );
};

export default MessagesHeader;