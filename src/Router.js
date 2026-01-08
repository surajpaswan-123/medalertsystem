import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoleSelection from "./RoleSelection";
import AuthScreen from "./AuthScreen";
import Doctor from "./Doctor";
import Patient from "./patient";

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* First Screen: Role Selection */}
        <Route path="/" element={<RoleSelection />} />
        
        {/* Auth Screen: Sign In / Sign Up */}
        <Route path="/auth" element={<AuthScreen />} />
        
        {/* Doctor Dashboard */}
        <Route path="/doctor" element={<Doctor />} />
        
        {/* Patient Dashboard */}
        <Route path="/patient" element={<Patient />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
