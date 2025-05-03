// filepath: d:\Semester 4\SE\Testing1\src\main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import './index.css';
import RegisterPage from './Registerpage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>
  </StrictMode>
);