// src/Patient.js
import React from "react";
import "./Patient.css";
import AutoSchedule from "./AutoSchedule";

function Patient() {
  return (
    <div className="patient-page">
      <header className="patient-header">
        <h1>👤 Patient Panel</h1>
        <p>Easily add medicines, set reminders & stay safe with MedAlert.</p>
      </header>

      <div className="patient-grid">

        {/* Auto Schedule System */}
        <section className="patient-card patient-card-full">
          <AutoSchedule />
        </section>

      </div>
    </div>
  );
}

export default Patient;
