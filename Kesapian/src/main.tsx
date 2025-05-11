// filepath: d:\Semester 4\SE\Testing1\src\main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import RegisterPage from './Register_Page/Registerpage';
import ProfilePage from './Profile_Page/Profilepage';
import { AddFriendPage } from './Add_Friend/AddFriendPage';
import LoginPage from './LoginPage/LoginPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <LoginPage/>
    </BrowserRouter>
  </StrictMode>
);