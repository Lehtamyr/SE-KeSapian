//import React from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import MapBox from "../Add_Friend/MapBox";
import "./AddFriendPage.css";
//import SearchInput from "../SearchBar";

export const AddFriendPage = (): JSX.Element => {
  const friendRecommendations = [
    {
      id: 1,
      name: "David Wayne",
      distance: "800m From Your Position",
      avatar: "/avatar.png",
      isAvatarBg: true,
    },
    {
      id: 2,
      name: "Edward Davidson",
      distance: "1.2km From Your Position",
      avatar: "/rectangle.png",
      isAvatarBg: false,
    },
    {
      id: 3,
      name: "Angela Kelly",
      distance: "1.5km From Your Position",
      avatar: "/rectangle-1.png",
      isAvatarBg: false,
    },
    {
      id: 4,
      name: "Dennis Borer",
      distance: "2km From Your Position",
      avatar: "/rectangle-2.png",
      isAvatarBg: false,
    },
  ];

  return (
    <div className="add-friend-page-container">
      <div className="add-friend-content-wrapper">

        {/* Header */}
        <div className="add-friend-header">
          <img
            className="add-friend-header-bg"
            alt="Header Background"
            src="/rectangle-107.svg"
          />
          <div className="add-friend-title">
            Add Friends
          </div>

          
          <div className="add-friend-search-bar">

            <form className="w-[388px] min-h-[56px] bg-gray-100 rounded p-4">
              {/* <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label> */}
              <div className="relative">
                <img src="src/assets/SearchIcon.png" alt="search" />

                <input type="search" id="default-search" className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search Mockups, Logos..." required />
                <button type="submit" className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Search</button>
              </div>
            </form>
          </div>

        </div>

        {/* Recommendations section */}
        <div className="add-friend-main-section">
          <h2 className="add-friend-section-title">
            Recommendations
          </h2>

          {/* Map section */}
          <div className="add-friend-map-section">
            <MapBox />
          </div>

          {/* Friends list */}
          <div className="add-friend-list">
            {friendRecommendations.map((friend) => (
              <Card key={friend.id} className="add-friend-card">
                <CardContent className="add-friend-card-content">
                  <div className="add-friend-card-info">
                    {friend.isAvatarBg ? (
                      <div
                        className="add-friend-avatar-bg"
                        style={{ backgroundImage: `url(${friend.avatar})` }}
                      />
                    ) : (
                      <img
                        className="add-friend-avatar-img"
                        alt={`${friend.name}'s avatar`}
                        src={friend.avatar}
                      />
                    )}
                    <div className="add-friend-user-info">
                      <div className="add-friend-user-name">
                        {friend.name}
                      </div>
                      <div className="add-friend-user-distance">
                        {friend.distance}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="add-friend-view-btn"
                  >
                    <span className="add-friend-view-btn-text">
                      View
                    </span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

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
    </div>
  );
};