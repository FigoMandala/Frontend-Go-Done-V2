// src/components/MyTask.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiEdit2, FiTrash2, FiCheck, FiPlus, FiAlertTriangle, FiCheckCircle, FiSearch, FiFilter } from "react-icons/fi";
import EditTaskForm from "./EditTaskForm";
import backend from "../api/backend";

// Sanitize output to prevent XSS when rendering
const sanitizeOutput = (text) => {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

const normalizeDate = (str) => {
  if (!str) return "";
  return str.includes("T") ? str.split("T")[0] : str;
};

const formatDeadlineText = (deadline) => {
  if (!deadline) return "No deadline";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = normalizeDate(deadline).split("-").map(Number);
  const diff = Math.ceil((new Date(year, month - 1, day) - today) / (1000 * 3600 * 24));
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return `${diff} days left`;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ========== Theme-aware Popup Component ==========
const Popup = ({ show, type, title, message, onConfirm, onCancel, confirmText = "OK", isDark }) => {
  if (!show) return null;
  const isConfirm = type === "confirm";
  const isSuccess = type === "success";

  const panelClass = isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200";
  const headingClass = isDark ? "text-zinc-50" : "text-slate-900";
  const subtleClass = isDark ? "text-zinc-400" : "text-slate-500";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/10" style={{ animationDuration: "0.2s" }}>
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
              <button onClick={onCancel} className={`flex-1 py-3 rounded-xl border font-semibold text-sm transition-colors ${isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"}`}>
                Cancel
              </button>
              <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-semibold text-sm hover:bg-rose-600 transition-colors">
                {confirmText}
              </button>
            </>
          ) : (
            <button onClick={onCancel} className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-[#21569A] text-white hover:bg-[#1a4580]"}`}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ========== Category Edit Popup ==========
const CategoryEditPopup = ({ show, categoryName, onSave, onCancel, isDark }) => {
  const [name, setName] = useState(categoryName);
  useEffect(() => { setName(categoryName); }, [categoryName]);
  if (!show) return null;

  const panelClass = isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200";
  const headingClass = isDark ? "text-zinc-50" : "text-slate-900";
  const inputClass = isDark
    ? "bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-indigo-500 focus:ring-indigo-500/20 placeholder-zinc-500"
    : "bg-slate-50/80 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 placeholder-slate-400";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/10">
      <div className={`rounded-3xl p-7 max-w-sm w-full shadow-2xl border ${panelClass}`}>
        <h2 className={`text-lg font-bold mb-4 ${headingClass}`}>Edit Category</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full border rounded-xl px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-4 mb-6 ${inputClass}`}
          onKeyDown={(e) => { if (e.key === "Enter") onSave(name); }}
        />
        <div className="flex gap-3">
          <button onClick={onCancel} className={`flex-1 py-3 rounded-xl border font-semibold text-sm transition-colors ${isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"}`}>
            Cancel
          </button>
          <button onClick={() => onSave(name)} className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-colors ${isDark ? "bg-indigo-600 hover:bg-indigo-700" : "bg-[#21569A] hover:bg-[#1a4580]"}`}>
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

function MyTask() {
  const [loading, setLoading] = useState(true);
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [popup, setPopup] = useState({ show: false, type: "", title: "", message: "", data: null });
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showDefaultCategoryHint, setShowDefaultCategoryHint] = useState(false);
  const [defaultCategoryPreview, setDefaultCategoryPreview] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completeTaskId, setCompleteTaskId] = useState(null);

  const [theme, setTheme] = useState(localStorage.getItem("dashboardTheme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    const handleThemeChange = (event) => {
      if (event.detail === "light" || event.detail === "dark") setTheme(event.detail);
    };
    window.addEventListener("dashboardThemeChange", handleThemeChange);
    return () => window.removeEventListener("dashboardThemeChange", handleThemeChange);
  }, []);

  const categoriesMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => (map[String(c.value)] = c.label));
    return map;
  }, [categories]);

  const showPopup = (type, title, message, data = null) => {
    setPopup({ show: true, type, title, message, data });
  };
  const closePopup = () => {
    setPopup({ show: false, type: "", title: "", message: "", data: null });
  };

  // ========== Fetch initial data ==========
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [catRes, taskRes] = await Promise.all([backend.get("/categories"), backend.get("/tasks")]);
        const normalizedCategories = (catRes.data || []).map((c) => ({ value: c.category_id, label: c.category_name }));
        const normalizedTasks = (taskRes.data || []).map((t) => ({
          id: t.task_id,
          categoryId: t.category_id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          deadline: t.deadline,
          status: (t.status || "pending").toLowerCase() === "done" || (t.status || "").toLowerCase() === "completed" ? "Done" : (t.status || "pending"),
        }));

        setCategories(normalizedCategories);
        setTasks(normalizedTasks);

        const categoryNames = normalizedCategories.map((c) => c.label);
        setDefaultCategoryPreview(categoryNames.slice(0, 5));

        const hintDismissed = localStorage.getItem("hideDefaultCategoryHint") === "1";
        if (!hintDismissed && normalizedTasks.length === 0 && categoryNames.length > 0) {
          setShowDefaultCategoryHint(true);
        }
      } catch (err) {
        showPopup("error", "Error", err.response?.data?.error || "Failed to load data from server");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ========== Filtered Tasks ==========
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => t.title && t.title.trim())
      .filter(t => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchCategory = (categoriesMap[String(t.categoryId)] || "").toLowerCase().includes(q);
          if (!matchTitle && !matchCategory) return false;
        }
        if (filterPriority !== "all" && (t.priority || "").toLowerCase() !== filterPriority) return false;
        if (filterStatus === "active" && (t.status || "").toLowerCase() === "done") return false;
        if (filterStatus === "done" && (t.status || "").toLowerCase() !== "done") return false;
        return true;
      });
  }, [tasks, searchQuery, filterPriority, filterStatus, categoriesMap]);

  // ========== Category operations ==========
  const handleAddCustomCategory = async (newName) => {
    try {
      const res = await backend.post("/categories", { category_name: newName });
      setCategories((prev) => [...prev, { value: res.data?.category_id, label: newName }]);
      showPopup("success", "Category Added", "New category has been created.");
    } catch (err) {
      showPopup("error", "Error", err.response?.data?.error || "Failed to add category");
    }
  };

  const handleEditCategory = (catId) => {
    const found = categories.find((c) => String(c.value) === String(catId));
    showPopup("categoryEdit", "", "", { id: catId, name: found?.label || "" });
  };

  const handleSaveCategoryEdit = async (newName) => {
    const name = newName.trim();
    if (!name) return;
    const catId = popup.data.id;
    try {
      await backend.put(`/categories/${catId}`, { category_name: name });
      setCategories((prev) => prev.map((c) => String(c.value) === String(catId) ? { ...c, label: name } : c));
      closePopup();
      showPopup("success", "Updated", "Category renamed successfully.");
    } catch (err) {
      showPopup("error", "Error", err.response?.data?.error || "Failed to update category");
    }
  };

  const handleDeleteCategory = async (catId) => {
    try {
      await backend.delete(`/categories/${catId}`);
      setCategories((prev) => prev.filter((c) => String(c.value) !== String(catId)));
      showPopup("success", "Deleted", "Category removed.");
    } catch (err) {
      if (err.response?.status === 400) {
        const found = categories.find((c) => String(c.value) === String(catId));
        showPopup("error", "Cannot Delete", `Category "${found?.label || "this"}" is used by tasks.`);
        return;
      }
      showPopup("error", "Error", err.response?.data?.error || "Failed to delete category");
    }
  };

  // ========== Task operations ==========
  const handleSaveTask = async (formData) => {
    if (isRequestPending) return;
    setIsRequestPending(true);
    try {
      if (isEditMode) {
        await backend.put(`/tasks/${editingTaskId}`, formData);
        setTasks((prev) => prev.map((t) => t.id === editingTaskId ? { ...t, categoryId: formData.category_id, title: formData.title, description: formData.description, priority: formData.priority, deadline: formData.deadline } : t));
        showPopup("success", "Updated", "Task updated successfully.");
      } else {
        const res = await backend.post("/tasks", formData);
        setTasks((prev) => [{ id: res.data?.task_id, categoryId: formData.category_id, title: formData.title, description: formData.description, priority: formData.priority, deadline: formData.deadline, status: "pending" }, ...prev]);
        showPopup("success", "Created", "New task has been added.");
      }
      setShowAddForm(false);
      setIsEditMode(false);
      setEditingTaskId(null);
    } catch (err) {
      showPopup("error", "Error", err.response?.data?.error || err.response?.data?.message || "Failed to save task");
    } finally {
      setIsRequestPending(false);
    }
  };

  const handleDeleteClick = (taskId) => {
    showPopup("confirm", "Delete Task?", "This action cannot be undone.", { taskId });
  };

  const handleDeleteConfirm = async () => {
    if (isRequestPending) return;
    setIsRequestPending(true);
    const taskId = popup.data.taskId;
    try {
      await backend.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      closePopup();
      showPopup("success", "Deleted", "Task removed successfully.");
    } catch (err) {
      showPopup("error", "Error", err.response?.data?.error || "Failed to delete task");
    } finally {
      setIsRequestPending(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTaskId(task.id);
    setIsEditMode(true);
    setShowAddForm(true);
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
      showPopup("success", "Completed", "Task marked as done.");
    } catch (err) {
      showPopup("error", "Error", err.response?.data?.error || "Failed to complete task");
    } finally {
      setIsRequestPending(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setIsEditMode(false);
    setEditingTaskId(null);
  };

  const dismissDefaultCategoryHint = () => {
    setShowDefaultCategoryHint(false);
    localStorage.setItem("hideDefaultCategoryHint", "1");
  };

  // Shared classes
  const panelClass = isDark ? "bg-zinc-900/40 border-zinc-800/80 shadow-md shadow-black/10" : "bg-white/90 border-slate-200/60 shadow-sm shadow-slate-200/50";
  const headingClass = isDark ? "text-zinc-50" : "text-slate-900";
  const subtleClass = isDark ? "text-zinc-400" : "text-slate-500";

  const priorityDot = (p) => {
    switch ((p || "").toLowerCase()) {
      case "high": return "bg-rose-500";
      case "medium": return "bg-amber-500";
      case "low": return "bg-emerald-500";
      default: return "bg-zinc-400";
    }
  };

  const priorityBadgeClass = (p) => {
    switch ((p || "").toLowerCase()) {
      case "high": return isDark ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-200";
      case "medium": return isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-200";
      case "low": return isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200";
      default: return isDark ? "bg-zinc-800/50 text-zinc-400 border-zinc-700/50" : "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  const deadlineBadgeClass = (deadline) => {
    if (!deadline) return subtleClass;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [y, m, d] = normalizeDate(deadline).split("-").map(Number);
    const diff = Math.ceil((new Date(y, m - 1, d) - today) / (1000 * 3600 * 24));
    if (diff < 0) return isDark ? "text-rose-400" : "text-rose-600";
    if (diff === 0) return isDark ? "text-amber-400" : "text-amber-600";
    return subtleClass;
  };

  // ========== Show Add/Edit Form ==========
  if (showAddForm) {
    const taskToEdit = isEditMode ? tasks.find(t => t.id === editingTaskId) : null;
    const formTaskData = taskToEdit ? {
      id: taskToEdit.id, title: taskToEdit.title, categoryId: taskToEdit.categoryId,
      description: taskToEdit.description, priority: taskToEdit.priority,
      deadline: normalizeDate(taskToEdit.deadline), status: taskToEdit.status
    } : null;

    return (
      <>
        <EditTaskForm
          isOpen={showAddForm} isEditMode={isEditMode} task={formTaskData}
          categories={categories} onSave={handleSaveTask} onCancel={handleCancel}
          onAddCategory={handleAddCustomCategory} onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
        />
        <CategoryEditPopup show={popup.type === "categoryEdit"} categoryName={popup.data?.name || ""} onSave={handleSaveCategoryEdit} onCancel={closePopup} isDark={isDark} />
        <Popup show={popup.type === "error"} type="error" title={popup.title} message={popup.message} onCancel={closePopup} isDark={isDark} />
      </>
    );
  }

  // ========== Stats ==========
  const totalActive = tasks.filter(t => (t.status || "").toLowerCase() !== "done").length;
  const totalDone = tasks.filter(t => (t.status || "").toLowerCase() === "done").length;

  // ========== UI - Task List ==========
  return (
    <div className="min-h-full pb-10">
      <div className="max-w-[1400px] mx-auto space-y-6 animate-slide-up">

        {/* Popups */}
        <Popup show={popup.type === "success" || popup.type === "error"} type={popup.type} title={popup.title} message={popup.message} onCancel={closePopup} isDark={isDark} />
        <Popup show={popup.type === "confirm"} type="confirm" title={popup.title} message={popup.message} onConfirm={handleDeleteConfirm} onCancel={closePopup} confirmText="Yes, Delete" isDark={isDark} />

        {/* Complete Confirmation Popup */}
        {showCompleteConfirm && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/10">
            <div className={`rounded-3xl p-7 max-w-sm w-full shadow-2xl text-center border animate-slide-up ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${isDark ? "bg-emerald-500/10" : "bg-emerald-100"}`}>
                <FiCheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? "text-zinc-50" : "text-slate-900"}`}>Mark as Done?</h3>
              <p className={`text-sm mb-7 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Task ini akan ditandai sebagai selesai.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCompleteConfirm(false); setCompleteTaskId(null); }}
                  className={`flex-1 py-3 rounded-xl border font-semibold text-sm transition-colors ${isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinishTask}
                  className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors ${isDark ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-500 hover:bg-emerald-600"}`}
                >
                  Yes, Complete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Header Panel */}
        <div className={`rounded-3xl border p-5 md:p-7 backdrop-blur-xl relative overflow-hidden ${panelClass}`}>
          <div className={`absolute -top-32 -right-16 w-80 h-80 rounded-full blur-[80px] pointer-events-none ${isDark ? "bg-indigo-500/20" : "bg-blue-400/10"}`}></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className={`text-[11px] tracking-widest uppercase font-bold ${isDark ? "text-indigo-400" : "text-[#21569A]"}`}>Task Manager</p>
              <h1 className={`text-2xl md:text-3xl font-extrabold mt-1 tracking-tight ${headingClass}`}>My Tasks</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className={`text-sm font-medium ${subtleClass}`}>{totalActive} active</span>
                <span className={`w-1 h-1 rounded-full ${isDark ? "bg-zinc-600" : "bg-slate-300"}`}></span>
                <span className={`text-sm font-medium ${subtleClass}`}>{totalDone} completed</span>
              </div>
            </div>
            <button
              onClick={() => { setShowAddForm(true); setIsEditMode(false); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all shadow-sm ${
                isDark ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-[#21569A] hover:bg-[#1a4580] text-white"
              }`}
            >
              <FiPlus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        {showDefaultCategoryHint && (
          <div className={`rounded-2xl border px-4 py-3 md:px-5 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-blue-50/80 border-blue-200"}`}>
            <div>
              <p className={`text-sm font-semibold ${headingClass}`}>Category default siap dipakai</p>
              <p className={`text-xs mt-1 ${subtleClass}`}>
                Kamu bisa langsung mulai dengan: {defaultCategoryPreview.join(", ")}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissDefaultCategoryHint}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-blue-200 text-[#21569A] hover:bg-blue-100"}`}
            >
              Tutup
            </button>
          </div>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-colors ${isDark ? "bg-zinc-900/40 border-zinc-800/80" : "bg-white/90 border-slate-200/60"}`}>
            <FiSearch className={`w-4 h-4 shrink-0 ${subtleClass}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className={`flex-1 bg-transparent text-sm font-medium outline-none ${isDark ? "text-zinc-100 placeholder-zinc-500" : "text-slate-900 placeholder-slate-400"}`}
            />
          </div>
          <div className="flex gap-2">
            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className={`px-4 py-2.5 rounded-2xl border text-sm font-medium transition-colors cursor-pointer outline-none ${
                isDark ? "bg-zinc-900/40 border-zinc-800/80 text-zinc-300" : "bg-white/90 border-slate-200/60 text-slate-700"
              }`}
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2.5 rounded-2xl border text-sm font-medium transition-colors cursor-pointer outline-none ${
                isDark ? "bg-zinc-900/40 border-zinc-800/80 text-zinc-300" : "bg-white/90 border-slate-200/60 text-slate-700"
              }`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className={`rounded-3xl border p-5 md:p-6 backdrop-blur-xl ${panelClass}`}>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-20 rounded-2xl ${isDark ? "bg-zinc-800/50" : "bg-slate-100"}`}></div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className={`rounded-2xl border border-dashed flex flex-col items-center justify-center p-10 text-center ${isDark ? "border-zinc-700 bg-zinc-900/30" : "border-slate-200 bg-slate-50/50"}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-zinc-800" : "bg-slate-100"}`}>
                <FiCheckCircle className={`w-6 h-6 ${subtleClass}`} />
              </div>
              <h3 className={`text-[1rem] font-semibold ${headingClass}`}>
                {searchQuery || filterPriority !== "all" || filterStatus !== "all" ? "No matching tasks" : "No tasks yet"}
              </h3>
              <p className={`mt-1 text-sm ${subtleClass}`}>
                {searchQuery || filterPriority !== "all" || filterStatus !== "all" ? "Try adjusting your filters." : "Create your first task to get started."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task, idx) => {
                const isDone = (task.status || "").toLowerCase() === "done";
                return (
                  <article
                    key={task.id}
                    className={`group rounded-2xl border p-4 flex items-center gap-4 transition-all duration-200 animate-slide-up ${
                      isDone
                        ? isDark ? "bg-zinc-900/30 border-zinc-800/50 opacity-50" : "bg-slate-50/50 border-slate-200/40 opacity-50"
                        : isDark ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700" : "bg-white border-slate-200/70 hover:border-slate-300 hover:shadow-sm"
                    }`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {/* Complete button */}
                    <button
                      onClick={() => !isDone && requestFinishTask(task.id)}
                      disabled={isDone}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isDone
                          ? isDark ? "border-emerald-500/30 bg-emerald-500/10" : "border-emerald-400/30 bg-emerald-50"
                          : isDark ? "border-zinc-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-zinc-600 hover:text-emerald-400" : "border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600"
                      }`}
                    >
                      <FiCheck className={`w-3.5 h-3.5 ${isDone ? "text-emerald-500" : "opacity-0 group-hover:opacity-100 transition-opacity"}`} />
                    </button>

                    {/* Priority dot */}
                    <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot(task.priority)}`}></span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDone ? "line-through " + subtleClass : headingClass}`}>
                        {sanitizeOutput(task.title)}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`text-xs truncate ${subtleClass}`}>
                          {sanitizeOutput(categoriesMap[String(task.categoryId)] || "Uncategorized")}
                        </span>
                        <span className={`w-0.5 h-0.5 rounded-full ${isDark ? "bg-zinc-600" : "bg-slate-300"}`}></span>
                        <span className={`text-xs font-medium ${deadlineBadgeClass(task.deadline)}`}>
                          {formatDeadlineText(task.deadline)}
                        </span>
                      </div>
                    </div>

                    {/* Priority Badge */}
                    <span className={`text-[10px] px-2 py-1 rounded-md border uppercase font-bold tracking-widest shrink-0 hidden sm:inline-block ${priorityBadgeClass(task.priority)}`}>
                      {task.priority || "normal"}
                    </span>

                    {/* Actions */}
                    <div className={`flex items-center gap-1 shrink-0 transition-opacity ${isDone ? "opacity-30" : "opacity-0 group-hover:opacity-100"}`}>
                      <button
                        onClick={() => !isDone && handleEditTask(task)}
                        disabled={isDone}
                        className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"}`}
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(task.id)}
                        className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400" : "hover:bg-rose-50 text-slate-400 hover:text-rose-600"}`}
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyTask;