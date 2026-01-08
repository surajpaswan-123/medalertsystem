import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./AuthScreen.css";

function AuthScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "Patient";

  // Toggle between Sign In and Sign Up
  const [isSignUp, setIsSignUp] = useState(true);

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // PWA Install Popup
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPopup(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setShowInstallPopup(false);
    setDeferredPrompt(null);
  };

  const handleDismissClick = () => {
    setShowInstallPopup(false);
  };

  // Validation Functions
  function isValidName(name) {
    const regex = /^[A-Za-z ]{3,}$/;
    return regex.test(name);
  }

  function isValidPhone(phone) {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone);
  }

  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.(com|in|net|org)$/i;
    return regex.test(email);
  }

  function isValidPassword(password) {
    return password.length >= 6;
  }

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSignUp) {
      // Sign Up Validation
      if (!isValidName(name)) {
        alert("Please enter a valid full name (at least 3 characters).");
        return;
      }
      if (!isValidEmail(email)) {
        alert("Enter a valid email address.");
        return;
      }
      if (!isValidPhone(phone)) {
        alert("Enter a valid 10-digit phone number starting with 6-9.");
        return;
      }
      if (!isValidPassword(password)) {
        alert("Password must be at least 6 characters long.");
        return;
      }
    } else {
      // Sign In Validation
      if (!isValidEmail(email)) {
        alert("Enter a valid email address.");
        return;
      }
      if (!isValidPassword(password)) {
        alert("Password must be at least 6 characters long.");
        return;
      }
    }

    // Navigate based on role
    if (role === "Patient") {
      navigate("/Patient");
    } else {
      navigate("/Doctor");
    }
  };

  return (
    <>
      {/* PWA Install Popup */}
      {showInstallPopup && (
        <div className="install-popup">
          <div className="install-popup-content">
            <h4>📱 Install MedAlert App</h4>
            <p>Get app-like experience with instant access!</p>
            <div className="install-popup-buttons">
              <button className="install-btn" onClick={handleInstallClick}>
                Install App
              </button>
              <button className="dismiss-btn" onClick={handleDismissClick}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Auth Screen */}
      <div className="auth-page">
        <div className="auth-container">
          {/* Back Button */}
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back
          </button>

          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">
              {role === "Doctor" ? "🩺" : "👤"}
            </div>
            <h1 className="auth-title">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="auth-subtitle">
              {isSignUp ? `Sign up as ${role}` : `Sign in as ${role}`}
            </p>
          </div>

          {/* Auth Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Name Field (Sign Up Only) */}
            {isSignUp && (
              <div className="form-field">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Email Field */}
            <div className="form-field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Phone Field (Sign Up Only) */}
            {isSignUp && (
              <div className="form-field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Password Field */}
            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Forgot Password (Sign In Only) */}
            {!isSignUp && (
              <div className="forgot-password">
                <a href="#forgot">Forgot Password?</a>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="auth-submit-btn">
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div className="auth-toggle">
            <p>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button
                className="toggle-btn"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

          {/* Footer Links */}
          <div className="auth-footer">
            <a href="#privacy">Privacy Policy</a>
            <span>•</span>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </div>
    </>
  );
}

export default AuthScreen;
