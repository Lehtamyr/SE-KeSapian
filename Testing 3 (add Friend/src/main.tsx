// filepath: d:\Semester 4\SE\Testing1\src\main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import RegisterPage from './Registerpage';  
import Chatpage from './Chatpage';
import { AddFriendPage } from './AddFriendPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AddFriendPage />
    </BrowserRouter>
  </StrictMode>
);