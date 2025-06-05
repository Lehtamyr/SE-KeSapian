import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchIcon, UserPlusIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { ScrollArea } from "../../components/ui/scroll-area";
import './ChatPage.css';
import ChatBubbleIcon from "../assets/icons/chatbubble.png";
import GroupBeforeIcon from "../assets/icons/groupBefore.png";
import PeopleBeforeIcon from "../assets/icons/poepleBefore.png";
import MoreBeforeIcon from "../assets/icons/moreBefore.png";

interface Chat {
  id: number;
  sender: string;
  message: string;
  timestamp: string; 
  avatar?: string;
  unreadCount?: number; 
}

interface Friend {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

interface IncomingFriendRequest {
  id: number;
  requesterId: number;
  requesterUsername: string;
  requesterEmail: string;
  status: 'pending';
  requesterAvatar?: string;
}

const Chatpage = (): React.ReactElement => {
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingFriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const friendsResponse = await fetch(`http://localhost:3000/friends/${userId}`);
      if (!friendsResponse.ok) throw new Error('Failed to fetch friends');
      const friendsData = await friendsResponse.json();
      setFriends(friendsData.friends);

      const requestsResponse = await fetch(`http://localhost:3000/friend-requests/${userId}`);
      if (!requestsResponse.ok) throw new Error('Failed to fetch friend requests');
      const requestsData = await requestsResponse.json();
      setIncomingRequests(requestsData.incomingRequests);

      // Mengambil waktu saat ini untuk dummy chats
      const now = new Date();
      const currentFormattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      // Mengambil hanya jam dan menit
      const currentFormattedTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

      const dummyChats: Chat[] = friendsData.friends.map((friend: Friend) => ({
        id: friend.id,
        sender: friend.username,
        message: `Start chatting with ${friend.username}!`,
        // Menggabungkan tanggal dan waktu dalam format DD/MM/YYYY HH:MM
        timestamp: `${currentFormattedDate} ${currentFormattedTime}`, 
        avatar: friend.avatar,
        // Contoh: beberapa chat memiliki unreadCount, yang lain tidak
        unreadCount: friend.id % 2 === 0 ? Math.floor(Math.random() * 5) + 1 : 0 // Hanya untuk demonstrasi
      }));
      setChats(dummyChats);

    } catch (err: any) {
      setError('Error: ' + (err.message || 'Unknown error'));
      setFriends([]);
      setChats([]);
      setIncomingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    if (storedUserId && storedUsername) {
      setLoggedInUserId(storedUserId);
      setLoggedInUsername(storedUsername);
      fetchUserData(storedUserId);
    } else {
      alert('Please log in first.');
      navigate('/login');
    }
  }, [navigate]);

  const handleRespondToFriendRequest = async (requestId: number, action: 'accept' | 'reject') => {
    try {
      const response = await fetch('http://localhost:3000/respond-friend-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      alert(data.message);
      if (loggedInUserId) fetchUserData(loggedInUserId);
    } catch (error: any) {
      alert(`Failed to ${action} request: ${error.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleAddFriendClick = () => navigate('/add-friend');
  const handleChatClick = () => navigate('/chat');
  const handleGroupsClick = () => navigate('/groups'); 
  const handleProfileClick = () => navigate('/profile');
  const handleMoreClick = () => handleLogout();

  if (loading) return <div className="loading-page">Loading chat and friends...</div>;
  if (error) return <div className="error-page">{error}</div>;

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="chat-header-name">KeSapian - Welcome, {loggedInUsername || 'Guest'}</div>
        <div className="chat-actions">
          <SearchIcon className="w-[27px] h-[26px] text-black cursor-pointer" />
          <UserPlusIcon className="w-[26px] h-[26px] text-black cursor-pointer" onClick={handleAddFriendClick} />
        </div>
      </header>

      <ScrollArea className="chat-scroll-area">
        {/* Incoming Friend Requests Section */}
        {incomingRequests.length > 0 && (
          <div className="incoming-requests-section">
            <h2>Incoming Friend Requests</h2>
            {incomingRequests.map((request) => (
              <div key={request.id} className="incoming-request-card">
                <div className="incoming-request-card-left">
                  <div className="incoming-request-avatar">
                    {request.requesterAvatar ? (
                      <img src={request.requesterAvatar} alt={request.requesterUsername} />
                    ) : (
                      <span>{request.requesterUsername ? request.requesterUsername.charAt(0).toUpperCase() : '?'}</span>
                    )}
                  </div>
                  <div className="incoming-request-card-content">
                    <p className="request-username">{request.requesterUsername}</p>
                    <p className="request-message">sent you a friend request.</p>
                  </div>
                </div>
                <div className="incoming-request-card-right">
                  <div className="incoming-request-actions">
                    <button onClick={() => handleRespondToFriendRequest(request.id, 'accept')} className="accept-button">
                      Accept
                    </button>
                    <button onClick={() => handleRespondToFriendRequest(request.id, 'reject')} className="reject-button">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Your Chats Section */}
      {chats.length === 0 ? (
        <div className="chat-empty">
          <p className="text-lg">No chats yet</p>
          <p className="text-sm">Add contacts to start chatting</p>
        </div>
      ) : (
        <div className="chat-list-section">
          <h2>Your Chats</h2>
          {chats.map((chat) => {
            return (
              <div
                key={chat.id}
                className="chat-card"
                onClick={() => navigate(`/chat/person/${chat.id}`)} // Perhatikan rute di sini
              >
                <div className="chat-card-left">
                  <Avatar className="chat-avatar">
                    {chat.avatar ? (
                      <AvatarImage src={chat.avatar} alt={chat.sender} />
                    ) : (
                      <AvatarFallback>
                        {chat.sender ? chat.sender.charAt(0).toUpperCase() : '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="chat-card-content">
                    <p className="chat-username">{chat.sender}</p>
                    <p className="chat-message">{chat.message}</p>
                  </div>
                </div>
                <div className="chat-card-right">
                  <p className="chat-datetime">{chat.timestamp}</p>
                  {/* Div khusus untuk unread count */}
                  <div className="chat-unread-container">
                    {chat.unreadCount && chat.unreadCount > 0 ? (
                      <span className="chat-unread-badge">{chat.unreadCount}</span>
                    ) : (
                      <span className="chat-unread-empty"></span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </ScrollArea>

      <nav className="chat-bottom-nav">
        <button className={`nav-button ${location.pathname === '/chat' ? 'active' : ''}`} onClick={handleChatClick}>
          <img src={ChatBubbleIcon} alt="Chats" />
          <span>Chats</span>
        </button>
        <button className={`nav-button ${location.pathname === '/groups' ? 'active' : ''}`} onClick={handleGroupsClick}>
          <img src={GroupBeforeIcon} alt="Groups" />
          <span>Groups</span>
        </button>
        <button className={`nav-button ${location.pathname === '/profile' ? 'active' : ''}`} onClick={handleProfileClick}>
          <img src={PeopleBeforeIcon} alt="Profile" />
          <span>Profile</span>
        </button>
        <button className={`nav-button ${location.pathname === '/more' ? 'active' : ''}`} onClick={handleMoreClick}>
          <img src={MoreBeforeIcon} alt="More" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};

export default Chatpage;