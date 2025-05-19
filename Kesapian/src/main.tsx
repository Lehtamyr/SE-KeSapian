import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import RegisterPage from './Register_Page/Registerpage';
import ProfilePage from './Profile_Page/Profilepage';
import { AddFriendPage } from './Add_Friend/AddFriendPage';
import LoginPage from './LoginPage/LoginPage';
import Chatpage from './Chat_Page/Chatpage.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ProfilePage />
    </BrowserRouter>
  </StrictMode>
);