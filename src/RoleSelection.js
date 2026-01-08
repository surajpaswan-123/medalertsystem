import React from "react";
import { useNavigate } from "react-router-dom";
import "./RoleSelection.css";

function RoleSelection() {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    // Navigate to auth screen with role parameter
    navigate(`/auth?role=${role}`);
  };

  return (
    <div className="role-selection-page">
      <div className="role-container">
        {/* Header Section */}
        <div className="role-header">
          <div className="logo-section">
            <div className="logo-icon">💊</div>
            <h1 className="app-title">MedAlert</h1>
          </div>
          <p className="app-tagline">Your Gateway to Wellness</p>
          <p className="role-subtitle">Choose your role to continue</p>
        </div>

        {/* Role Cards */}
        <div className="role-cards">
          {/* Doctor Card */}
          <div 
            className="role-card doctor-card"
            onClick={() => handleRoleSelect("Doctor")}
          >
            <div className="role-icon">🩺</div>
            <h2 className="role-title">Doctor</h2>
            <p className="role-description">
              Manage patient medicines, track expiry dates, and send reminders
            </p>
            <div className="role-features">
              <span className="feature-tag">Medicine Tracking</span>
              <span className="feature-tag">Expiry Alerts</span>
              <span className="feature-tag">Patient Management</span>
            </div>
            <button className="role-select-btn doctor-btn">
              Continue as Doctor →
            </button>
          </div>

          {/* Patient Card */}
          <div 
            className="role-card patient-card"
            onClick={() => handleRoleSelect("Patient")}
          >
            <div className="role-icon">👤</div>
            <h2 className="role-title">Patient</h2>
            <p className="role-description">
              Set medicine reminders, track your health, and never miss a dose
            </p>
            <div className="role-features">
              <span className="feature-tag">Smart Reminders</span>
              <span className="feature-tag">Dose Tracking</span>
              <span className="feature-tag">Health Monitoring</span>
            </div>
            <button className="role-select-btn patient-btn">
              Continue as Patient →
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="role-footer">
          <a href="#about">About Us</a>
          <span>•</span>
          <a href="#privacy">Privacy Policy</a>
          <span>•</span>
          <a href="#terms">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;
