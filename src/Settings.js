import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import EmojiPicker from 'emoji-picker-react';
import { useUserContext } from './UserContext';
import { auth, db } from './firebase';
import './Settings.css';
import './EmojiPicker.css';
import profile_image_icon from './img/Profile-Settings/profile-image-icon-white.svg';
import verifiedIcon from './img/Profile-Settings/verified_icon-lg-bl.svg'; 

const Settings = () => {
  const { user, setUser } = useUserContext();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(user?.photoURL || '/path/to/default-avatar.jpg');
  const [backgroundImage, setBackgroundImage] = useState(user?.backgroundImage || '/path/to/default-background.jpg');
  const [description, setDescription] = useState(user?.description || '');
  const [isPublicProfile, setIsPublicProfile] = useState(user?.isPublicProfile !== false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setProfileImageUrl(user.photoURL || '/path/to/default-avatar.jpg');
      setDescription(user.description || '');
      setBackgroundImage(user.backgroundImage || '/path/to/default-background.jpg');
      setIsPublicProfile(user.isPublicProfile !== false);
    }
  }, [user]);

  const handleImageChange = async (e, imageType) => {
    const file = e.target.files[0];
    if (file) {
      const storage = getStorage();
      const storageReference = storageRef(storage, `${imageType}/${user.uid}`);
      const snapshot = await uploadBytes(storageReference, file);
      const newImageUrl = await getDownloadURL(snapshot.ref);

      if (imageType === 'profileImages') {
        setProfileImage(file);
        setProfileImageUrl(newImageUrl);
      } else if (imageType === 'backgroundImages') {
        setBackgroundImage(newImageUrl);
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { [`${imageType.slice(0, -1)}`]: newImageUrl });
    }
  };

  const handleEmojiSelect = (emojiObject) => {
    setDescription(description + emojiObject.emoji);
  };

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value.substring(0, 250));
  };

  const handleNicknameChange = (event) => {
    setNickname(event.target.value);
  };

  const handleSaveEdits = async () => {
    let updatedUserData = {
      nickname: nickname,
      photoURL: profileImageUrl,
      description: description,
      backgroundImage: backgroundImage,
      isPublicProfile: isPublicProfile
    };

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, updatedUserData);
    setUser(prevUser => ({ ...prevUser, ...updatedUserData }));
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const toggleProfileVisibility = async () => {
    const newIsPublicProfile = !isPublicProfile;
    setIsPublicProfile(newIsPublicProfile);

    const userRef = doc(db, 'users', user.uid);
    try {
        if (newIsPublicProfile) {
            const updatedFollowers = Array.from(new Set([...(user.followers || []), ...(user.followRequests || [])]));
            await updateDoc(userRef, {
                isPublicProfile: newIsPublicProfile,
                followers: updatedFollowers,
                followRequests: []
            });
        } else {
            await updateDoc(userRef, {
                isPublicProfile: newIsPublicProfile
            });
        }
    } catch (error) {
        console.error('Error updating profile visibility:', error);
    }
  };

// Додано функцію для обробки завантаження фото профілю
const handleProfileImageChange = async (e) => {
  const file = e.target.files[0];
  if (file) {
    // Логіка завантаження фото профілю
    const storage = getStorage();
    const storageReference = storageRef(storage, `profileImages/${user.uid}`);
    const snapshot = await uploadBytes(storageReference, file);
    const newImageUrl = await getDownloadURL(snapshot.ref);
    setProfileImageUrl(newImageUrl);

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { photoURL: newImageUrl });
  }
};

  return (
    <div className="settings-container">
      <aside className="sidebar">
        <div className="sidebar-profile">
        <label htmlFor="profile-image-upload" className="profile-picture-upload">
  <img src={profileImageUrl} alt="Profile" className="profile-picture" />
  {/* Іконка камери */}
  <div className="camera-icon">
    <img src={profile_image_icon} className="profile-image-icon" alt="Change Profile" />
  </div>
</label>
<input
  type="file"
  id="profile-image-upload"
  style={{ display: 'none' }}
  onChange={(e) => handleImageChange(e, 'profileImages')}
/>

<h3>
                        {user?.displayName || 'No Name'}
                        {user?.isVerified && <img src={verifiedIcon} className="verified-badge" alt="Verified" />}
                    </h3>
          <p>@{nickname}</p>
          <p>{user?.email || 'email@example.com'}</p>
          <p>{description}</p>
          <button className="logout-button" onClick={handleLogout}>Log out</button>
        </div>
      </aside>
      <div className="profile-main-content">
        <div className="profile-background" style={{ backgroundImage: `url(${backgroundImage})` }}>
          <input
            type="file"
            onChange={(e) => handleImageChange(e, 'backgroundImages')}
            className="upload-background"
            id="upload-background"
            style={{ display: 'none' }}
          />
          <label htmlFor="upload-background" className="profile-background-label">Change Background</label>
        </div>
        <main className="settings-content">
          <div className="settings-section">
            <h2>Settings</h2>
            <div className="settings-form">
              <div className="form-field">
                {/*
                <label>Profile Image</label>
                <input type="file" onChange={(e) => handleImageChange(e, 'profileImages')} />
                */}
              </div>
              <div className="form-field">
                <label>Nickname</label>
                <input type="text" value={nickname} onChange={handleNicknameChange} />
              </div>
              <div className="form-field">
                <label>Profile Description</label>
                <textarea
                  value={description}
                  onChange={handleDescriptionChange}
                  maxLength="250"
                  placeholder="Describe yourself"
                />
                <div className="character-count">{description.length}/250</div>
                <button type="button" className="emoji-icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😀</button>
                {showEmojiPicker && <EmojiPicker onEmojiClick={handleEmojiSelect} pickerStyle={{ position: 'absolute', bottom: '20px', right: '20px' }} />}
              </div>
              <div className="form-field">
                <label>Profile Visibility</label>
                <label className="switch">
                  <input type="checkbox" checked={isPublicProfile} onChange={toggleProfileVisibility} />
                  <span className="slider round"></span>
                </label>
                <p>{isPublicProfile ? "Your profile is public" : "Your profile is private"}</p>
              </div>
              <button className="save-edits-btn" onClick={handleSaveEdits}>Save Edits</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
