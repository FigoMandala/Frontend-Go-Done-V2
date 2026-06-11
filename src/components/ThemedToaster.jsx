import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

// A single app-wide Toaster whose colors follow the dashboard light/dark theme.
function ThemedToaster() {
  const [theme, setTheme] = useState(() => localStorage.getItem("dashboardTheme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    const handleThemeChange = (event) => {
      if (event.detail === "light" || event.detail === "dark") setTheme(event.detail);
    };
    window.addEventListener("dashboardThemeChange", handleThemeChange);
    return () => window.removeEventListener("dashboardThemeChange", handleThemeChange);
  }, []);

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          fontSize: "14px",
          borderRadius: "14px",
          maxWidth: "92vw",
          padding: "12px 16px",
          fontWeight: 500,
          background: isDark ? "#18181b" : "#ffffff",
          color: isDark ? "#f4f4f5" : "#1e293b",
          border: isDark ? "1px solid #3f3f46" : "1px solid #e2e8f0",
          boxShadow: isDark
            ? "0 12px 32px -12px rgba(0,0,0,0.7)"
            : "0 12px 32px -12px rgba(15,23,42,0.18)",
        },
        success: { iconTheme: { primary: "#10b981", secondary: isDark ? "#18181b" : "#ffffff" } },
        error: { iconTheme: { primary: "#f43f5e", secondary: isDark ? "#18181b" : "#ffffff" } },
        loading: { iconTheme: { primary: isDark ? "#a1a1aa" : "#64748b", secondary: isDark ? "#18181b" : "#ffffff" } },
      }}
    />
  );
}

export default ThemedToaster;
