import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Facebook, Apple } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import "./LoginPage.css";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    setErrors({ ...errors, [id]: "" });
  };

  const validateForm = () => {
    const newErrors = { email: "", password: "" };

    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((err) => err === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await fetch("http://localhost:3000/login", {
          // <--- Endpoint baru untuk login
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json(); // mengambil respons JSON

        if (response.ok) {
          alert("Login successful!");
          navigate("/preferences");
        } else {
          alert("Login failed: " + (data.message || "Unknown error occurred."));
        }
      } catch (error) {
        console.error("Error during login:", error);
        alert(
          "An error occurred during login. Please try again. (Check backend console for details)"
        );
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <Link to="/" className="back-button">
          <ArrowLeft className="h-6 w-6" />
        </Link>

        <h1 className="login-header">Login</h1>
        <p className="login-subtext">
          If you don't have an account <Link to="/register">Register Here</Link>{" "}
          {/* Pastikan '/register' */}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label>Email</label>
            <div className="login-input-container">
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className="login-input"
              />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div>
            <label>Password</label>
            <div className="login-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="login-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-button"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <div className="forgot-password">
            <Link to="/forgot-password" className="text-blue-600">
              Forgot Password?
            </Link>
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>

        <div className="altText">or continue with</div>
        <div className="social-buttons">
          <button className="social-button">
            <Facebook className="text-blue-600" />
          </button>
          <button className="social-button">
            <Apple className="text-black" />
          </button>
          <button className="social-button">
            <img
              src="src/assets/google.png"
              alt="Google"
              className="google-icon"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
