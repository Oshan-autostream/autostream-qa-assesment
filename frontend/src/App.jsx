import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { ToastProvider } from "./components/ToastProvider";
import AppRoutes from "./routes/AppRoutes";
import { getAuth } from "./utils/auth";
import { initializeTheme } from "./utils/theme";
import api from "./api/axios";

export default function App() {
  const [auth, setAuthState] = useState(getAuth());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Initialize theme on app load
    initializeTheme();

    const refresh = () => setAuthState(getAuth());
    window.addEventListener("auth-change", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("auth-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const isAdmin = auth?.role === "admin" || auth?.role === "staff";

  useEffect(() => {
    if (!auth?.token) return;

    api.get("/auth/validate").catch(() => {
      // The axios interceptor handles invalid sessions by clearing auth and redirecting.
    });
  }, [auth?.token]);

  return (
    <ToastProvider>
      {isAdmin ? (
        <div className="appShell">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="appMain">
            <div className="appContent">
              <AppRoutes />
            </div>
          </div>
        </div>
      ) : (
        <>
          <Navbar />
          <AppRoutes />
        </>
      )}
    </ToastProvider>
  );
}
