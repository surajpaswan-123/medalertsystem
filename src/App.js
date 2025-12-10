import "./App.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function App() {    
   const [a, b] = useState('');
  const navigate = useNavigate();

  const handleCountinue = () => {

    if (!a) {
      alert("Please select Patient or Doctor");
      return;
    }

    if (a === 'Patient') {
      navigate('/Patient');
    } else if (a === 'Doctor') {
      navigate('/Doctor');
    }
  };

  return(
    <div className="container">
      {/* Header */}
      <div className="header">
        <h3>health contact</h3>
        <h3>health contact</h3>
        <h3>health contact</h3>
        <h3>health contact</h3>
        <p>Your Gateway to Wellness</p>
      </div>
      {/* Form Card */}
      <div className="card">
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" placeholder="Enter your full name here" />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input type="text" placeholder="Enter your phone number" />
        </div>
        <p className="role-text">Are you a:</p>
        <div className="role-buttons">
         <button 
  className={`role-btn doctor ${a === 'Doctor' ? 'active' : ''}`} 
  onClick={() => b('Doctor')}
>
  Doctor
</button>

<button 
  className={`role-btn patient ${a === 'Patient' ? 'active' : ''}`} 
  onClick={() => b('Patient')}
>
  Patient
</button>

        </div>
        <button className="continue-btn" onClick={handleCountinue}>Continue</button>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <span>•</span>
          <a href="#">Terms of Service</a>
        </div>
      </div>

      {/* --- Discover Section --- */}
      <h2 className="discover-title">Discover Health Connect</h2>

      <div className="feature-card">
        <h3>Seamless Appointments</h3>
        <p>Easy booking, instant confirmations, and reminder alerts.</p>
        <div className="icon">📅</div>
      </div>

      <div className="feature-card">
        <h3>Secure Health Data</h3>
        <p>Encrypted records. Confidential. Accessible anytime.</p>
        <div className="icon">🛡️ </div>
      </div>

      <div className="feature-card">
        <h3>Connect with Experts</h3>
        <p>Find specialists, read reviews, and book consultations.</p>
        <div className="icon">👥</div>
      </div>

      {/* --- Why Choose Us --- */}
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
        <a href="#">About Us</a> • 
        <a href="#">Contact</a> • 
        <a href="#">FAQ</a>
        <p>© 2024 Health Connect. All rights reserved.</p>
      </footer>

      <div className="about-section">

  <h2>What is MedAlert System?</h2>
  <p>
    MedAlert is a smart and user-friendly platform designed to help people manage                
    their medicines with ease. From getting timely medicine reminders to tracking
    expiry dates, MedAlert ensures you never miss a dose and never use expired medicines.
  </p>

  <h2>How to Use MedAlert?</h2>
  <ul>
    <li>Create your profile as a Doctor or Patient.</li>
    <li>Add your medicines with dosage and timings.</li>
    <li>Get instant reminders for every dose.</li>
    <li>Receive alerts when medicines are close to expiry.</li>
    <li>Doctors can verify expiry dates using the scanner feature.</li>
  </ul>

  <h2>Why Should You Use MedAlert?</h2>
  <ul>
    <li>Helps you take medicines on time.</li>
    <li>Prevents the use of expired medicines.</li>
    <li>Keeps all your health data organized.</li>
    <li>Perfect for individuals, families & elderly users.</li>
    <li>Designed to simplify daily health routines.</li>
  </ul>

</div>

    </div>
  );
}

export default App;
