import "./App.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function App() {
  const navigate = useNavigate();

  // INPUT STATES
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [a, b] = useState("");

  // VALIDATION FUNCTIONS
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

  // SUBMIT HANDLER
  const handleContinue = () => {
    if (!isValidName(name)) {
      alert("Please enter a valid full name.");
      return;
    }
    if (!isValidEmail(email)) {
      alert("Enter a valid email.");
      return;
    }
    if (!isValidPhone(phone)) {
      alert("Enter a valid 10-digit phone.");
      return;
    }
    if (!a) {
      alert("Please select whether you are a Doctor or Patient.");
      return;
    }

    if (a === "Patient") navigate("/Patient");
    else navigate("/Doctor");
  };

  /* ---------------------------
        PWA INSTALL POPUP CODE
     --------------------------- */
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

  // ✅ NEW: Dismiss handler
const handleDismissClick = () => {
  setShowInstallPopup(false);
};


  return (
    <>
      {/* 🔥 INSTALL POPUP */}
      {showInstallPopup && (
        <div
          style={{
            position: "fixed",
           top: "20px",
           right: "20px",
            bottom: "auto",

            background: "white",
            padding: "15px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 9999,
            animation: "popupFade 0.3s ease"
          }}
        >
          <h4>Install MedAlert App</h4>
          <p>Get app-like experience with instant access!</p>

          <button
            onClick={handleInstallClick}
            style={{
              padding: "10px 18px",
              background: "#4e73df",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Install App
          </button>

          
          {/* ❌ DISMISS BUTTON */}
          <button
            onClick={handleDismissClick}
            style={{
              padding: "10px 18px",
              background: "#e0e0e0",
              color: "#333",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 🔥 MAIN UI */}
      <div className="container">
        <div className="header">
          <h3>Health contact</h3>
          <p>Your Gateway to Wellness</p>
        </div>

        <div className="card">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Mail</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <p className="role-text">Are you a:</p>
          <div className="role-buttons">
            <button
              className={`role-btn doctor ${a === "Doctor" ? "active" : ""}`}
              onClick={() => b("Doctor")}
            >
              Doctor
            </button>

            <button
              className={`role-btn patient ${a === "Patient" ? "active" : ""}`}
              onClick={() => b("Patient")}
            >
              Patient
            </button>
          </div>

          <button className="continue-btn" onClick={handleContinue}>
            Continue
          </button>

          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <span>•</span>
            <a href="#">Terms of Service</a>
          </div>
        </div>

        <h2 className="discover-title">Discover Health Connect</h2>

        <div className="feature-card">
          <h3>Seamless Appointments</h3>
          <p>Easy booking, instant confirmations, and reminders.</p>
          <div className="icon">📅</div>
        </div>

        <div className="feature-card">
          <h3>Secure Health Data</h3>
          <p>Encrypted records. Confidential. Anytime access.</p>
          <div className="icon">🛡️</div>
        </div>

        <div className="feature-card">
          <h3>Connect with Experts</h3>
          <p>Find specialists, read reviews, book consultations.</p>
          <div className="icon">👥</div>
        </div>

        <footer className="footer">
          <a href="#">About Us</a> • <a href="#">Contact</a> • <a href="#">FAQ</a>
          <p>© 2024 Health Connect. All rights reserved.</p>
        </footer>
        <div className="about-section"> <h2>What is MedAlert System?</h2> <p> MedAlert is a smart and user-friendly platform designed to help people manage their medicines with ease. From timely reminders to expiry alerts, MedAlert keeps your health routine smooth and safe. </p>
    </div>
      </div>
    </>
  );
}

export default App;
