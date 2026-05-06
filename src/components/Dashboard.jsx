import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiAlertTriangle,
  FiCheck,
  FiArrowRight,
  FiActivity,
  FiTrash2,
  FiTarget,
} from "react-icons/fi";
import backend from "../api/backend";
import EditTaskForm from "./EditTaskForm";

function Dashboard() {
  const [user, setUser] = useState({});
  const [greeting, setGreeting] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completeTaskId, setCompleteTaskId] = useState(null);
  const [isRequestPending, setIsRequestPending] = useState(false);

  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem("dashboardTheme") || "light");

  const isDark = theme === "dark";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

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

  // Listen for user data updates from Account page
  useEffect(() => {
    const handleUserUpdate = (event) => {
      if (event.detail) setUser(event.detail);
    };
    window.addEventListener('userDataUpdated', handleUserUpdate);
    return () => window.removeEventListener('userDataUpdated', handleUserUpdate);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, catsRes] = await Promise.all([backend.get("/tasks"), backend.get("/categories")]);

        const parsed = tasksRes.data.map((t) => ({
          id: t.task_id,
          category: t.category_name || "Uncategorized",
          categoryId: t.category_id,
          title: t.title,
          description: t.description,
          deadline: (t.deadline || "").trim(),
          priority: t.priority?.toLowerCase(),
          status:
            (t.status || "pending").toLowerCase() === "done" ||
            (t.status || "").toLowerCase() === "completed"
              ? "Done"
              : "Pending",
        }));

        setTasks(parsed);
        setCategories(catsRes.data.map((c) => ({ value: c.category_id, label: c.category_name })));
        setCompletedTodayCount(0);
      } catch (e) {
        console.error("Error fetching", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleThemeChange = (event) => {
      if (event.detail === "light" || event.detail === "dark") {
        setTheme(event.detail);
      }
    };

    window.addEventListener("dashboardThemeChange", handleThemeChange);
    return () => window.removeEventListener("dashboardThemeChange", handleThemeChange);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) setGreeting("Selamat Pagi");
    else if (hour >= 11 && hour < 15) setGreeting("Selamat Siang");
    else if (hour >= 15 && hour < 19) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");
  }, []);

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = deadline.split("-").map(Number);
    const diffTime = new Date(year, month - 1, day) - today;
    return Math.ceil(diffTime / (1000 * 3600 * 24));
  };

  const formatDeadlineText = (deadline) => {
    const days = getDaysUntilDeadline(deadline);
    if (days === null) return "Tanpa deadline";
    if (days < 0) return "Terlambat";
    if (days === 0) return "Hari ini";
    if (days === 1) return "Besok";
    if (days <= 7) return `${days} hari lagi`;
    const [year, month, day] = deadline.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("id-ID", { month: "short", day: "numeric" });
  };

  const todayTasks = tasks.filter((t) => getDaysUntilDeadline(t.deadline) === 0 && t.status !== "Done");

  const upcomingTasks = tasks
    .filter((t) => {
      const d = getDaysUntilDeadline(t.deadline);
      return d !== null && d >= 0 && d <= 7 && t.status !== "Done";
    })
    .sort((a, b) => getDaysUntilDeadline(a.deadline) - getDaysUntilDeadline(b.deadline))
    .slice(0, 5);

  const overdueTasks = tasks
    .filter((t) => {
      const d = getDaysUntilDeadline(t.deadline);
      return d !== null && d < 0 && t.status !== "Done";
    })
    .sort((a, b) => getDaysUntilDeadline(a.deadline) - getDaysUntilDeadline(b.deadline))
    .slice(0, 4);

  const stats = {
    high: tasks.filter((t) => t.priority === "high" && t.status !== "Done").length,
    medium: tasks.filter((t) => t.priority === "medium" && t.status !== "Done").length,
    low: tasks.filter((t) => t.priority === "low" && t.status !== "Done").length,
  };

  const computeProgress = () => {
    const initialToday = todayTasks.length + completedTodayCount;
    if (initialToday === 0) return 100;
    return Math.round((completedTodayCount / initialToday) * 100);
  };

  const requestFinishTask = (taskId) => {
    setCompleteTaskId(taskId);
    setShowCompleteConfirm(true);
  };

  const handleFinishTask = async () => {
    if (isRequestPending) return;
    const taskId = completeTaskId;
    setShowCompleteConfirm(false);
    setCompleteTaskId(null);
    setIsRequestPending(true);
    try {
      await backend.put(`/tasks/${taskId}`, { status: "completed" });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "Done" } : t)));
      setCompletedTodayCount((c) => c + 1);
      setPopupMessage("Task berhasil diselesaikan.");
      setShowSuccessPopup(true);
    } catch {
      setErrorMessage("Gagal menyelesaikan task.");
      setShowErrorPopup(true);
    } finally {
      setIsRequestPending(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (isRequestPending) return;
    setIsRequestPending(true);
    try {
      await backend.delete(`/tasks/${deleteTaskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTaskId));
      setShowDeletePopup(false);
      setDeleteTaskId(null);
    } catch {
      setErrorMessage("Gagal menghapus task.");
      setShowErrorPopup(true);
    } finally {
      setIsRequestPending(false);
    }
  };

  const panelClass = isDark
    ? "bg-zinc-900/40 border-zinc-800/80 shadow-md shadow-black/10"
    : "bg-white/90 border-slate-200/60 shadow-sm shadow-slate-200/50";
  const headingClass = isDark ? "text-zinc-50" : "text-slate-900";
  const subtleTextClass = isDark ? "text-zinc-400" : "text-slate-500";

  const priorityBadgeClass = (priority) => {
    if (priority === "high") return isDark ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-200";
    if (priority === "medium") return isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-200";
    if (priority === "low") return isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200";
    return isDark ? "bg-zinc-800/50 text-zinc-300 border-zinc-700/50" : "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div className="min-h-full pb-10">
      <div className="max-w-[1400px] mx-auto space-y-6 animate-slide-up">
        {/* HERO WIDGET */}
        <div className={`rounded-3xl border p-5 md:p-7 backdrop-blur-xl relative overflow-hidden ${panelClass}`}>
          <div
            className={`absolute -top-32 -right-16 w-80 h-80 rounded-full blur-[80px] pointer-events-none ${
              isDark ? "bg-indigo-500/20" : "bg-blue-400/10"
            }`}
          ></div>
          <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 items-center gap-6 xl:gap-8">
            <div className="xl:col-span-8 max-w-[650px]">
              <p className={`text-[11px] tracking-widest uppercase font-bold ${isDark ? "text-indigo-400" : "text-[#21569A]"}`}>
                Pusat Produktivitas
              </p>
              <h1 className={`text-3xl md:text-4xl font-extrabold mt-2 leading-tight tracking-tight ${headingClass}`}>
                {greeting}, {user?.first_name || "User"}
              </h1>
              <p className={`mt-2.5 max-w-lg text-sm md:text-[15px] font-medium leading-relaxed ${subtleTextClass}`}>
                Kelola harimu dengan pusat kendali pribadimu.
              </p>
            </div>

            <div className="xl:col-span-4 flex xl:justify-end mt-4 xl:mt-0">
              <div
                className={`inline-flex items-center gap-4 px-5 py-4 rounded-2xl border w-fit min-w-[220px] animate-slide-up shadow-sm ${
                  isDark ? "bg-zinc-900/60 border-zinc-800/80" : "bg-white border-slate-200/80"
                }`}
                style={{ animationDelay: "120ms" }}
              >
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className={isDark ? "text-zinc-800" : "text-slate-100"}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className={isDark ? "text-indigo-500" : "text-[#21569A]"}
                      strokeDasharray={`${computeProgress()}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
                    />
                  </svg>
                  <span className={`absolute text-xs font-bold ${headingClass}`}>
                    {computeProgress()}%
                  </span>
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold uppercase tracking-widest ${subtleTextClass}`}>
                    Target Harian
                  </p>
                  <p className={`text-sm font-semibold mt-0.5 ${headingClass}`}>
                    {completedTodayCount} task selesai
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
          {/* FOCUS AREA */}
          <section
            className={`md:col-span-8 rounded-3xl border p-6 md:p-7 backdrop-blur-xl ${panelClass} animate-slide-up flex flex-col`}
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-blue-50 text-blue-600"}`}>
                  <FiTarget className="w-5 h-5" />
                </div>
                <h2 className={`text-[1.15rem] font-bold tracking-tight ${headingClass}`}>Area Fokus</h2>
              </div>
              <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold border ${isDark ? "border-indigo-500/20 text-indigo-300 bg-indigo-500/10" : "border-slate-200 text-slate-500 bg-slate-50"}`}>
                {todayTasks.length} Aktif
              </span>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className={`h-16 rounded-2xl ${isDark ? "bg-zinc-800/50" : "bg-slate-100"}`}></div>
                <div className={`h-16 rounded-2xl w-4/5 ${isDark ? "bg-zinc-800/50" : "bg-slate-100"}`}></div>
              </div>
            ) : todayTasks.length === 0 ? (
              <div className={`flex-1 rounded-2xl border border-dashed flex flex-col items-center justify-center p-8 text-center ${isDark ? "border-zinc-700 bg-zinc-900/30" : "border-slate-200 bg-slate-50/50"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-emerald-500/10" : "bg-emerald-100"}`}>
                   <FiCheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className={`text-[1rem] font-semibold ${headingClass}`}>Semua task hari ini beres</h3>
                <p className={`mt-1 text-sm ${subtleTextClass}`}>Lanjut santai atau ke rencana berikutnya.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {todayTasks.map((task, idx) => (
                  <article
                    key={task.id}
                    className={`group rounded-2xl border p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-md ${
                      isDark ? "bg-zinc-900 border-zinc-800 hover:border-indigo-500/50" : "bg-white border-slate-200/80 hover:border-blue-400/30"
                    } animate-slide-up`}
                    style={{ animationDelay: `${200 + idx * 50}ms` }}
                  >
                    <button
                      onClick={() => requestFinishTask(task.id)}
                      className={`w-[34px] h-[34px] rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                        isDark
                          ? "border-zinc-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-400"
                          : "border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600"
                      }`}
                    >
                      <FiCheck className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${headingClass}`}>{task.title}</p>
                      <p className={`text-xs mt-0.5 truncate ${subtleTextClass}`}>{task.category}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-md border uppercase font-bold tracking-widest shrink-0 ${priorityBadgeClass(task.priority)}`}>
                      {task.priority || "normal"}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* PRIORITY RADAR */}
          <section
            className={`md:col-span-4 rounded-3xl border p-6 md:p-7 backdrop-blur-xl ${panelClass} animate-slide-up flex flex-col`}
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl transition-colors ${isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
                <FiActivity className="w-5 h-5" />
              </div>
              <h2 className={`text-[1.15rem] font-bold tracking-tight ${headingClass}`}>Radar Prioritas</h2>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {[
                { label: "Tinggi", count: stats.high, dot: "bg-rose-500", ring: "ring-rose-500/20" },
                { label: "Sedang", count: stats.medium, dot: "bg-amber-500", ring: "ring-amber-500/20" },
                { label: "Rendah", count: stats.low, dot: "bg-emerald-500", ring: "ring-emerald-500/20" },
              ].map((item, idx) => (
                <div
                  key={item.label}
                  className={`rounded-2xl p-4 flex items-center justify-between border transition-all animate-slide-up ${
                    isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200/70"
                  }`}
                  style={{ animationDelay: `${260 + idx * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${item.dot} ring-4 ${item.ring} animate-pulse`}></span>
                    <span className={`text-xs uppercase tracking-widest font-bold ${subtleTextClass}`}>{item.label}</span>
                  </div>
                  <span className={`text-xl font-bold ${headingClass}`}>{item.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* UPCOMING */}
          <section
            className={`md:col-span-6 rounded-3xl border p-6 md:p-7 backdrop-blur-xl ${panelClass} animate-slide-up`}
            style={{ animationDelay: "220ms" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                  <FiCalendar className="w-5 h-5" />
                </div>
                <h2 className={`text-[1.15rem] font-bold tracking-tight ${headingClass}`}>Akan Datang</h2>
              </div>
            </div>

            <div className="space-y-3">
              {upcomingTasks.length === 0 && !loading && (
                <p className={`text-sm italic ${subtleTextClass}`}>Tidak ada deadline dalam 7 hari kedepan.</p>
              )}
              {upcomingTasks.map((task, idx) => (
                <article
                  key={task.id}
                  className={`group rounded-2xl border p-4 flex items-center gap-4 transition-all animate-slide-up ${
                    isDark ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700" : "bg-white border-slate-200/70 hover:border-slate-300"
                  }`}
                  style={{ animationDelay: `${300 + idx * 50}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${isDark ? "bg-zinc-800" : "bg-slate-50 border border-slate-100"}`}>
                    <span className={`text-[9px] uppercase tracking-widest font-bold ${isDark ? "text-indigo-400" : "text-blue-600"}`}>
                      {task.deadline ? new Date(task.deadline).toLocaleDateString("en-US", { month: "short" }) : "-"}
                    </span>
                    <span className={`text-lg font-bold leading-none ${headingClass}`}>
                      {task.deadline ? new Date(task.deadline).getDate() : "-"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${headingClass}`}>{task.title}</p>
                    <p className={`text-xs mt-0.5 truncate ${subtleTextClass}`}>{formatDeadlineText(task.deadline)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingTask({ id: task.id, title: task.title, description: task.description, deadline: task.deadline, priority: task.priority, categoryId: task.categoryId });
                      setShowEditModal(true);
                    }}
                    className={`w-9 h-9 opacity-0 group-hover:opacity-100 rounded-full border flex items-center justify-center transition-all ${
                      isDark ? "border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white" : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                </article>
              ))}
            </div>
          </section>

          {/* OVERDUE */}
          <section
            className={`md:col-span-6 rounded-3xl border p-6 md:p-7 backdrop-blur-xl ${panelClass} animate-slide-up flex flex-col`}
            style={{ animationDelay: "260ms" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl transition-colors ${isDark ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-600"}`}>
                <FiAlertTriangle className="w-5 h-5" />
              </div>
              <h2 className={`text-[1.15rem] font-bold tracking-tight ${headingClass}`}>Terlambat</h2>
            </div>

            <div className="space-y-3 flex-1 flex flex-col">
              {overdueTasks.length === 0 && !loading && (
                <div className={`flex-1 rounded-2xl border p-6 flex flex-col items-center justify-center text-center ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200/70"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                     <FiCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className={`text-sm font-semibold ${headingClass}`}>Semua task aman</p>
                  <p className={`text-xs mt-1 ${subtleTextClass}`}>Tidak ada yang lewat deadline.</p>
                </div>
              )}

              {overdueTasks.map((task, idx) => (
                <article
                  key={task.id}
                  className={`group rounded-2xl border p-4 flex items-center gap-4 animate-slide-up transition-colors ${
                    isDark ? "bg-rose-950/20 border-rose-900/50 hover:border-rose-800" : "bg-rose-50/50 border-rose-100 hover:border-rose-200"
                  }`}
                  style={{ animationDelay: `${340 + idx * 50}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-rose-200" : "text-rose-800"}`}>{task.title}</p>
                    <p className={`text-xs mt-0.5 font-bold uppercase tracking-widest ${isDark ? "text-rose-400" : "text-rose-500"}`}>
                      {getDaysUntilDeadline(task.deadline) * -1} hari terlambat
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setDeleteTaskId(task.id);
                        setShowDeletePopup(true);
                      }}
                      className={`p-2 rounded-xl transition-colors border ${isDark ? "border-transparent text-zinc-400 hover:text-rose-400 hover:border-rose-500/30" : "border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200"}`}
                    >
                      <FiTrash2 className="w-[18px] h-[18px]" />
                    </button>
                    <button
                      onClick={() => requestFinishTask(task.id)}
                      className={`p-2 rounded-xl transition-colors border ${isDark ? "border-transparent text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30" : "border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200"}`}
                    >
                      <FiCheck className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      {showEditModal && editingTask && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/10 animate-slide-up" style={{ animationDuration: "0.25s" }}>
          <div className="w-full max-w-xl">
            <EditTaskForm
              isOpen={showEditModal}
              isEditMode={true}
              task={editingTask}
              categories={categories}
              onSave={async (fw) => {
                await backend.put(`/tasks/${editingTask.id}`, fw);
                setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...fw } : t)));
                setShowEditModal(false);
                setEditingTask(null);
              }}
              onCancel={() => {
                setShowEditModal(false);
                setEditingTask(null);
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Complete Confirmation Popup */}
      {showCompleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/10">
          <div className={`rounded-[1.75rem] p-7 max-w-sm w-full shadow-2xl text-center border animate-slide-up ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-slate-200"}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${isDark ? "bg-emerald-500/10" : "bg-emerald-100"}`}>
              <FiCheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className={`text-xl font-black mb-2 ${headingClass}`}>Tandai Selesai?</h3>
            <p className={`text-sm mb-7 ${subtleTextClass}`}>Task ini akan ditandai sebagai selesai.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCompleteConfirm(false); setCompleteTaskId(null); }}
                className={`flex-1 py-3 rounded-xl border font-semibold ${
                  isDark
                    ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Batal
              </button>
              <button
                onClick={handleFinishTask}
                disabled={isRequestPending}
                className={`flex-1 py-3 rounded-xl text-white font-semibold ${isDark ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-500 hover:bg-emerald-600"} ${isRequestPending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isRequestPending ? "Memproses..." : "Ya, Selesaikan"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showDeletePopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/10">
          <div className={`rounded-[1.75rem] p-7 max-w-sm w-full shadow-2xl text-center border animate-slide-up ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-slate-200"}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${isDark ? "bg-rose-500/10" : "bg-rose-100"}`}>
              <FiTrash2 className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className={`text-xl font-black mb-2 ${headingClass}`}>Hapus Task?</h3>
            <p className={`text-sm mb-7 ${subtleTextClass}`}>Task akan dihapus permanen dari daftar.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeletePopup(false)}
                className={`flex-1 py-3 rounded-xl border font-semibold ${
                  isDark
                    ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isRequestPending}
                className={`flex-1 py-3 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 ${isRequestPending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isRequestPending ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showSuccessPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/10">
          <div className={`rounded-[1.75rem] p-7 max-w-sm w-full shadow-2xl text-center border animate-slide-up ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-slate-200"}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${isDark ? "bg-emerald-500/10" : "bg-emerald-100"}`}>
              <FiCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className={`text-xl font-black mb-2 ${headingClass}`}>Task Selesai</h3>
            <p className={`text-sm mb-7 ${subtleTextClass}`}>{popupMessage}</p>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className={`w-full py-3 rounded-xl font-bold ${
                isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-[#21569A] text-white hover:bg-[#1B4B59]"
              }`}
            >
              OK
            </button>
          </div>
        </div>,
        document.body
      )}

      {showErrorPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/10">
          <div className={`rounded-[1.75rem] p-7 max-w-sm w-full shadow-2xl text-center border animate-slide-up ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-slate-200"}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${isDark ? "bg-rose-500/10" : "bg-rose-100"}`}>
              <FiAlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className={`text-xl font-black mb-2 ${headingClass}`}>Oops</h3>
            <p className={`text-sm mb-7 ${subtleTextClass}`}>{errorMessage}</p>
            <button
              onClick={() => setShowErrorPopup(false)}
              className={`w-full py-3 rounded-xl font-semibold border ${
                isDark
                  ? "bg-zinc-800 border-white/10 text-white hover:bg-zinc-700"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Tutup
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Dashboard;
