import React from "react";
import { SearchIcon, UserPlusIcon } from "lucide-react";
import { Avatar, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import './ChatPage.css';

const Chatpage = (): React.ReactElement => {
    interface Chat {
        avatar?: string;
        name: string;
        lastMessage: string;
    }

    const [chats] = React.useState<Chat[]>([]);

    return (
        <div className="chat-container">
            {/* Header */}
            <header className="chat-header">
                <div className="chat-header-name">KeSapian</div>
                <Avatar className="chat-avatar">
                    <AvatarImage src="/avatar-1.png" alt="Profile" />
                </Avatar>
                <div className="chat-actions">
                    <SearchIcon className="w-[27px] h-[26px] text-black" />
                    <UserPlusIcon className="w-[26px] h-[26px] text-black" />
                </div>
            </header>

            {/* Chat List */}
            <ScrollArea className="chat-scroll-area">
                {chats.length === 0 ? (
                    <div className="chat-empty">
                        <p className="text-lg">No chats yet</p>
                        <p className="text-sm">Add contacts to start chatting</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-start gap-5 p-5">
                        {chats.map((chat, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 border-b">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={chat.avatar || "/default-avatar.png"} alt={chat.name} />
                                </Avatar>
                                <div>
                                    <p className="font-medium">{chat.name}</p>
                                    <p className="text-sm text-gray-500">{chat.lastMessage}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Bottom Navigation */}
            <nav className="chat-bottom-nav">
                <button className="active">
                <img 
                    src="src/assets/chat bubble.png" 
                    alt="Chat Bubble" 
                    className="chat-bubble-icon" 
                /> {/* Gambar untuk Chats */}
        <span>Chats</span>
                </button>
                <button className="inactive">
                <img
                    src="src/assets/groupBefore.png" 
                    alt="Group" 
                    className="group-icon" 
                /> {/* Ikon untuk Groups */}
        <span>Groups</span>
                </button>
                <button className="inactive">
                <img
                    src="src/assets/poepleBefore.png"
                    alt="People"
                    className="people-icon"
                /> {/* Ikon untuk Profile */}
        <span>Profile</span>
                </button>
                <button className="inactive">
                <img
                    src="src/assets/moreBefore.png"
                    alt="More"
                    className="more-icon"
                /> {/* Ikon untuk More */}
        <span>More</span>
                </button>
            </nav>
        </div>
    );
};

export default Chatpage;