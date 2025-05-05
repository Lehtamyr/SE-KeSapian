import React from "react";
import "./ProfilePage.css";

const ProfilePage: React.FC = () => {
  return (
    <div className="profile-container">
      <div className="profile-page">
        {/* Header */}
        <header className="header">
        <div className="header-top">
            <button className="back-button">←</button>
            <button className="skip-button">SKIP</button>
        </div>
        <div className="profile-picture">
            <span className="profile-initial">A</span>
        </div>
        <h2>Anonymous 123</h2>
        <p>...</p>
        </header>

        {/* Content */}
        <main className="content">
          <section className="section">
            <label htmlFor="username">
              <span className="icon">👤</span> Username
            </label>
            <p>...</p>
          </section>

          <section className="section">
            <label htmlFor="location">
              <span className="icon">📍</span> Location
            </label>
            <p>...</p>
          </section>

          <section className="section">
            <label>Preferences</label>
            <div className="preferences">
              <p className="placeholder-message">Please select your preference first.</p>
            </div>
          </section>
        </main>

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
        <button className="nav-button active">
            <img src="src/assets/peopleAfter.png" alt="Profile" />
            <span>Profile</span>
        </button>
        <button className="nav-button">
            <img src="src/assets/moreBefore.png" alt="More" />
            <span>More</span>
        </button>
        </nav>

      </div>
    </div>
  );
};

export default ProfilePage;