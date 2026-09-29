import "./firebase.js"; // sabse pehle: Firebase ready hona chahiye
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
