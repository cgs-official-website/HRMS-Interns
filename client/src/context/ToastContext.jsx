import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertCircle, CheckCircle, Info, XCircle, X } from "lucide-react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} color="var(--success)" />;
      case "error":
        return <XCircle size={20} color="var(--danger)" />;
      case "warning":
        return <AlertCircle size={20} color="var(--warning)" />;
      case "info":
      default:
        return <Info size={20} color="var(--primary)" />;
    }
  };

  const getToastClass = (type) => {
    switch (type) {
      case "success":
        return "toast toast-success";
      case "error":
        return "toast toast-error";
      case "warning":
        return "toast toast-warning";
      case "info":
      default:
        return "toast toast-info";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={getToastClass(toast.type)}>
            {getIcon(toast.type)}
            <span style={{ fontSize: "0.9rem", fontWeight: 500, flexGrow: 1 }}>{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)} 
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255, 255, 255, 0.6)",
                display: "flex",
                padding: "2px",
                transition: "color 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)"}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
