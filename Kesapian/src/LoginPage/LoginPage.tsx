import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Facebook, Apple } from "lucide-react";
import { Link } from "react-router-dom";
import "./LoginPage.css"; // Import custom styles
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="Login-container">
      <div className="Login-card">
        <Link to="/" className="text-gray-700 mb-6 inline-block">
          <ArrowLeft className="h-6 w-6" />
        </Link>

        <h1 className="login-header">Login</h1>
        <p className="login-subtext">
          If you don't have an account <Link to="/Register">Register Here</Link>
        </p>

        {/* Attach formValidation to onSubmit */}
        <form className="Login-form">
          <div>
            <label>Email</label>
            <div className="Login-input-container">
              <input
                type="email"
                id="email"
                placeholder="Enter your email address"
                className="Login-input"
              />
            </div>
          </div>

          <div>
            <label>Password</label>
            <div className="login-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                className="login-input"
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
