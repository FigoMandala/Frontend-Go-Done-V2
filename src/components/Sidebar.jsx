import { NavLink, useNavigate } from "react-router-dom";
import { FiHome, FiList, FiFlag, FiCalendar, FiClock, FiLogOut, FiSettings, FiMoon, FiSun } from "react-icons/fi";
import backend from "../api/backend";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";

function Sidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("dashboardTheme") || "light");
  const isDark = theme === "dark";

  const getLinkClass = (isActive) => {
    const base = "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm";
    if (isDark) {
      return isActive
        ? `${base} bg-zinc-800 border border-zinc-700/50 text-white shadow-sm`
        : `${base} text-zinc-400 border border-transparent hover:text-zinc-200 hover:bg-zinc-800/50`;
    }
    return isActive
      ? `${base} bg-white border border-slate-200/60 text-[#21569a] shadow-sm`
      : `${base} text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-100/60`;
  };

  useEffect(() => {
    setIsVisible(true);

    const cachedUserRaw = localStorage.getItem("user");
    if (cachedUserRaw) {
      try {
        setUser(JSON.parse(cachedUserRaw));
      } catch {
        localStorage.removeItem("user");
      }
    }

    backend
      .get("/user/me")
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      })
      .catch(console.error);
  }, []);

  // Listen for user data updates from Account page (photo/profile changes)
  useEffect(() => {
    const handleUserUpdate = (event) => {
      if (event.detail) {
        setUser(event.detail);
      }
    };
    window.addEventListener('userDataUpdated', handleUserUpdate);
    return () => window.removeEventListener('userDataUpdated', handleUserUpdate);
  }, []);

  useEffect(() => {
    localStorage.setItem("dashboardTheme", theme);
    window.dispatchEvent(new CustomEvent("dashboardThemeChange", { detail: theme }));
  }, [theme]);

  const handleLogout = async () => {
    try {
      await backend.post('/auth/logout');
    } catch (err) {
      // Ignore errors — we'll clear local state regardless
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out. See you in the stars.");
    navigate("/");
  };

  return (
    <aside 
      className={`h-full rounded-3xl flex flex-col p-4 overflow-y-auto overflow-x-hidden transition-all duration-500 ease-out border shadow-sm custom-scrollbar ${
        isDark
          ? "bg-zinc-950/80 backdrop-blur-2xl border-zinc-800/60 shadow-black/20"
          : "bg-[#f8fafc]/80 backdrop-blur-2xl border-slate-200/60 shadow-slate-200/50"
      } ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
    >
      
      {/* PROFILE WIDGET */}
      <div
        className={`group flex items-center gap-3 p-2 rounded-2xl mb-8 cursor-pointer transition-all duration-300 border ${
          isDark 
            ? "hover:bg-zinc-800/40 border-transparent hover:border-zinc-700/50" 
            : "hover:bg-white/60 border-transparent hover:border-slate-200"
        }`}
        onClick={() => navigate("/account")}
      >
        <div className="relative shrink-0">
          <img
            src={user?.photo_url || "https://ui-avatars.com/api/?name=" + (user?.first_name || "User") + "&background=random"}
            className={`rounded-full w-10 h-10 object-cover shadow-sm transition-transform duration-300 group-hover:scale-105 border-2 ${
              isDark ? "border-zinc-700" : "border-white"
            }`}
            alt="Profile"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate transition-colors ${
            isDark ? "text-zinc-100 group-hover:text-white" : "text-slate-800 group-hover:text-slate-900"
          }`}>
            {user?.first_name} {user?.last_name}
          </p>
          <p className={`text-xs font-medium flex items-center gap-1.5 mt-0.5 ${
            isDark ? "text-zinc-500" : "text-slate-500"
          }`}>
             <FiSettings className="w-3 h-3 group-hover:rotate-45 transition-transform duration-300" /> Account
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1.5">
        <p className={`text-xs font-semibold uppercase tracking-wider mb-3 px-3 transition-colors ${
          isDark ? "text-zinc-600" : "text-slate-400"
        }`}>
          Primary
        </p>
        {[
          { to: "/dashboard", icon: FiHome, label: "Overview" },
          { to: "/my-task", icon: FiList, label: "Tasks" },
          { to: "/priorities", icon: FiFlag, label: "Priorities" },
          { to: "/calendar", icon: FiCalendar, label: "Calendar" },
          { to: "/pomodoro", icon: FiClock, label: "Pomodoro" },
        ].map((item) => (
          <div key={item.to}>
             <NavLink to={item.to} className={({ isActive }) => getLinkClass(isActive)}>
               {({ isActive }) => (
                 <>
                   <item.icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                     isActive 
                        ? (isDark ? "text-white" : "text-[#21569a]") 
                        : (isDark ? "text-zinc-500 group-hover:text-zinc-300" : "text-slate-400 group-hover:text-slate-600")
                   }`} />
                   <span>{item.label}</span>
                 </>
               )}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* FOOTER ACTIONS */}
      <div className="space-y-2 mt-4">
        {/* THEME TOGGLE */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition-all duration-200 text-sm font-medium border ${
            isDark
              ? "text-zinc-400 border-transparent hover:border-zinc-700/50 hover:text-zinc-200 hover:bg-zinc-800/50"
              : "text-slate-500 border-transparent hover:border-slate-200/60 hover:text-slate-800 hover:bg-slate-100/60"
          }`}
        >
          {isDark ? (
            <FiSun className="w-[18px] h-[18px] text-zinc-500 group-hover:text-amber-400 transition-colors" />
          ) : (
            <FiMoon className="w-[18px] h-[18px] text-slate-400 group-hover:text-amber-500 transition-colors" />
          )}
          <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition-all duration-200 text-sm font-medium border ${
            isDark
              ? "text-zinc-500 border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
              : "text-slate-500 border-transparent hover:border-rose-400/40 hover:bg-rose-50 hover:text-rose-600"
          }`}
        >
          <FiLogOut className="w-[18px] h-[18px] shrink-0 transition-all duration-300 group-hover:-translate-x-1" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;