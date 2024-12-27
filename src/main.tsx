import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";
import { Blank } from "./blank.tsx"
import { BrowserRouter, Routes, Route } from "react-router";
import "./input.css";
import "./assets/fonts/DepartureMono-Regular.woff2";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/blank" element={<Blank />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
