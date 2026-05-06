import { useCallback, useEffect, useRef, useState } from "react";
import { FiBell, FiAlertCircle, FiClock, FiCalendar } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import logoGoDone from '../assets/GoDone Logo.png';
import backend from "../api/backend";

const NOTIFICATION_FETCH_COOLDOWN_MS = 30 * 1000;

function Topbar({ theme = "light" }) {
  const [dateTime, setDateTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [tasks, setTasks] = useState([]);
  const lastFetchedAtRef = useRef(0);
  const inFlightRequestRef = useRef(null);
  const isDark = theme === "dark";
  
  const [notifOn] = useState(() => {
    const saved = localStorage.getItem("notifEnabled");
    return saved === null ? true : JSON.parse(saved);
  });
  
  const navigate = useNavigate();

  const fetchTasks = useCallback(async (force = false) => {
    if (!notifOn) {
      setTasks([]);
      return;
    }

    if (!force && Date.now() - lastFetchedAtRef.current < NOTIFICATION_FETCH_COOLDOWN_MS) {
      return;
    }

    if (inFlightRequestRef.current) {
      return inFlightRequestRef.current;
    }

    try {
      inFlightRequestRef.current = backend.get("/tasks");
      const response = await inFlightRequestRef.current;
      const processedTasks = response.data
        .filter((t) => t.status === "pending")
        .map((t) => ({
          ...t,
          deadline: t.deadline ? t.deadline.split(" ")[0].split("T")[0] : null,
        }));
      setTasks(processedTasks);
      lastFetchedAtRef.current = Date.now();
    } catch (error) {
      console.error("Failed to fetch notification tasks:", error);
    } finally {
      inFlightRequestRef.current = null;
    }
  }, [notifOn]);

  useEffect(() => {
     const timer = setInterval(() => setDateTime(new Date()), 1000); 
     return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [fetchTasks]);

  useEffect(() => {
    if (showNotifications) fetchTasks(true);
  }, [showNotifications, fetchTasks]);

  const getDaysLeftHtml = (deadline) => {
    if (!deadline) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(deadline); due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return <span className="text-rose-400 font-bold bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">Terlambat</span>;
    if (diffDays === 0) return <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">Hari ini</span>;
    if (diffDays === 1) return <span className="text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">Besok</span>;
    return <span className="text-zinc-400 px-2.5 py-1 bg-zinc-800/50 rounded-md border border-zinc-700/50">{diffDays} hari lagi</span>;
  };

  const getPriorityColor = (priority) => {
    const p = priority ? priority.toLowerCase() : "";
    if (p === 'high') return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]';
    if (p === 'medium') return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]';
    return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]';
  };

  return (
    <header className="flex justify-between items-center px-4 py-4 md:px-8 bg-transparent z-50 animate-slide-up">
      
      {/* LOGO Area */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-2xl border shadow-lg overflow-hidden transition-all duration-300 ${
            isDark
              ? "bg-zinc-900/75 border-zinc-700/70 shadow-black/35"
              : "bg-white/90 border-slate-200/80 shadow-slate-200/40"
          }`}
        >
           <img
             src={logoGoDone}
             alt="GoDone"
             className={`h-5 w-auto transition-all duration-300 ${isDark ? "opacity-90 brightness-110 saturate-[0.85]" : "opacity-100"}`}
           />
        </div>
        <span className={`font-black tracking-widest uppercase text-xs hidden sm:block ${isDark ? "text-zinc-300 opacity-80" : "text-slate-700 opacity-70"}`}>Ruang Kerja</span>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        
        {/* TIME WIDGET */}
          <div className={`hidden sm:flex items-center gap-3 px-4 py-2 backdrop-blur-xl border rounded-2xl shadow-inner transition-colors ${isDark ? "bg-zinc-900/50 border-white/5" : "bg-white/70 border-white/80"}`}>
            <FiCalendar className={`w-4 h-4 ${isDark ? "text-zinc-500" : "text-slate-500"}`} />
            <span className={`text-xs font-medium tracking-wide uppercase ${isDark ? "text-zinc-300" : "text-slate-700"}`}>{days[dateTime.getDay()]}</span>
            <div className={`w-px h-3 ${isDark ? "bg-zinc-700" : "bg-slate-300"}`}></div>
            <FiClock className={`w-4 h-4 ${isDark ? "text-indigo-400" : "text-[#21569A]"}`} />
            <span className={`text-sm font-bold tracking-widest tabular-nums ${isDark ? "text-white" : "text-slate-800"}`}>
              {dateTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
           </span>
        </div>

        {/* NOTIFICATION BELL */}
        <div className="relative">
          <button 
            className={`group relative p-3 backdrop-blur-xl border rounded-2xl cursor-pointer shadow-lg transition-all ${
              isDark
                ? "bg-zinc-900/50 border-white/5 hover:shadow-indigo-500/10 hover:border-indigo-500/30 text-zinc-400 hover:text-indigo-400"
                : "bg-white/80 border-white hover:border-[#21569A]/30 text-slate-500 hover:text-[#21569A]"
            }`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FiBell className="w-5 h-5 group-hover:animate-bounce" />
            {tasks.length > 0 && (
              <>
                 <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full animate-ping opacity-75"></span>
                 <span className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                   {tasks.length > 9 ? '9+' : tasks.length}
                 </span>
              </>
            )}
          </button>

          {/* NOTIFICATION WINDOW */}
          {showNotifications && (
            <div className={`absolute right-0 top-16 w-[380px] backdrop-blur-3xl rounded-3xl shadow-2xl border overflow-hidden z-[100] transform transition-all animate-slide-up origin-top-right ${
              isDark
                ? "bg-zinc-900/90 border-white/10 shadow-black/50"
                : "bg-white/95 border-white/80 shadow-slate-400/20"
            }`}>
              
              <div className={`flex justify-between items-center px-6 py-5 border-b ${isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50/70"}`}>
                <h3 className={`font-bold tracking-wide flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}>
                   Kotak Masuk <span className="bg-indigo-500 text-xs px-2 py-0.5 rounded-full text-white">{tasks.length}</span>
                </h3>
              </div>

              <div className="max-h-[350px] overflow-y-auto no-scrollbar">
                {tasks.length === 0 ? (
                  <div className={`px-6 py-12 flex flex-col gap-3 items-center justify-center text-sm ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${isDark ? "bg-zinc-800 text-zinc-600" : "bg-slate-100 text-slate-400"}`}>
                      <FiAlertCircle className="w-6 h-6" />
                    </div>
                    <span>Tidak ada task aktif saat ini.</span>
                    <span className="text-xs opacity-50">Nikmati waktu luangmu.</span>
                  </div>
                ) : (
                  <ul className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-100"}`}>
                    {tasks.map((task) => (
                      <li key={task.task_id} className={`relative bg-transparent p-5 transition-colors cursor-pointer group ${isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500 transition-all duration-500"></div>
                        <div className="flex justify-between items-start mb-2 gap-4">
                          <span className={`font-semibold text-sm truncate transition-colors ${isDark ? "text-zinc-200 group-hover:text-indigo-300" : "text-slate-700 group-hover:text-[#21569A]"}`}>
                            {task.title}
                          </span>
                          <span className="text-[10px] shrink-0 tracking-wider">
                            {getDaysLeftHtml(task.deadline)}
                          </span>
                        </div>
                        <div className={`flex items-center gap-2.5 group-hover:opacity-100 transition-opacity ${isDark ? "opacity-60" : "opacity-80"}`}>
                           <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                           <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-zinc-400" : "text-slate-500"}`}>{task.priority || "Normal"}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={`border-t p-4 ${isDark ? "border-white/5 bg-zinc-950/50" : "border-slate-100 bg-white"}`}>
                <button 
                  onClick={() => { navigate("/my-task"); setShowNotifications(false); }} 
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all border ${
                    isDark
                      ? "bg-white/5 hover:bg-white/10 text-white border-transparent hover:border-white/10"
                      : "bg-[#21569A] text-white border-[#21569A] hover:bg-[#1B4B59]"
                  }`}
                >
                  Lihat Aktivitas
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default Topbar;
