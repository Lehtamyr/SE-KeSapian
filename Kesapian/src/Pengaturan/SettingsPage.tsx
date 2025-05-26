// import React from 'react';
import "./SettingsPage.css";

const Settings = () => {
  return (
    <div className="settings-container">
      <div>
        <div className="header">
          <button className="back-button">⬅️</button>
          <div className="user-greeting">
            <span className="greeting-text">Hello Anonymous 123</span>
          </div>
          <div className="profile-placeholder"></div>
        </div>

        <div className="section">
          <div className="menu-item">
            <span className="menu-icon">⚙️</span>
            <div className="menu-text">
              <span className="menu-title">Settings and Privacy</span>
              <span className="menu-subtitle">Change your email, password</span>
            </div>
          </div>

          <div className="menu-item">
            <span className="menu-icon">🔔</span>
            <div className="menu-text">
              <span className="menu-title">Notification</span>
              <span className="menu-subtitle">Message, call tones</span>
            </div>
          </div>

          <div className="menu-item">
            <span className="menu-icon">❓</span>
            <div className="menu-text">
              <span className="menu-title">Support and Help</span>
              <span className="menu-subtitle">Help center, contact us, privacy policy</span>
            </div>
          </div>

          <div className="menu-item">
            <span className="menu-icon">📋</span>
            <div className="menu-text">
              <span className="menu-title">Additional Setting</span>
              <span className="menu-subtitle">Chat theme, font size</span>
            </div>
          </div>

          <div className="menu-item">
            <span className="menu-icon">🌐</span>
            <div className="menu-text">
              <span className="menu-title">App Language</span>
            </div>
          </div>
        </div>

        <div className="location">
          <label className="location-label">Location</label>
          <div className="location-input">
            <span>📍</span>
            <span>...</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <nav className="chat-bottom-nav">
        <button className="nav-button">
            <img src="src/assets/bubblechat-before.png" alt="Chats" />
            <span>Chats</span>
        </button>
        <button className="nav-button">
            <img src="src/assets/groupBefore.png" alt="Groups" />
            <span>Groups</span>
        </button>
        <button className="nav-button">
            <img src="src/assets/peopleAfter.png" alt="Profile" />
            <span>Profile</span>
        </button>
        <button className="nav-button active ">
            <img src="src/assets/moreBefore.png" alt="More" />
            <span>More</span>
        </button>
        </nav>

      </div>
  );
};

export default Settings;
