import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PC.css'; 
import { Avatar, AvatarFallback } from "../components/ui/avatar"; 
import io, { Socket } from 'socket.io-client';
import { toast } from 'sonner'; 

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  messageText: string;
  timestamp: string; 
}

interface ChatPartnerDetails {
  username: string;
}

const socket: Socket = io('http://localhost:3000'); 

const ChatPersonPage: React.FC = () => {
  const { chatPartnerId } = useParams<{ chatPartnerId: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatPartnerDetails, setChatPartnerDetails] = useState<ChatPartnerDetails | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]); 
  const chatAreaRef = useRef<HTMLDivElement>(null); 

  // Effect untuk menginisialisasi user, mengambil history, dan MENDENGARKAN SOCKET.IO
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      const currentUserId = parseInt(storedUserId);
      setLoggedInUserId(currentUserId);
      const partnerIdNum = parseInt(chatPartnerId || '0');

      if (partnerIdNum > 0) {
        fetchChatHistory(currentUserId, partnerIdNum);
        fetchChatPartnerDetails(partnerIdNum);
        fetchSuggestions(currentUserId); // Panggil fungsi ini

        socket.emit('joinChat', currentUserId);
        console.log(`Frontend: Emitting joinChat for user ID: ${currentUserId}`);
      } else {
        alert('Invalid chat partner ID.');
        navigate('/chat');
      }
    } else {
      alert('Please log in first.');
      navigate('/login');
    }

    const handleNewMessage = (newMessage: Message) => {
      console.log('Frontend: Received new message via Socket.IO:', newMessage);
      setChatMessages((prevMessages) => {
        const isDuplicate = prevMessages.some(msg => msg.id === newMessage.id);
        if (!isDuplicate) {
          return [...prevMessages, newMessage];
        }
        return prevMessages;
      });
    };

    // --- LISTENER UNTUK offensiveWordDetected ---
    const handleOffensiveWordDetected = (data: { message: string }) => {
        console.warn('Kata kasar terdeteksi oleh backend:', data.message);
        toast.error(data.message); // Menampilkan notifikasi peringatan
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('offensiveWordDetected', handleOffensiveWordDetected); // DAFTARKAN LISTENER INI

    return () => {
      console.log('Frontend: Cleaning up Socket.IO listeners');
      socket.off('newMessage', handleNewMessage);
      socket.off('offensiveWordDetected', handleOffensiveWordDetected); // HAPUS LISTENER SAAT KOMPONEN UNMOUNT
    };

  }, [chatPartnerId, navigate]); 

  // Effect untuk menggulir ke bawah setiap kali chatMessages berubah
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [chatMessages]); // Dipicu setiap kali chatMessages berubah

  const fetchChatHistory = async (currentUserId: number, partnerId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/messages/${currentUserId}/${partnerId}`);
      if (!response.ok) {
        const errorText = await response.text(); // Baca respons error
        console.error('Failed to fetch chat history response:', errorText);
        throw new Error('Failed to fetch chat history');
      }
      const data: Message[] = await response.json();
      setChatMessages(data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      alert('Failed to load chat history. Please try again.');
    }
  };

  const fetchChatPartnerDetails = async (partnerId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/users/${partnerId}`);
      if (!response.ok) {
        const errorText = await response.text(); // Baca respons error
        console.error('Failed to fetch partner details response:', errorText);
        throw new Error('Failed to fetch partner details');
      }
      const data = await response.json();
      setChatPartnerDetails({ username: data.username });
    } catch (error) {
      console.error('Error fetching chat partner details:', error);
      setChatPartnerDetails({ username: 'Unknown User' }); // Fallback
      alert('Failed to load chat partner details. Please try again.');
    }
  };

  const fetchSuggestions = async (userId: number) => {
  try {
    const response = await fetch(`http://localhost:3000/api/suggestions/${userId}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch suggestions response:', errorText);
      throw new Error('Failed to fetch suggestions');
    }
    const data = await response.json();
    setSuggestions(data.suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    setSuggestions([]);
  }
};

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion); 
  };

  const handleSendMessage = async () => {
    if (message.trim() && loggedInUserId && chatPartnerId) {
      try {
        const newMessagePayload = {
          senderId: loggedInUserId,
          receiverId: parseInt(chatPartnerId),
          messageText: message.trim(),
        };

        // Mengirim pesan melalui HTTP POST API (ini akan memicu Socket.IO di backend)
        const response = await fetch('http://localhost:3000/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newMessagePayload),
        });

        if (!response.ok) {
          const errorText = await response.text(); // Baca respons error
          console.error('Failed to send message response:', errorText);
          throw new Error('Failed to send message');
        }

        setMessage(''); 
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message.');
      }
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/chat')}>
            {/* SVG atau ikon panah kembali */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-left">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          {chatPartnerDetails && (
            <>
              <Avatar className="avatar">
                <AvatarFallback>
                  {chatPartnerDetails.username ? chatPartnerDetails.username.charAt(0).toUpperCase() : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="contact-info">
                <div className="contact-name">{chatPartnerDetails.username}</div>
              </div>
            </>
          )}
        </div>
        <div className="header-right">
          {/* Ikon Video Call */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-video">
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
          {/* Ikon Phone Call */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-phone">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-3.67-3.67A19.79 19.79 0 0 1 2.05 2.18 2 2 0 0 1 4 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-1.11 2.38 10 10 0 0 0 7.82 7.82 2 2 0 0 1 2.38-1.11 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </div>
      </header>

      {/* Chat Area - Menampilkan pesan */}
      <div className="chat-area" ref={chatAreaRef}>
        {chatMessages.length === 0 ? (
          <div className="chat-empty">
            <p className="text-lg">Say hi to {chatPartnerDetails?.username || 'this user'}!</p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div key={msg.id} className={`message ${msg.senderId === loggedInUserId ? 'sent' : 'received'}`}>
              <div className="message-content">
                {msg.messageText}
              </div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                {msg.senderId === loggedInUserId && <span className="checkmark">✓</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Area Saran Chat */}
      {suggestions.length > 0 && (
        <div className="chat-suggestions-area">
          {suggestions.map((sug, index) => (
            <button
              key={index}
              className="suggestion-button"
              onClick={() => handleSuggestionClick(sug)} // <-- PANGGIL FUNGSI INI
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Message Input Area */}
      <div className="message-input-area">
        <button className="add-button">
          {/* Ikon Plus (Contoh) */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-plus-circle">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>
        <input
          type="text"
          className="message-input"
          placeholder="Type a message ..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
        />
        <button className="send-button" onClick={handleSendMessage}>
          {/* Ikon Kirim (Contoh) */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-send">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatPersonPage;