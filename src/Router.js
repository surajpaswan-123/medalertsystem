import React from "react";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Doctor from "./Doctor";
import Patient from "./patient";

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/doctor" element={<Doctor />} />
        <Route path="/patient" element={<Patient/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
