import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import MapBox from "../Add_Friend/MapBox"; 
import { useNavigate } from "react-router-dom";
import './AddFriendPage.css';
import SearchIcon from "../assets/icons/Searchicon.png";
import ChatBubbleIcon from "../assets/icons/chatBubble.png";
import GroupBeforeIcon from "../assets/icons/groupBefore.png";
import PeopleAfterIcon from "../assets/icons/peopleafter.png"; 
import MoreBeforeIcon from "../assets/icons/moreBefore.png";
import HeaderBg from '/rectangle-107.svg'; 


export const AddFriendPage = (): JSX.Element => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [message, setMessage] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            setCurrentUserId(userId);
        } else {
            alert('You must be logged in to add friends.');
            navigate('/login');
        }
    }, [navigate]);

    const handleBackClick = () => {
        navigate('/chat');
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(''); 
        setSearchResults([]); 

        if (!searchQuery.trim()) {
            setMessage('Please enter a username or email to search.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/search-user?query=${encodeURIComponent(searchQuery)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to search for users');
            }
            const data = await response.json();
            // Filter out the current user from search results
            const filteredResults = data.users.filter((user: any) => user.id !== parseInt(currentUserId || '0'));
            setSearchResults(filteredResults);

            if (filteredResults.length === 0) {
                setMessage('No users found matching your search.'); // Updated message
            }
        } catch (error: any) {
            console.error('Error searching users:', error);
            setMessage('An error occurred while searching: ' + error.message);
        }
    };

    const handleAddFriend = async (targetUser: any) => {
        if (!currentUserId) {
            alert('User ID not found. Please re-login.');
            navigate('/login');
            return;
        }

        if (parseInt(currentUserId) === targetUser.id) {
            alert('You cannot add yourself as a friend.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/add-friend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentUserId: parseInt(currentUserId),
                    targetUserId: targetUser.id,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to send friend request');
            }

            alert(data.message);
            // Remove the added friend from search results/recommendations
            setSearchResults(prevResults => prevResults.filter(user => user.id !== targetUser.id));

        } catch (error: any) {
            console.error('Error adding friend:', error);
            alert('Error adding friend: ' + error.message);
        }
    };

    // Static recommendations data
    const friendRecommendations = [
        {
            id: 11,
            username: "wokwokwok",
            email: "jokojeki@gmail.com",
            distance: "800m From Your Position",
            avatar: "/avatar.png",
        },
    ];

    // Filter out the current user from recommendations as well
    const filteredRecommendations = friendRecommendations.filter(
        (user: any) => user.id !== parseInt(currentUserId || '0')
    );

    // menentukan apakah akan menampilkan hasil pencarian atau rekomendasi
    const usersToDisplay = searchResults.length > 0 ? searchResults : filteredRecommendations;

    // menentukan apakah daftar teman kosong atau hanya ada pesan
    const isListEmpty = usersToDisplay.length === 0 && !message;
    const isMessageVisible = message && usersToDisplay.length === 0;


    return (
        <div className="add-friend-page-container">
            <div className="add-friend-content-wrapper">

                {/* Header */}
                <div className="add-friend-header" style={{ backgroundImage: `url(${HeaderBg})` }}>
                    <button className="back-button" onClick={handleBackClick}>&larr;</button>
                    <div className="add-friend-title">
                        Add Friends
                    </div>

                    {/* Search Bar */}
                    <div className="add-friend-search-bar">
                        <form className="w-[388px] min-h-[56px] bg-gray-100 rounded p-4" onSubmit={handleSearch}>
                            <img src={SearchIcon} alt="search" className="absolute" />
                            <input
                                type="search"
                                id="default-search"
                                placeholder="Search by Username or Email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                required
                            />
                            <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                Search
                            </button>
                        </form>
                    </div>

                </div>

                {/* Recommendations and Search Results section */}
                <div className="add-friend-main-section">
                    <h2 className="add-friend-section-title">
                        {searchResults.length > 0 || searchQuery.trim() !== '' ? 'Search Results' : 'Recommendations'}
                    </h2>
                    {/* Pesan error/info  */}
                    {message && <p className="message-container">{message}</p>}

                    {/* Map section */}
                    <div className="add-friend-map-section">
                        <MapBox />
                    </div>

                    {/* Friends list */}
                    <div className={`add-friend-list ${isListEmpty && !message ? 'add-friend-list--empty' : ''}`}>
                        {/* Jika tidak ada hasil pencarian DAN tidak ada rekomendasi, tampilkan pesan kosong. */}
                        {/* Pesan "No users found matching your search." sudah ditangani oleh state `message` */}
                        {usersToDisplay.length === 0 && !message && (
                            <p className="message-container">No recommendations available.</p>
                        )}
                        {/* Render user cards jika ada user untuk ditampilkan */}
                        {usersToDisplay.length > 0 && usersToDisplay.map((user) => (
                            <Card key={user.id} className="add-friend-card">
                                <CardContent className="add-friend-card-content">
                                    <div className="add-friend-card-info">
                                        <div className="add-friend-avatar-wrapper">
                                            <img
                                                className="add-friend-avatar-img"
                                                alt={`${user.username || user.name}'s avatar`}
                                                src={user.avatar || "/default-avatar.png"}
                                            />
                                        </div>
                                        <div className="add-friend-user-info">
                                            <div className="add-friend-user-name">
                                                {user.username || user.name}
                                            </div>
                                            <div className="add-friend-user-distance">
                                                {user.distance || user.email}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="add-friend-view-btn"
                                        onClick={() => handleAddFriend(user)}
                                    >
                                        <span className="add-friend-view-btn-text">
                                            Add Friend
                                        </span>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
            {/* Bottom Navigation */}
            <nav className="chat-bottom-nav">
                <button className="nav-button active" onClick={() => navigate('/chat')}>
                    <img src={ChatBubbleIcon} alt="Chats" />
                    <span>Chats</span>
                </button>
                <button className="nav-button" onClick={() => alert('Groups page not implemented yet!')}>
                    <img src={GroupBeforeIcon} alt="Groups" />
                    <span>Groups</span>
                </button>
                <button className="nav-button" onClick={() => alert('Profile page not implemented yet!')}>
                    <img src={PeopleAfterIcon} alt="Profile" />
                    <span>Profile</span>
                </button>
                <button className="nav-button" onClick={() => alert('More page not implemented yet!')}>
                    <img src={MoreBeforeIcon} alt="More" />
                    <span>More</span>
                </button>
            </nav>
        </div>
    );
};