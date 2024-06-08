import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './Header';
import Home from './Home'; // Ваш компонент Home
import Login from './Login';
import Register from './Register';
import Profile from './Profile'; // Ваш компонент Profile
import Settings from './Settings'; // Ваш компонент Settings
import UserList from './UserList'; // UserList вивід списку людей
import UserProfile from './UserProfile';
import MyFriends from './MyFriends';
import Room from './Room';
import './App.css'
import { UserProvider } from './UserContext';

const App = () => {
    return (
        <UserProvider>
      <Router>
          <Header />
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} /> 
              <Route path="/userlist" element={<UserList />} />
              <Route path="/user/:userNickname" element={<UserProfile />} />
              <Route path="/my-friends" element={<MyFriends />} />
              <Route path="/settings" element={<Settings />} /> 
              <Route path="/room" element={<Room />} />
              {/* Додайте тут інші маршрути, якщо потрібно */}
          </Routes>
      </Router>
      </UserProvider>
    );
};
export default App;