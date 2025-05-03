import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Facebook, Apple } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Link } from "react-router-dom";
import "./RegisterPage.css"; // Import custom styles

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="register-container">
      <div className="register-card">
        <Link to="/" className="text-gray-700 mb-6 inline-block">
          <ArrowLeft className="h-6 w-6" />
        </Link>

        <h1 className="register-header">Register</h1>
        <p className="register-subtext">
          If you already have an account <Link to="/login">Login Here</Link>
        </p>

        <form className="register-form">
          <div>
            <label>Email</label>
            <div className="register-input-container">
              <input
                type="email"
                placeholder="Enter your email address"
                className="register-input"
              />
            </div>
          </div>

          <div>
            <label>Username</label>
            <div className="register-input-container">
              <input
                type="text"
                placeholder="Enter your user name"
                className="register-input"
              />
            </div>
          </div>

          <div>
            <label>Password</label>
            <div className="register-input-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="register-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-button"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <div>
            <label>Confirm Password</label>
            <div className="register-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                className="register-input"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle-button"
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <button type="submit" className="register-button">
            Register
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
            <FcGoogle />
          </button>
        </div>
      </div>
    </div>
  );
}
