import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import CustomDropdown from "./CustomDropdown";
import DatePicker from "./DatePicker";

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

function EditTaskForm({
  isOpen,
  isEditMode,
  task,
  categories,
  onSave,
  onCancel,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) {
  const [taskTitle, setTaskTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("pending");
  const [validationMessage, setValidationMessage] = useState("");
  const [showValidationPopup, setShowValidationPopup] = useState(false);

  const [theme, setTheme] = useState(localStorage.getItem("dashboardTheme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    const handleThemeChange = (event) => {
      if (event.detail === "light" || event.detail === "dark") setTheme(event.detail);
    };
    window.addEventListener("dashboardThemeChange", handleThemeChange);
    return () => window.removeEventListener("dashboardThemeChange", handleThemeChange);
  }, []);

  const priorityOptions = [
    { label: "Low", value: "Low" },
    { label: "Medium", value: "Medium" },
    { label: "High", value: "High" },
  ];

  useEffect(() => {
    if (isEditMode && task) {
      setTaskTitle(task.title || "");
      setCategoryId(task.category_id || task.categoryId || "");
      setDescription(task.description || "");
      setPriority(task.priority || "");
      setDeadline(normalizeDate(task.deadline) || "");
      const normalizedStatus = (task.status || "pending").toString().toLowerCase();
      setStatus(normalizedStatus === "completed" ? "done" : normalizedStatus);
    } else {
      resetForm();
    }
  }, [isEditMode, task]);

  useEffect(() => {
    if (!isEditMode && !categoryId && categories?.length) {
      setCategoryId(categories[0].value);
    }
  }, [isEditMode, categoryId, categories]);

  const resetForm = () => {
    setTaskTitle("");
    setCategoryId(categories?.[0]?.value || "");
    setDescription("");
    setPriority("");
    setDeadline("");
    setStatus("pending");
  };

  const normalizeDate = (str) => {
    if (!str) return "";
    if (str.includes("T")) return str.split("T")[0];
    return str;
  };

  const validateForm = () => {
    if (!taskTitle.trim()) { setValidationMessage("Judul task wajib diisi!"); setShowValidationPopup(true); return false; }
    if (!categoryId) { setValidationMessage("Pilih kategori terlebih dahulu!"); setShowValidationPopup(true); return false; }
    if (!description.trim()) { setValidationMessage("Deskripsi task wajib diisi!"); setShowValidationPopup(true); return false; }
    if (!priority) { setValidationMessage("Pilih prioritas terlebih dahulu!"); setShowValidationPopup(true); return false; }
    if (!deadline) { setValidationMessage("Pilih deadline terlebih dahulu!"); setShowValidationPopup(true); return false; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(deadline) < today) { setValidationMessage("Deadline tidak boleh di masa lalu!"); setShowValidationPopup(true); return false; }
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    onSave({
      category_id: categoryId,
      title: sanitizeInput(taskTitle.trim()),
      description: sanitizeInput(description.trim()),
      deadline: normalizeDate(deadline),
      priority: priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase(),
      status: status,
    });
  };

  const handleCancel = () => { resetForm(); onCancel(); };

  if (!isOpen) return null;

  const panelClass = isDark ? "bg-zinc-900/40 border-zinc-800/80 shadow-md shadow-black/10" : "bg-white/90 border-slate-200/60 shadow-sm shadow-slate-200/50";
  const headingClass = isDark ? "text-zinc-50" : "text-slate-900";
  const subtleClass = isDark ? "text-zinc-400" : "text-slate-500";
  const labelClass = isDark ? "text-zinc-300 font-semibold text-sm" : "text-slate-700 font-semibold text-sm";
  const inputClass = isDark
    ? "bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-indigo-500 focus:ring-indigo-500/20 placeholder-zinc-500"
    : "bg-slate-50/80 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 placeholder-slate-400";

  return (
    <div className="min-h-full pb-10">
      <div className="max-w-[900px] mx-auto space-y-6 animate-slide-up">

        {/* Header */}
        <div className={`rounded-3xl border p-5 md:p-7 backdrop-blur-xl relative overflow-hidden ${panelClass}`}>
          <div className={`absolute -top-32 -right-16 w-80 h-80 rounded-full blur-[80px] pointer-events-none ${isDark ? "bg-indigo-500/20" : "bg-blue-400/10"}`}></div>
          <div className="relative z-10">
            <p className={`text-[11px] tracking-widest uppercase font-bold ${isDark ? "text-indigo-400" : "text-[#21569A]"}`}>
              {isEditMode ? "Edit" : "Buat"}
            </p>
            <h1 className={`text-2xl md:text-3xl font-extrabold mt-1 tracking-tight ${headingClass}`}>
              {isEditMode ? "Edit Task" : "Task Baru"}
            </h1>
            <p className={`mt-1 text-sm ${subtleClass}`}>
              {isEditMode ? "Perbarui detail di bawah ini." : "Isi detail untuk membuat task."}
            </p>
          </div>
        </div>

        {/* Form Panel */}
        <div className={`rounded-3xl border p-6 md:p-8 backdrop-blur-xl ${panelClass}`}>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>

            {/* Title */}
            <div>
              <label className={`block mb-2 ${labelClass}`}>Judul Task</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-4 ${inputClass}`}
                placeholder="Apa yang perlu diselesaikan?"
              />
            </div>

            {/* Category */}
            <CustomDropdown
              label="Kategori"
              selected={categoryId}
              onSelect={(val) => setCategoryId(val)}
              options={categories}
              allowCustom
              onAddCustom={onAddCategory}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
              isDark={isDark}
            />
            {categories.length === 0 && (
              <p className={`mt-2 text-xs ${subtleClass}`}>
                Belum ada category. Tambahkan category dulu lewat field New category di dropdown.
              </p>
            )}

            {/* Description */}
            <div>
              <label className={`block mb-2 ${labelClass}`}>Deskripsi</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full border rounded-xl px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-4 resize-none ${inputClass}`}
                placeholder="Tambahkan detail tentang task ini..."
              />
            </div>

            {/* Priority / Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <CustomDropdown
                label="Prioritas"
                selected={priority}
                onSelect={setPriority}
                options={priorityOptions}
                isDark={isDark}
              />
              <DatePicker
                label="Deadline"
                value={deadline}
                onChange={(val) => setDeadline(val)}
                isDark={isDark}
                minDate={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-colors shadow-sm ${isDark ? "bg-indigo-600 hover:bg-indigo-700" : "bg-[#21569A] hover:bg-[#1a4580]"}`}
              >
                {isEditMode ? "Perbarui Task" : "Buat Task"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className={`px-6 py-3 rounded-xl font-semibold text-sm border transition-colors ${isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"}`}
              >
                Batal
              </button>
            </div>
          </form>
        </div>

        {/* Validation popup */}
        {showValidationPopup && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/10 animate-slide-up" style={{ animationDuration: "0.2s" }}>
            <div className={`rounded-3xl p-7 max-w-sm w-full shadow-2xl text-center border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${isDark ? "bg-amber-500/10" : "bg-amber-100"}`}>
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className={`text-lg font-bold mb-2 ${headingClass}`}>Field Wajib</h3>
              <p className={`text-sm mb-7 ${subtleClass}`}>{validationMessage}</p>
              <button
                onClick={() => setShowValidationPopup(false)}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-[#21569A] text-white hover:bg-[#1a4580]"}`}
              >
                OK
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}

export default EditTaskForm;
