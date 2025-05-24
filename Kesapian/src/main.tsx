import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { BrowserRouter, Routes, Route } from "react-router-dom";
// import RegisterPage from './Register_Page/Registerpage';
// import LoginPage from './LoginPage/LoginPage';
import PreferencesPage from "./Choose_Pref/ChoosePref";
import LoginPage from "./LoginPage/LoginPage";
import RegisterPage from "./Register_Page/Registerpage";
// import { AddFriendPage } from './Add_Friend/AddFriendPage';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Route untuk halaman preferences */}
        <Route path="/preferences" element={<PreferencesPage />} />
        {/* Route untuk halaman utama */}
        <Route path="/" element={<LoginPage />} /> {/* Default ke Login Page */}
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
