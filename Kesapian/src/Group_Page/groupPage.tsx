import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { ScrollArea } from "../../components/ui/scroll-area";
import './GroupPage.css';
import ChatBubbleIcon from "../assets/icons/bubblechat-before.png";
import PeopleBeforeIcon from "../assets/icons/poepleBefore.png";
import MoreBeforeIcon from "../assets/icons/moreBefore.png";
import groupAfter from "../assets/icons/groupAfter.png";

interface Group {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  is_private: boolean;
  messages?: Array<{
    id: number;
    message: string;
    created_at: string;
  }>;
  members?: Array<{
    user: {
      id: number;
      username: string;
    };
  }>;
}

const GroupPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      const userId = localStorage.getItem('userId');
      const storedUsername = localStorage.getItem('username');
      setUsername(storedUsername);
      if (!userId) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/api/groups/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch groups');
        const data = await response.json();
        setGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [navigate]);

  const handleCreateGroup = () => navigate('/create-group');
  const handleGroupClick = (groupId: number) => navigate(`/group-chat/${groupId}`);
  const handleChatClick = () => navigate('/chat');
  const handleGroupsClick = () => navigate('/groups');
  const handleProfileClick = () => navigate('/profile');
  const handleMoreClick = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return <div className="loading-page">Loading groups...</div>;
  if (error) return <div className="error-page">{error}</div>;

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="chat-header-name">KeSapian - Welcome, {username || 'User'}</div>
        <div className="chat-actions">
          <button onClick={handleCreateGroup} className='addgroupheader'>
            <span>➕</span>          
          </button>
        </div>
      </header>

      <ScrollArea className="chat-scroll-area">
        {groups.length === 0 ? (
          <div className="chat-empty">
            <p className="text-lg">You don't have any groups yet.</p>
            <button onClick={handleCreateGroup} className="create-group-button">
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="chat-list-section">
            <h2>Your Groups</h2>
            {groups.map((group) => (
              <div
                key={group.id}
                className="chat-card"
                onClick={() => handleGroupClick(group.id)}
              >
                <div className="chat-card-left">
                  <Avatar className="chat-avatar">
                    <AvatarFallback>{group.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="chat-card-content">
                    <p className="chat-username">{group.name}</p>
                    <p className="chat-message">
                      {group.messages?.[0]?.message.substring(0, 30) || 'Start chatting!'}
                    </p>
                  </div>
                </div>
                <div className="chat-card-right">
                  {group.messages?.[0]?.created_at && (
                    <p className="chat-datetime">
                      {new Date(group.messages[0].created_at).toLocaleDateString('en-GB')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <nav className="chat-bottom-nav">
        <button className={`nav-button ${location.pathname === '/chat' ? 'active' : ''}`} onClick={handleChatClick}>
          <img src={ChatBubbleIcon} alt="Chats" />
          <span>Chats</span>
        </button>
        <button className={`nav-button ${location.pathname === '/groups' ? 'active' : ''}`} onClick={handleGroupsClick}>
          <img src={groupAfter} alt="Groups" />
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

export default GroupPage;
