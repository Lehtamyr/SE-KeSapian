import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Facebook, Apple } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Link } from "react-router-dom";
import "./RegisterPage.css"; 

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    setErrors({ ...errors, [id]: "" }); 
  };

  const validateForm = () => {
    const newErrors: typeof errors = {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    };

    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }

    if (!formData.username) {
      newErrors.username = "Username is required.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (validateForm()) {
    try {
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("User registered successfully!");
      } else {
        alert("Registration failed: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
};


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

        <form className="register-form" onSubmit={handleSubmit}>
          <div>
            <label>Email</label>
            <div className="register-input-container">
              <input
                type="email"
                id="email"
                placeholder="Enter your email address"
                className="register-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div>
            <label>Username</label>
            <div className="register-input-container">
              <input
                type="text"
                id="username"
                placeholder="Enter your user name"
                className="register-input"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            {errors.username && <p className="error-text">{errors.username}</p>}
          </div>

          <div>
            <label>Password</label>
            <div className="register-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                className="register-input"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-button"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <div>
            <label>Confirm Password</label>
            <div className="register-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm your password"
                className="register-input"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle-button"
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="error-text">{errors.confirmPassword}</p>
            )}
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
