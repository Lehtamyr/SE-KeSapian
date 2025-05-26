import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, UserPlusIcon } from "lucide-react"; 
import { Avatar, AvatarImage } from "../components/ui/avatar"; 
import { ScrollArea } from "../../components/ui/scroll-area"; 
import './ChatPage.css'; 
import ChatBubbleIcon from "../assets/icons/chatbubble.png"; 
import GroupBeforeIcon from "../assets/icons/groupBefore.png"; 
import PeopleBeforeIcon from "../assets/icons/poepleBefore.png"; 
import MoreBeforeIcon from "../assets/icons/moreBefore.png"; 

const Chatpage = (): React.ReactElement => {
    interface Chat {
        id: number;
        sender: string;
        message: string;
        timestamp: string;
        avatar?: string;
    }

    interface Friend {
        id: number;
        username: string;
        email: string;
        avatar?: string;
    }

    const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);
    const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchUserData = async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const friendsResponse = await fetch(`http://localhost:3000/friends/${userId}`);
            if (!friendsResponse.ok) {
                const errorData = await friendsResponse.json();
                throw new Error(errorData.message || 'Failed to fetch friends');
            }
            const friendsData = await friendsResponse.json();
            setFriends(friendsData.friends);

            const dummyChats: Chat[] = friendsData.friends.map((friend: Friend) => ({
                id: friend.id,
                sender: friend.username,
                message: `Start chatting with ${friend.username}!`,
                timestamp: new Date().toLocaleString(),
                avatar: friend.avatar || "/default-avatar.png" // Menggunakan path public untuk default avatar
            }));
            setChats(dummyChats);

        } catch (err: any) {
            console.error('Error fetching user data:', err);
            setError('Failed to load data: ' + err.message);
            setFriends([]);
            setChats([]);
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
            alert('User is not logged in. Please log in first.');
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        navigate('/login');
    };

    const handleAddFriendClick = () => {
        navigate('/add-friend');
    };

    if (loading) {
        return <div className="loading-page">Loading chat and friends...</div>;
    }

    if (error) {
        return <div className="error-page">Error: {error}</div>;
    }

    return (
        <div className="chat-container">
            {/* Header */}
            <header className="chat-header">
                <div className="chat-header-name">KeSapian - Welcome, {loggedInUsername || 'Guest'}</div>
                <Avatar className="chat-avatar">
                    <AvatarImage src="/avatar-1.png" alt="Profile" />
                </Avatar>
                <div className="chat-actions">
                    <SearchIcon className="w-[27px] h-[26px] text-black cursor-pointer" />
                    <UserPlusIcon
                        className="w-[26px] h-[26px] text-black cursor-pointer"
                        onClick={handleAddFriendClick}
                    />
                </div>
            </header>

            {/* Chat List */}
            <ScrollArea className="chat-scroll-area">
                {chats.length === 0 ? (
                    <div className="chat-empty">
                        <p className="text-lg">No chats yet</p>
                        <p className="text-sm">Add contacts to start chatting</p>
                        {friends.length > 0 && (
                            <>
                                <h3 className="text-md mt-4">Your Friends:</h3>
                                <ul className="list-disc list-inside">
                                    {friends.map(friend => (
                                        <li key={friend.id}>{friend.username}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-start gap-5 p-5">
                        {chats.map((chat) => (
                            <div key={chat.id} className="flex items-center gap-3 p-3 border-b">
                                <Avatar className="w-10 h-10">
                                    {/* Path /default-avatar.png ini berarti dari folder public */}
                                    <AvatarImage src={chat.avatar || "/default-avatar.png"} alt={chat.sender} />
                                </Avatar>
                                <div>
                                    <p className="font-medium">{chat.sender}</p>
                                    <p className="text-sm text-gray-500">{chat.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Bottom Navigation */}
            <nav className="chat-bottom-nav">
                <button className="nav-button active">
                    <img
                        src={ChatBubbleIcon} 
                        alt="Chats"
                        className="chat-bubble-icon"
                    />
                    <span>Chats</span>
                </button>
                <button className="nav-button" onClick={() => alert('Groups page not implemented yet!')}>
                    <img
                        src={GroupBeforeIcon}
                        alt="Groups"
                        className="group-icon"
                    />
                    <span>Groups</span>
                </button>
                <button className="nav-button" onClick={() => alert('Profile page not implemented yet!')}>
                    <img
                        src={PeopleBeforeIcon}
                        alt="Profile"
                        className="people-icon"
                    />
                    <span>Profile</span>
                </button>
                <button className="nav-button" onClick={handleLogout}>
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

export default Chatpage;