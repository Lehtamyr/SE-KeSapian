import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddGroupPage.css';

interface Friend {
  id: number;
  username: string;
}

const AddGroupPage = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchFriends = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/friends/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch friends');
      const data = await response.json();
      setFriends(data.friends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  fetchFriends();
}, [navigate]);

  const handleFriendToggle = (friendId: number) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId) 
        : [...prev, friendId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          created_by: parseInt(userId),
          is_private: isPrivate,
          members: selectedFriends
        }),
      });

      if (!response.ok) throw new Error('Failed to create group');
      navigate('/groups');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  if (loading) return <div>Loading friends...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="add-group-container">
      <h1>Create New Group</h1>
      
      <form onSubmit={handleSubmit} className="group-form">
        <div className="form-group">
          <label>Group Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            Private Group
          </label>
        </div>

        <div className="form-group">
          <label>Add Friends</label>
          <div className="friends-list">
            {friends.map(friend => (
              <div key={friend.id} className="friend-item">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => handleFriendToggle(friend.id)}
                  />
                  {friend.username}
                </label>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="submit-button">
          Create Group
        </button>
      </form>
    </div>
  );
};

export default AddGroupPage;