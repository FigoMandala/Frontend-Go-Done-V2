import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import backend from "../api/backend";
import EditTaskForm from "./EditTaskForm";
import { FiEdit2, FiTrash2, FiCheck, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const normalizePriority = (p) => {
  if (!p) return "";
  const x = p.toString().trim().toLowerCase();
  if (x === "high") return "High";
  if (x === "medium") return "Medium";
  if (x === "low") return "Low";
  return p;
};

// ========== Popup ==========
const Popup = ({ show, type, title, message, onConfirm, onCancel, confirmText = "OK", isDark }) => {
  if (!show) return null;
  const isConfirm = type === "confirm";
  const isSuccess = type === "success";
  const panelClass = isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200";
  const headingClass = isDark ? "text-zinc-50" : "text-slate-900";
  const subtleClass = isDark ? "text-zinc-400" : "text-slate-500";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-lg animate-slide-up" style={{ animationDuration: "0.2s" }}>
      <div className={`rounded-3xl p-7 max-w-sm w-full shadow-2xl text-center border ${panelClass}`}>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${
          isSuccess ? (isDark ? "bg-emerald-500/10" : "bg-emerald-100") : type === "error" ? (isDark ? "bg-rose-500/10" : "bg-rose-100") : (isDark ? "bg-amber-500/10" : "bg-amber-100")
        }`}>
          {isSuccess ? <FiCheckCircle className="w-7 h-7 text-emerald-500" /> :
           type === "error" ? <FiAlertTriangle className="w-7 h-7 text-rose-500" /> :
           <FiTrash2 className="w-7 h-7 text-amber-500" />}
        </div>
        <h3 className={`text-lg font-bold mb-2 ${headingClass}`}>{title}</h3>
        <p className={`text-sm mb-7 ${subtleClass}`}>{message}</p>
        <div className={`flex gap-3 ${isConfirm ? "" : "justify-center"}`}>
          {isConfirm ? (
            <>
              <button onClick={onCancel} className={`flex-1 py-3 rounded-xl border font-semibold text-sm transition-colors ${isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"}`}>Batal</button>
              <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-semibold text-sm hover:bg-rose-600 transition-colors">{confirmText}</button>
            </>
          ) : (
            <button onClick={onCancel} className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-[#21569A] text-white hover:bg-[#1a4580]"}`}>OK</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

function TaskPriorities() {
  const [tasks, setTasks] = useState({ High: [], Medium: [], Low: [] });
  const [categories, setCategories] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [popup, setPopup] = useState({ show: false, type: "", title: "", message: "", data: null });
  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState(localStorage.getItem("dashboardTheme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    const handleThemeChange = (event) => {
      if (event.detail === "light" || event.detail === "dark") setTheme(event.detail);
    };
    window.addEventListener("dashboardThemeChange", handleThemeChange);
    return () => window.removeEventListener("dashboardThemeChange", handleThemeChange);
  }, []);

  const showPopup = (type, title, message, data = null) => setPopup({ show: true, type, title, message, data });
  const closePopup = () => setPopup({ show: false, type: "", title: "", message: "", data: null });

  const panelClass = isDark ? "bg-zinc-900/40 border-zinc-800/80 shadow-md shadow-black/10" : "bg-white/90 border-slate-200/60 shadow-sm shadow-slate-200/50";
  const headingClass = isDark ? "text-zinc-50" : "text-slate-900";
  const subtleClass = isDark ? "text-zinc-400" : "text-slate-500";

  const PRIORITY_CONFIG = {
    High: {
      dot: "bg-rose-500",
      ring: isDark ? "ring-rose-500/20" : "ring-rose-200",
      badge: isDark ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-200",
      headerGradient: isDark ? "from-rose-500/10 to-transparent" : "from-rose-50 to-transparent",
      label: "Prioritas Tinggi",
      iconColor: "text-rose-500",
    },
    Medium: {
      dot: "bg-amber-500",
      ring: isDark ? "ring-amber-500/20" : "ring-amber-200",
      badge: isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-200",
      headerGradient: isDark ? "from-amber-500/10 to-transparent" : "from-amber-50 to-transparent",
      label: "Prioritas Sedang",
      iconColor: "text-amber-500",
    },
    Low: {
      dot: "bg-emerald-500",
      ring: isDark ? "ring-emerald-500/20" : "ring-emerald-200",
      badge: isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200",
      headerGradient: isDark ? "from-emerald-500/10 to-transparent" : "from-emerald-50 to-transparent",
      label: "Prioritas Rendah",
      iconColor: "text-emerald-500",
    },
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const [catRes, taskRes] = await Promise.all([backend.get("/categories"), backend.get("/tasks")]);
      setCategories((catRes.data || []).map((c) => ({ value: c.category_id, label: c.category_name })));

      const tasksByPriority = { High: [], Medium: [], Low: [] };
      taskRes.data.forEach((t) => {
        const s = (t.status || "").toLowerCase();
        if (s === "done" || s === "completed") return;
        const priority = normalizePriority(t.priority);
        if (tasksByPriority[priority]) tasksByPriority[priority].push({ ...t, priority });
      });
      setTasks(tasksByPriority);
    } catch (err) {
      console.error("Error loading tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task) => {
    setEditingTask({
      id: task.task_id, title: task.title, categoryId: task.category_id,
      description: task.description, priority: task.priority, deadline: task.deadline, status: task.status,
    });
    setShowEditForm(true);
  };

  const handleSaveEdit = async (formData) => {
    try {
      await backend.put(`/tasks/${editingTask.id}`, formData);
      setShowEditForm(false);
      setEditingTask(null);
      showPopup("success", "Diperbarui", "Task berhasil diperbarui.");
      await fetchTasks();
    } catch (err) {
      showPopup("error", "Error", err.response?.data?.error || "Failed to update task");
    }
  };

  const handleDelete = (taskId) => showPopup("confirm", "Hapus Task?", "Tindakan ini tidak dapat dibatalkan.", { taskId });

  const handleDeleteConfirm = async () => {
    const taskId = popup.data.taskId;
    try {
      await backend.delete(`/tasks/${taskId}`);
      closePopup();
      showPopup("success", "Dihapus", "Task berhasil dihapus.");
      fetchTasks();
    } catch (err) {
      showPopup("error", "Error", err.response?.data?.error || "Failed to delete task");
    }
  };

  const handleDone = async (taskId) => {
    try {
      await backend.put(`/tasks/${taskId}`, { status: "completed" });
      showPopup("success", "Selesai", "Task ditandai sebagai selesai.");
      fetchTasks();
    } catch (err) {
      showPopup("error", "Error", err.response?.data?.error || "Failed to complete task");
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  if (showEditForm) {
    return (
      <EditTaskForm
        isOpen={showEditForm} isEditMode={true} task={editingTask}
        categories={categories} onSave={handleSaveEdit}
        onCancel={() => { setShowEditForm(false); setEditingTask(null); }}
        onAddCategory={() => {}} onEditCategory={() => {}} onDeleteCategory={() => {}}
      />
    );
  }

  const totalTasks = tasks.High.length + tasks.Medium.length + tasks.Low.length;

  return (
    <div className="min-h-full pb-10">
      <div className="max-w-[1400px] mx-auto space-y-6 animate-slide-up">

        {/* Popups */}
        <Popup show={popup.type === "success" || popup.type === "error"} type={popup.type} title={popup.title} message={popup.message} onCancel={closePopup} isDark={isDark} />
        <Popup show={popup.type === "confirm"} type="confirm" title={popup.title} message={popup.message} onConfirm={handleDeleteConfirm} onCancel={closePopup} confirmText="Ya, Hapus" isDark={isDark} />

        {/* Header */}
        <div className={`rounded-3xl border p-5 md:p-7 backdrop-blur-xl relative overflow-hidden ${panelClass}`}>
          <div className={`absolute -top-32 -right-16 w-80 h-80 rounded-full blur-[80px] pointer-events-none ${isDark ? "bg-rose-500/10" : "bg-rose-400/5"}`}></div>
          <div className="relative z-10">
            <p className={`text-[11px] tracking-widest uppercase font-bold ${isDark ? "text-indigo-400" : "text-[#21569A]"}`}>Overview</p>
            <h1 className={`text-2xl md:text-3xl font-extrabold mt-1 tracking-tight ${headingClass}`}>Task Priorities</h1>
            <p className={`mt-1 text-sm ${subtleClass}`}>{totalTasks} task aktif di semua prioritas</p>
          </div>
        </div>

        {/* Priority Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {["High", "Medium", "Low"].map((priority) => {
            const config = PRIORITY_CONFIG[priority];
            const columnTasks = tasks[priority];

            return (
              <div key={priority} className={`rounded-3xl border backdrop-blur-xl overflow-hidden ${panelClass}`}>
                {/* Column Header */}
                <div className={`bg-gradient-to-r ${config.headerGradient} px-5 py-4 flex items-center justify-between border-b ${isDark ? "border-zinc-800/80" : "border-slate-200/60"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${config.dot} ring-4 ${config.ring}`}></span>
                    <h3 className={`font-bold text-sm ${headingClass}`}>{config.label}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${config.badge}`}>{columnTasks.length}</span>
                </div>

                {/* Task list */}
                <div className="p-4 space-y-3 min-h-[200px]">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => <div key={i} className={`h-16 rounded-2xl animate-pulse ${isDark ? "bg-zinc-800/50" : "bg-slate-100"}`}></div>)}
                    </div>
                  ) : columnTasks.length === 0 ? (
                    <div className={`rounded-2xl border border-dashed flex flex-col items-center justify-center p-8 text-center ${isDark ? "border-zinc-700 bg-zinc-900/30" : "border-slate-200 bg-slate-50/50"}`}>
                      <p className={`text-xs font-medium ${subtleClass}`}>Tidak ada task prioritas {priority.toLowerCase()}</p>
                    </div>
                  ) : (
                    columnTasks.map((task, idx) => (
                      <article
                        key={task.task_id}
                        className={`group rounded-2xl border p-3.5 transition-all duration-200 animate-slide-up ${
                          isDark ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700" : "bg-white border-slate-200/70 hover:border-slate-300 hover:shadow-sm"
                        }`}
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${headingClass}`}>{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[11px] ${subtleClass}`}>{task.category_name || "-"}</span>
                              <span className={`w-0.5 h-0.5 rounded-full ${isDark ? "bg-zinc-600" : "bg-slate-300"}`}></span>
                              <span className={`text-[11px] font-medium ${config.iconColor}`}>{formatDate(task.deadline)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => handleEdit(task)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200" : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"}`} title="Edit">
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(task.task_id)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400" : "hover:bg-rose-50 text-slate-400 hover:text-rose-600"}`} title="Delete">
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDone(task.task_id)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-400" : "hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"}`} title="Complete">
                              <FiCheck className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TaskPriorities;