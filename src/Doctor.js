import React, { useState, useEffect } from "react";
import "./Doctor.css";

function Doctor() {

  // ⭐ MULTIPLE IMAGES STATE (Correct)
  const [scanImages, setScanImages] = useState([]);

  // Tone system
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [systemTones] = useState([
    { id: "tone1", label: "Soft Beep", src: "/tone1.mp3" },
    { id: "tone2", label: "Digital Chime", src: "/tone1.mp3" },
    { id: "tone3", label: "Alert Tone", src: "/tone1.mp3" },
  ]);
  const [selectedTone, setSelectedTone] = useState("tone1");
  const [customTone, setCustomTone] = useState(null);
  const currentTone = customTone || systemTones.find(t => t.id === selectedTone);

  // Popup States
  const [expiryPopup, setExpiryPopup] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  // Medicine Form
  const [medicineForm, setMedicineForm] = useState({
    name: "",
    batch: "",
    expiry: "",
    note: ""
  });

  const [doctorMedicines, setDoctorMedicines] = useState([]);

  // DELETE MEDICINE
  const deleteMedicine = (id) => {
    const updatedList = doctorMedicines.filter((med) => med.id !== id);
    setDoctorMedicines(updatedList);
  };

  // SORT by expiry
  const sortByExpiry = () => {
    const sorted = [...doctorMedicines].sort((a, b) => {
      return new Date(a.expiry) - new Date(b.expiry);
    });
    setDoctorMedicines(sorted);
  };

  // Tone Play
  const playTone = () => {
    const audio = document.getElementById("expiry-tone");
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
  };

  // Tone Stop
  const stopTone = () => {
    const audio = document.getElementById("expiry-tone");
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };

  // Test tone toggle
  const toggleTestTone = () => {
    const audio = document.getElementById("expiry-tone");
    if (!audio) return;

    if (isTestPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setIsTestPlaying(false);
    } else {
      audio.currentTime = 0;
      audio.play();
      setIsTestPlaying(true);
    }
  };

  // Custom tone upload
  const handleCustomToneUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);

    setCustomTone({
      id: "custom",
      label: "My Tone",
      src: url
    });
  };

  // SNOOZE BUTTON
  const handleSnooze = () => {
    if (!expiryPopup) return;

    const date = new Date();
    date.setMinutes(date.getMinutes() + 5);
    console.log("Snoozed for 5 mins:", date);

    setIsClosing(true);
    stopTone();

    setTimeout(() => {
      setExpiryPopup(null);
      setIsClosing(false);
    }, 200);
  };

  // EXPIRY STATUS FUNCTION
  function getExpiryStatus(expiryDate) {
    if (!expiryDate) return { label: "Not Set", type: "neutral" };

    const today = new Date();
    const exp = new Date(expiryDate);
    const diff = exp.getTime() - today.getTime();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { label: "Expired", type: "expired" };
    if (daysLeft <= 5) return { label: "Expiring Soon", type: "soon" };

    return { label: "Safe", type: "safe" };
  }

  // ADD MEDICINE
  const addMedicine = () => {
    if (!medicineForm.name || !medicineForm.expiry) {
      alert("Please fill medicine name & expiry date");
      return;
    }

    const newMed = {
      id: Date.now(),
      name: medicineForm.name,
      batch: medicineForm.batch,
      expiry: medicineForm.expiry,
      note: medicineForm.note,
      images: scanImages
    };

    setDoctorMedicines([...doctorMedicines, newMed]);

    // reset
    setMedicineForm({ name: "", batch: "", expiry: "", note: "" });
    setScanImages([]);
  };

  // AUTO EXPIRY CHECKER (1 min)
  useEffect(() => {
    const checkExpiry = setInterval(() => {
      const now = new Date();

      doctorMedicines.forEach((med) => {
        const exp = new Date(med.expiry);

        const diff = exp.getTime() - now.getTime();
        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

        // 1 day before expiry
        if (daysLeft === 1) {
          setExpiryPopup({
            name: med.name,
            image: med.images?.[0],
            expiry: med.expiry
          });
          playTone();
        }

        // 5 minutes before expiry
        const fiveMinBefore = new Date(exp);
        fiveMinBefore.setMinutes(fiveMinBefore.getMinutes() - 5);

        if (
          now.getFullYear() === fiveMinBefore.getFullYear() &&
          now.getMonth() === fiveMinBefore.getMonth() &&
          now.getDate() === fiveMinBefore.getDate() &&
          now.getHours() === fiveMinBefore.getHours() &&
          now.getMinutes() === fiveMinBefore.getMinutes()
        ) {
          setExpiryPopup({
            name: med.name,
            image: med.images?.[0],
            expiry: med.expiry
          });
          playTone();
        }
      });
    }, 60000);

    return () => clearInterval(checkExpiry);
  }, [doctorMedicines]);

  // POPUP UI
  const popupUI = (
    <>
      {expiryPopup && (
        <div className="popup-reminder">
          <div className={"popup-box" + (isClosing ? " closing" : "")}>
            <h3>⚠ Expiry Alert!</h3>

            {expiryPopup.image && (
              <img className="popup-img" src={expiryPopup.image} alt="med" />
            )}

            <p>{expiryPopup.name} will expire soon!</p>

            <button
              className="primary-btn"
              onClick={() => {
                setIsClosing(true);
                stopTone();
                setTimeout(() => {
                  setExpiryPopup(null);
                  setIsClosing(false);
                }, 200);
              }}
            >
              STOP
            </button>

            <button className="primary-btn snooze-btn" onClick={handleSnooze}>
              Snooze 5 min
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="doctor-page">

      {popupUI}

      <h1 className="doctor-title">🩺 Doctor Medicine Manager</h1>

      <div className="doctor-container">

        {/* LEFT SIDE */}
        <div className="doctor-left-box">
          <h2>📷 Scan / Upload Medicine</h2>

          {/* MULTIPLE IMAGE UPLOAD */}
          <p className="label-small">Click Using Camera / Upload Multiple</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files);
              const imgs = files.map((file) => URL.createObjectURL(file));
              setScanImages((prev) => [...prev, ...imgs]);
            }}
          />

          {/* PREVIEW LAST IMAGE */}
          {scanImages.length > 0 && (
            <div className="doctor-preview">
              <img src={scanImages[scanImages.length - 1]} alt="last" />
            </div>
          )}

          {/* MEDICINE DETAILS FORM */}
          <h3>📄 Enter Medicine Details</h3>

          <div className="form-group">
            <label>Medicine Name</label>
            <input
              type="text"
              value={medicineForm.name}
              onChange={(e) =>
                setMedicineForm({ ...medicineForm, name: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Batch Number</label>
            <input
              type="text"
              value={medicineForm.batch}
              onChange={(e) =>
                setMedicineForm({ ...medicineForm, batch: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Expiry Date</label>
            <input
              type="date"
              value={medicineForm.expiry}
              onChange={(e) =>
                setMedicineForm({ ...medicineForm, expiry: e.target.value })
              }
            />
          </div>

          <button className="doctor-add-btn" onClick={addMedicine}>
            ➕ Add Medicine
          </button>
        </div>

        {/* RIGHT SIDE */}
        <div className="doctor-right-box">

          <h2>📋 Medicines Added</h2>

          <button className="sort-btn" onClick={sortByExpiry}>
            🔽 Sort by Expiry (Soon → Late)
          </button>

          {/* TONE SETTINGS */}
          <h3>🔔 Select Reminder Tone</h3>

          <label className="label-small">System Tones</label>
          <select
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value)}
          >
            {systemTones.map((tone) => (
              <option key={tone.id} value={tone.id}>
                {tone.label}
              </option>
            ))}
          </select>

          <label className="label-small">Upload Custom Tone</label>
          <input type="file" accept="audio/*" onChange={handleCustomToneUpload} />

          <button className="doctor-tone-btn" onClick={toggleTestTone}>
            {isTestPlaying ? "⛔ Stop Tone" : "▶ Test Tone"}
          </button>

          {/* MEDICINE LIST */}
          {doctorMedicines.length === 0 ? (
            <p className="empty-msg">No medicines added yet.</p>
          ) : (
            <div className="doctor-med-list">
              {doctorMedicines.map((med) => {
                const status = getExpiryStatus(med.expiry);

                return (
                  <div key={med.id} className="doctor-med-item">

                    <div className="med-header-row">
                      <h4>{med.name}</h4>
                      <span className={"status-badge " + status.type}>
                        {status.label}
                      </span>
                    </div>

                    <p>Batch: {med.batch || "N/A"}</p>
                    <p>Expiry: {med.expiry}</p>

                    {/* MULTIPLE IMAGES GALLERY */}
                    {med.images && med.images.length > 0 && (
                      <div className="image-gallery">
                        {med.images.map((img, idx) => (
                          <div key={idx} className="gallery-item">
                            <img src={img} alt="med" />
                            <button
                              className="delete-img-btn"
                              onClick={() => {
                                const updated = med.images.filter((_, i) => i !== idx);
                                med.images = updated;
                                setDoctorMedicines([...doctorMedicines]);
                              }}
                            >
                              ❌
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button className="delete-btn" onClick={() => deleteMedicine(med.id)}>
                      ❌ Delete
                    </button>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <audio id="expiry-tone" src={currentTone?.src} preload="auto" />
    </div>
  );
}

export default Doctor;
