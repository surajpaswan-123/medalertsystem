import "./App.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function App() {
  const [a, b] = useState("");
  const navigate = useNavigate();

  // INPUT STATES
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // VALIDATION FUNCTIONS
  function isValidName(name) {
    const regex = /^[A-Za-z ]{3,}$/; // letters + space, min 3 chars
    return regex.test(name);
  }

  function isValidPhone(phone) {
    const regex = /^[6-9]\d{9}$/; // Indian 10-digit mobile only
    return regex.test(phone);
  }

  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.(com|in|net|org)$/i;
    return regex.test(email);
  }

  // FINAL CONTINUE BUTTON HANDLER
  const handleContinue = () => {
    // NAME CHECK
    if (!isValidName(name)) {
      alert("Please enter a valid full name (min 3 letters, only alphabets).");
      return;
    }

    // EMAIL CHECK
    if (!isValidEmail(email)) {
      alert("Please enter a valid email (example: abc@gmail.com)");
      return;
    }

    // PHONE CHECK
    if (!isValidPhone(phone)) {
      alert("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    // ROLE CHECK
    if (!a) {
      alert("Please select whether you are a Doctor or Patient.");
      return;
    }

    // NAVIGATE BASED ON ROLE
    if (a === "Patient") {
      navigate("/Patient");
    } else if (a === "Doctor") {
      navigate("/Doctor");
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h3>Health contact</h3>
        <p>Your Gateway to Wellness</p>
      </div>

      {/* Form Card */}
      <div className="card">
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name here"
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

      {/* Discover Section */}
      <h2 className="discover-title">Discover Health Connect</h2>

      <div className="feature-card">
        <h3>Seamless Appointments</h3>
        <p>Easy booking, instant confirmations, and reminder alerts.</p>
        <div className="icon">📅</div>
      </div>

      <div className="feature-card">
        <h3>Secure Health Data</h3>
        <p>Encrypted records. Confidential. Accessible anytime.</p>
        <div className="icon">🛡️</div>
      </div>

      <div className="feature-card">
        <h3>Connect with Experts</h3>
        <p>Find specialists, read reviews, and book consultations.</p>
        <div className="icon">👥</div>
      </div>

      {/* Why Choose Us */}
      <h2 className="choose-title">Why Choose Us?</h2>

      <div className="choose-container">
        <div className="choose-item">
          <div className="circle-icon">⏱️</div>
          <p>Saves Time</p>
        </div>

        <div className="choose-item">
          <div className="circle-icon">❤️</div>
          <p>Better Health</p>
        </div>

        <div className="choose-item">
          <div className="circle-icon">🤝</div>
          <p>Trusted by Users</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <a href="#">About Us</a> • <a href="#">Contact</a> • <a href="#">FAQ</a>
        <p>© 2024 Health Connect. All rights reserved.</p>
      </footer>

      <div className="about-section">
        <h2>What is MedAlert System?</h2>
        <p>
          MedAlert is a smart and user-friendly platform designed to help people
          manage their medicines with ease. From timely reminders to expiry alerts,
          MedAlert keeps your health routine smooth and safe.
        </p>

        <h2>How to Use MedAlert?</h2>
        <ul>
          <li>Create your profile as a Doctor or Patient.</li>
          <li>Add your medicines with dosage and timings.</li>
          <li>Get instant reminders for every dose.</li>
          <li>Receive alerts when medicines are close to expiry.</li>
        </ul>

        <h2>Why Should You Use MedAlert?</h2>
        <ul>
          <li>Helps you take medicines on time.</li>
          <li>Prevents the use of expired medicines.</li>
          <li>Keeps all your health data organized.</li>
          <li>Ideal for individuals, families & elders.</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
