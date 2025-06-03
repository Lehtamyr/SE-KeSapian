import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import './GroupChatPage.css';

interface GroupMessage {
  id: number;
  group_id: number;
  sender_id: number;
  message: string;
  is_pinned: boolean;
  created_at: string;
  sender?: {
    username?: string;
    avatar?: string;
  };
}

interface GroupDetails {
  id: number;
  name: string;
  description?: string;
  members?: Array<{
    user: {
      id: number;
      username: string;
      avatar?: string;
    };
  }>;
}

const socket: Socket = io('http://localhost:3000');

const GroupChatPage = () => {
  const { chat: groupId } = useParams<{ chat: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // mengambil pesan yang di-pin (hanya satu, jika ada)
  const pinnedMessage = messages.find((msg) => msg.is_pinned);

  // Scroll ke pesan tertentu
  const scrollToMessage = (id: number) => {
    const el = messageRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Optionally highlight
      el.classList.add('highlight-pinned');
      setTimeout(() => el.classList.remove('highlight-pinned'), 1200);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId || !groupId) {
      navigate('/login');
      return;
    }

    const numGroupId = parseInt(groupId);
    const numUserId = parseInt(userId);
    setLoggedInUserId(numUserId);

    const fetchGroupData = async () => {
      try {
        const groupResponse = await fetch(`http://localhost:3000/api/groups/${numUserId}`);
        if (!groupResponse.ok) throw new Error('Failed to fetch groups');
        const groups = await groupResponse.json();
        const currentGroup = groups.find((g: GroupDetails) => g.id === numGroupId);
        if (!currentGroup) throw new Error('Group not found');
        setGroupDetails(currentGroup);

        const messagesResponse = await fetch(`http://localhost:3000/api/group-messages/${numGroupId}`);
        if (!messagesResponse.ok) throw new Error('Failed to fetch messages');
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);

        socket.emit('joinGroup', numGroupId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'An error occurred');
        navigate('/groups');
      }
    };

    fetchGroupData();

    const handleNewMessage = (newMessage: GroupMessage) => {
      setMessages(prev => [...prev, newMessage]);
    };

    const handleMessagePinned = (pinnedMessage: GroupMessage) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === pinnedMessage.id
            ? { ...msg, is_pinned: pinnedMessage.is_pinned }
            : { ...msg, is_pinned: false }
        )
      );
    };

    socket.on('newGroupMessage', handleNewMessage);
    socket.on('messagePinned', handleMessagePinned);

    return () => {
      socket.off('newGroupMessage', handleNewMessage);
      socket.off('messagePinned', handleMessagePinned);
      if (groupId) {
        socket.emit('leaveGroup', parseInt(groupId));
      }
    };
  }, [groupId, navigate]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !loggedInUserId || !groupId) return;

    try {
      const response = await fetch('http://localhost:3000/api/group-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: parseInt(groupId),
          sender_id: loggedInUserId,
          message: message.trim()
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      setMessage('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Toggle pin/unpin
  const handlePinMessage = async (messageId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/pin-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_id: messageId,
          group_id: groupId
        }),
      });

      if (!response.ok) throw new Error('Failed to pin/unpin message');
      // Success: handled by socket event
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to pin/unpin message');
    }
  };

  if (!groupDetails) return <div className="groupchat-loading">Loading group...</div>;

  return (
    <div className="groupchat-pc-container">
      {/* Header */}
      <header className="groupchat-pc-header">
        <button className="groupchat-pc-back" onClick={() => navigate('/groups')}>
          {/* Back Icon */}
          <svg width="28" height="28" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div className="groupchat-pc-avatar">
          <div className="groupchat-pc-avatar-inner">
            {groupDetails.name ? groupDetails.name.charAt(0).toUpperCase() : "G"}
          </div>
        </div>
        <div className="groupchat-pc-title">
          <div className="groupchat-pc-groupname">{groupDetails.name}</div>
        </div>
        <div className="groupchat-pc-header-actions">
          {/* Video Call */}
          <button className="groupchat-pc-header-icon">
            <svg width="24" height="24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="2" y="7" width="15" height="10" rx="2" />
              <polygon points="17 7 22 12 17 17 17 7" />
            </svg>
          </button>
          {/* Phone Call */}
          <button className="groupchat-pc-header-icon">
            <svg width="24" height="24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M22 16.92V21a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h4.09a2 2 0 0 1 2 1.72c.13 1.13.37 2.23.72 3.28a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c1.05.35 2.15.59 3.28.72A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Pinned Message */}
      {pinnedMessage && (
        <div className="groupchat-pinned-message">
          <span className="pin-icon">📍</span>
          <div className="pinned-content">
            <div className="pinned-username">{pinnedMessage.sender?.username || '-'}</div>
            <div className="pinned-text">{pinnedMessage.message}</div>
            <div className="pinned-time">
              {pinnedMessage.created_at
                ? new Date(pinnedMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''}
            </div>
          </div>
          <div className="pinned-actions">
            <button className="unpin-btn" onClick={() => handlePinMessage(pinnedMessage.id)}>
              Unpin
            </button>
            <button className="goto-btn" onClick={() => scrollToMessage(pinnedMessage.id)}>
              Go to message
            </button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="groupchat-pc-chat-area" ref={chatAreaRef}>
        {messages.length === 0 ? (
          <div className="groupchat-empty-chat">
            <p>Say hi to your group members!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.sender_id === loggedInUserId;
            const username = msg.sender?.username || '';
            return (
              <div
                key={msg.id}
                ref={el => (messageRefs.current[msg.id] = el)}
                className={`groupchat-message-wrapper ${isOwn ? 'sent' : 'received'}`}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {/* Avatar */}
                <div className="groupchat-message-avatar">
                  <div className="groupchat-avatar-inner">
                    {username
                      ? username.charAt(0).toUpperCase()
                      : '?'}
                  </div>
                </div>
                {/* Bubble */}
                <div className={`groupchat-message-bubble${msg.is_pinned ? ' pinned' : ''}`}>
                  {/* Username hanya untuk user lain */}
                  {!isOwn && (
                    <div className="groupchat-message-sender">{username || '-'}</div>
                  )}
                  <div className="groupchat-message-text">{msg.message}</div>
                  <div className="groupchat-message-footer">
                    <span className="groupchat-message-time">
                    {msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                        : ''}
                    </span>
                    {isOwn && (
                      <span className="groupchat-message-status">✓✓</span>
                    )}
                  </div>
                  {/* Pin button saat hover */}
                  {hoveredMessageId === msg.id && (
                    <div className="groupchat-message-actions">
                      <button
                        className="groupchat-pin-button"
                        onClick={() => handlePinMessage(msg.id)}
                        title={msg.is_pinned ? "Unpin this message" : "Pin this message"}
                      >
                        {msg.is_pinned ? "📍" : "📌"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="groupchat-pc-input-area">
        <button className="groupchat-pc-attach-btn">
          {/* Attach/Plus Icon */}
          <svg width="24" height="24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </button>
        <input
          type="text"
          className="groupchat-message-input"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button className="groupchat-pc-send-btn" onClick={handleSendMessage}>
          {/* Send Icon */}
          <svg width="24" height="24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GroupChatPage;