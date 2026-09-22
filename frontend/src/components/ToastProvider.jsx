import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function randomId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, tone = "ok", duration = 3600 }) => {
      const id = randomId();
      setToasts((current) => [...current, { id, title, message, tone }]);
      window.setTimeout(() => dismissToast(id), duration);
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      success: (message, title = "Success") => showToast({ title, message, tone: "ok" }),
      error: (message, title = "Something went wrong") => showToast({ title, message, tone: "bad", duration: 4600 }),
      info: (message, title = "Notice") => showToast({ title, message, tone: "info" }),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toastWrap" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast${toast.tone === "bad" ? "Bad" : toast.tone === "info" ? "Info" : "Ok"}`}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="toastTitle">{toast.title}</div>
                <div className="toastMsg">{toast.message}</div>
              </div>
              <button type="button" className="toastClose" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification">
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
