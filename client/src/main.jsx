import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ModalProvider } from "./context/ModalContext";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ModalProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ModalProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
