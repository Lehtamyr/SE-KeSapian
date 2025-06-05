import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './LoginPage/LoginPage';
import RegisterPage from './Register_Page/Registerpage';
import PreferencesPage from './Choose_Pref/ChoosePref';
import Chatpage from './Chat_Page/Chatpage';
import { AddFriendPage } from './Add_Friend/AddFriendPage';
import ProfilePage from './Profile_Page/Profilepage'; // Import ProfilePage
import ChatPersonPage from "./Chat_Person/ChatPersonPage"
import GroupPage from './Group_Page/groupPage';
import AddGroupPage from './AddGroup_Page/AddgoupPage';
import GroupChatPage from './GroupChat_Page/GroupChatPage';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
      
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/preferences" element={<PreferencesPage />} />
        <Route path="/chat" element={<Chatpage />} /> {/* Rute untuk ChatPage */}
        <Route path="/add-friend" element={<AddFriendPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/chat/person/:chatPartnerId" element={<ChatPersonPage />} /> 
        <Route path="/groups" element={<GroupPage />} />
        <Route path="/create-group" element={<AddGroupPage />} />
        <Route path='/group-chat/:chat' element={<GroupChatPage />} />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);