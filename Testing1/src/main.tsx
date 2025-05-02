import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Message from './Message.tsx'
import RegisterPage from './Registerpage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>

    
    <RegisterPage />
  </StrictMode>,


)
