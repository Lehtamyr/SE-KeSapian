import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import MapBox from "../Add_Friend/MapBox";
import { useNavigate, useLocation } from "react-router-dom";
import './AddFriendPage.css';
import SearchIcon from "../assets/icons/Searchicon.png";
import ChatBubbleIcon from "../assets/icons/chatbubble.png";
import GroupBeforeIcon from "../assets/icons/groupBefore.png";
import peopleBefore from "../assets/icons/poepleBefore.png";
import PeopleAfterIcon from "../assets/icons/peopleAfter.png";
import MoreBeforeIcon from "../assets/icons/moreBefore.png";
import anonym from "../assets/icons/anonym.png";

const API_BASE_URL = 'http://localhost:3000';

export const AddFriendPage = (): JSX.Element => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [message, setMessage] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [usernameForAuth, setUsernameForAuth] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        if (userId && username) {
            setCurrentUserId(userId);
            setUsernameForAuth(username);
        } else {
            alert('You must be logged in to add friends.');
            navigate('/login');
        }
    }, [navigate]);

    // Fetch recommendations (nearby users not yet friends) on mount or when userId changes
    useEffect(() => {
        if (!currentUserId) return;
        setLoadingRecommendations(true);
        fetch(`${API_BASE_URL}/nearby-users/${currentUserId}`)
            .then(res => res.json())
            .then(data => {
                setRecommendations(data.users || []);
            })
            .catch(err => {
                setRecommendations([]);
            })
            .finally(() => setLoadingRecommendations(false));
    }, [currentUserId]);

    const handleSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setSearchResults([]);

        if (!searchQuery.trim()) {
            setMessage('Please enter a username or email to search.');
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`${API_BASE_URL}/search-user?query=${encodeURIComponent(searchQuery)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to search for users');
            }
            const data = await response.json();
            const filteredResults = data.users.filter((user: any) => user.id !== parseInt(currentUserId || '0'));
            setSearchResults(filteredResults);

            if (filteredResults.length === 0) {
                setMessage('No users found matching your search.');
            }
        } catch (error: any) {
            setMessage('An error occurred while searching: ' + error.message);
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery, currentUserId]);

    const handleAddFriend = useCallback(async (targetUser: any) => {
        if (!currentUserId) {
            alert('User ID not found. Please re-login.');
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/add-friend`, {
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
            if (!response.ok) throw new Error(data.message || 'Failed to send friend request');

            alert(data.message);
            // Remove the added friend from both search results and recommendations
            setSearchResults(prev => prev.filter(user => user.id !== targetUser.id));
            setRecommendations(prev => prev.filter(user => user.id !== targetUser.id));
        } catch (error: any) {
            alert('Error adding friend: ' + error.message);
        }
    }, [currentUserId, navigate]);

    const handleNavClick = useCallback((path: string) => {
        if (path === '/more') {
            alert('More options not implemented yet!');
        } else {
            navigate(path);
        }
    }, [navigate]);

    // Show recommendations if not searching and not typing
    const showRecommendations = searchResults.length === 0 && !message && searchQuery.trim() === '';
    const usersToDisplay = showRecommendations ? recommendations : searchResults;

    return (
        <div className="add-friend-container">
            {/* Header */}
            <div className="add-friend-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    &larr;
                </button>
                <h1 className="add-friend-title">Add Friends</h1>

                {/* Search Bar */}
                <div className="search-container">
                    <form onSubmit={handleSearch} className="search-form">
                        <img src={SearchIcon} alt="Search" className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by Username or Email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={isSearching}
                        />
                        <Button type="submit" className="search-button" disabled={isSearching}>
                            {isSearching ? 'Searching...' : 'Search'}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Main Content */}
            <main className="add-friend-main">
                <h2 className="section-title">
                    {searchResults.length > 0 ? 'Search Results' : 'Recommendations'}
                </h2>

                {message && <p className="message">{message}</p>}

                {/* Map Container */}
                <div className="map-container">
                    <MapBox authToken={usernameForAuth} />
                </div>

                {/* User List */}
                <div className="user-list">
                    {showRecommendations && loadingRecommendations && (
                        <p className="empty-message">Loading recommendations...</p>
                    )}
                    {showRecommendations && !loadingRecommendations && usersToDisplay.length === 0 && (
                        <p className="empty-message">No recommendations available</p>
                    )}
                    {!showRecommendations && searchResults.length === 0 && message && (
                        <p className="empty-message">{message}</p>
                    )}

                    {usersToDisplay.map((user) => (
                        <div key={user.id} className="user-card">
                            <div className="user-info">
                                <div className="user-avatar">
                                    <img
                                        src={user.avatar || anonym}
                                        alt="Avatar"
                                    />
                                </div>
                                <div>
                                    <p className="user-name">{user.username}</p>
                                    {user.distance && <p className="user-distance">{user.distance}</p>}
                                </div>
                            </div>
                            <Button
                                className="add-button"
                                onClick={() => handleAddFriend(user)}
                            >
                                Add Friend
                            </Button>
                        </div>
                    ))}
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                <button className={`nav-button ${location.pathname === '/chat' ? 'active' : 'bubble'}`} onClick={() => handleNavClick('/chat')}>
                    <img
                        src={ChatBubbleIcon}
                        alt="Chats"
                        className="chat-bubble-icon"
                    />
                    <span>Chats</span>
                </button>

                <button className={`nav-button ${location.pathname === '/groups' ? 'active' : ''}`} onClick={() => handleNavClick('/groups')}>
                    <img
                        src={GroupBeforeIcon}
                        alt="Groups"
                        className="group-icon"
                    />
                    <span>Groups</span>
                </button>

                <button className={`nav-button ${location.pathname === '/profile' ? 'active' : ''}`} onClick={() => handleNavClick('/profile')}>
                    <img
                        src={peopleBefore}
                        alt="Profile"
                        className="people-icon"
                    />
                    <span>Profile</span>
                </button>

                <button className={`nav-button ${location.pathname === '/more' ? 'active' : ''}`} onClick={() => handleNavClick('/more')}>
                    <img
                        src={MoreBeforeIcon}
                        alt="More"
                        className="more-icon"
                    />
                    <span>More</span>
                </button>
            </nav>
        </div>
    );
};