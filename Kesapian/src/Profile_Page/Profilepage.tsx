import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css"; 

const ProfilePage: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState<boolean>(false); 
  const [preferences, setPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        alert("User is not logged in. Please log in first.");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/profile/${userId}`);
        if (!response.ok) {
          const errorData: { message?: string } = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch user profile."
          );
        }
        const data = await response.json();
        const user = data.user;

        setUsername(user.username || "Anonymous");
        setIsPrivate(user.is_private === 1 || user.is_private === true); // Set is_private (assuming 1 for true, 0 for false or boolean)
        setPreferences(Array.isArray(user.preferences) ? user.preferences : []);
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, navigate]);

  const handleUpdateProfile = async (
    field: "username" | "is_private", 
    value: string | boolean 
  ) => {
    if (!userId) {
      alert("User is not logged in.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        const errorData: { message?: string } = await response.json();
        throw new Error(errorData.message || `Failed to update ${field}`);
      }

      const data = await response.json();
      alert(`Successfully updated ${field}!`);
      if (field === "username") {
        setUsername(data.user.username);
        localStorage.setItem("username", data.user.username);
      } else if (field === "is_private") {
        setIsPrivate(data.user.is_private === 1 || data.user.is_private === true);
      }
    } catch (err: any) {
      console.error(`Error updating ${field}:`, err);
      alert(`Error updating ${field}: ` + err.message);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  // New handler for the private toggle
  const handleIsPrivateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setIsPrivate(newValue);
    handleUpdateProfile("is_private", newValue); // Immediately save on toggle
  };

  const handleEditPreferences = () => {
    navigate("/preferences");
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Navigation handlers for the bottom bar
  const handleChatClick = () => {
    navigate("/chat");
  };
  const handleGroupsClick = () => {
    alert("Groups page not implemented yet!");
  };
  const handleProfileClick = () => {
    navigate("/profile");
  };
  const handleMoreClick = () => {
    alert("More options not implemented yet!");
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="profile-error">Error: {error}</div>;
  }

  const profileInitial = username ? username.charAt(0).toUpperCase() : "A";

  return (
    <div className="profile-container">
      <div className="profile-page">
        {/* Header */}
        <header className="header">
          <div className="header-top">
            <button className="back-button" onClick={handleBack}>
              ←
            </button>
          </div>
          <div className="profile-picture">
            <span className="profile-initial">{profileInitial}</span>
          </div>
          <h2>{username}</h2>
          <p>{isPrivate ? "Private Account" : "Public Account"}</p>{" "}
          {/* Display private status */}
        </header>

        {/* Content */}
        <main className="content">
          <section className="section">
            <label htmlFor="username-input">
              <span className="icon">👤</span> Username
            </label>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              onBlur={() => handleUpdateProfile("username", username)} // Save on blur
              className="profile-input"
            />
          </section>

          <section className="section">
            <label htmlFor="private-toggle">
              <span className="icon">🔒</span> Private Account
            </label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="private-toggle"
                checked={isPrivate}
                onChange={handleIsPrivateChange}
              />
              <label htmlFor="private-toggle" className="slider"></label>
            </div>
            <p className="toggle-status">
                {isPrivate ? "Your account is private. Only your friend who can see your content." : "Your account is public. Anyone can see your content."}
            </p>
          </section>

          <section className="section">
            <label>Preferences</label>
            <div className="preferences">
              {preferences.length > 0 ? (
                preferences.map((pref, index) => (
                  <span key={index} className="preference-tag">
                    {pref}
                  </span>
                ))
              ) : (
                <p className="placeholder-message">
                  Please select your preference first.
                </p>
              )}
            </div>
            <button
              className="edit-preferences-button"
              onClick={handleEditPreferences}
            >
              Edit Preferences
            </button>
          </section>
        </main>

        {/* Footer (Navigation) */}
        <nav className="chat-bottom-nav">
          <button className="nav-button" onClick={handleChatClick}>
            <img src="src/assets/icons/bubblechat-before.png" alt="Chats" />
            <span>Chats</span>
          </button>
          <button className="nav-button" onClick={handleGroupsClick}>
            <img src="src/assets/icons/groupBefore.png" alt="Groups" />
            <span>Groups</span>
          </button>
          <button className="nav-button active" onClick={handleProfileClick}>
            <img src="src/assets/icons/peopleAfter.png" alt="Profile" />
            <span>Profile</span>
          </button>
          <button className="nav-button" onClick={handleMoreClick}>
            <img src="src/assets/icons/moreBefore.png" alt="More" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default ProfilePage;