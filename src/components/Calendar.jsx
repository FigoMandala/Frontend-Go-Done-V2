import React, { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiMinimize2, FiCalendar } from "react-icons/fi";
import backend from "../api/backend";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [viewMode, setViewMode] = useState("all");

  const [theme, setTheme] = useState(localStorage.getItem("dashboardTheme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    const handleThemeChange = (event) => {
      if (event.detail === "light" || event.detail === "dark") setTheme(event.detail);
    };
    window.addEventListener("dashboardThemeChange", handleThemeChange);
    return () => window.removeEventListener("dashboardThemeChange", handleThemeChange);
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await backend.get("/tasks");
        const parsed = res.data
          .filter((t) => {
            const s = (t.status || "").toLowerCase();
            return s !== "done" && s !== "completed";
          })
          .map((t) => ({
            id: t.task_id,
            category: t.category_name,
            title: t.title,
            description: t.description,
            deadline: (t.deadline || "").trim(),
            priority: t.priority?.toLowerCase(),
            status: t.status,
          }));
        setTasks(parsed);
      } catch (e) {
        console.error("Error fetching tasks:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const panelClass = isDark
    ? "bg-zinc-900/40 border-zinc-800/80 shadow-md shadow-black/10"
    : "bg-white/90 border-slate-200/60 shadow-sm shadow-slate-200/50";
  const headingClass = isDark ? "text-zinc-50" : "text-slate-900";
  const subtleClass = isDark ? "text-zinc-400" : "text-slate-500";

  const getPriorityDot = (p) => {
    switch (p) {
      case "high": return "bg-rose-500";
      case "medium": return "bg-amber-500";
      case "low": return "bg-emerald-500";
      default: return "bg-zinc-400";
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case "high": return isDark ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-200";
      case "medium": return isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-200";
      case "low": return isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200";
      default: return isDark ? "bg-zinc-800/50 text-zinc-400 border-zinc-700/50" : "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));

  const getEventsForDay = (day) => {
    const cm = month + 1;
    return tasks.filter((t) => {
      if (!t.deadline || !t.title?.trim()) return false;
      const parts = t.deadline.split("-");
      if (parts.length !== 3) return false;
      return parseInt(parts[2]) === day && parseInt(parts[1]) === cm && parseInt(parts[0]) === year;
    });
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const validTasks = tasks.filter((t) => t.title?.trim());

  const handleDayClick = (day) => {
    if (!day) return;
    const events = getEventsForDay(day);
    setSelectedDay(day);
    setSelectedEvents(events);
    setViewMode("selected");
  };

  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // Task card component
  const TaskCard = ({ task }) => (
    <div className={`rounded-2xl border p-3.5 transition-all duration-200 ${isDark ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700" : "bg-white border-slate-200/70 hover:border-slate-300 hover:shadow-sm"}`}>
      <div className="flex items-start gap-3">
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getPriorityDot(task.priority)}`}></span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${headingClass}`}>{task.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.category && <span className={`text-[11px] ${subtleClass}`}>{task.category}</span>}
            {task.category && <span className={`w-0.5 h-0.5 rounded-full ${isDark ? "bg-zinc-600" : "bg-slate-300"}`}></span>}
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${getPriorityBadge(task.priority)}`}>
              {task.priority || "normal"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-full pb-10">
      <div className="max-w-[1400px] mx-auto space-y-6 animate-slide-up">

        {/* Header */}
        <div className={`rounded-3xl border p-5 md:p-7 backdrop-blur-xl relative overflow-hidden ${panelClass}`}>
          <div className={`absolute -top-32 -right-16 w-80 h-80 rounded-full blur-[80px] pointer-events-none ${isDark ? "bg-indigo-500/10" : "bg-blue-400/5"}`}></div>
          <div className="relative z-10 flex items-center gap-3">
            <FiCalendar className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-[#21569A]"}`} />
            <div>
              <p className={`text-[11px] tracking-widest uppercase font-bold ${isDark ? "text-indigo-400" : "text-[#21569A]"}`}>Schedule</p>
              <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${headingClass}`}>Calendar</h1>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Calendar Panel */}
          <div className={`rounded-3xl border backdrop-blur-xl p-5 md:p-6 relative flex flex-col transition-all ${panelClass} ${isExpanded ? "lg:col-span-3" : "lg:col-span-2"}`}>

            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-5">
              <h2 className={`text-lg font-bold tracking-tight ${headingClass}`}>
                {MONTHS[month]} {year}
              </h2>
              <div className="flex gap-1.5">
                <button onClick={prevMonth} className={`p-2.5 rounded-xl transition-all ${isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100" : "hover:bg-slate-100 text-slate-400 hover:text-slate-800"}`}>
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={nextMonth} className={`p-2.5 rounded-xl transition-all ${isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100" : "hover:bg-slate-100 text-slate-400 hover:text-slate-800"}`}>
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {DAYS_SHORT.map((d) => (
                <div key={d} className={`text-center text-[10px] font-bold uppercase tracking-widest py-2 ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 mb-14">
              {days.map((day, idx) => {
                const events = day ? getEventsForDay(day) : [];
                const hasHigh = events.some((e) => e.priority === "high");
                const hasMedium = events.some((e) => e.priority === "medium");
                const hasLow = events.some((e) => e.priority === "low");
                const hasEvents = events.length > 0;
                const todayMark = day && isToday(day);
                const isSelected = day === selectedDay && viewMode === "selected";

                return (
                  <div
                    key={idx}
                    onClick={() => handleDayClick(day)}
                    className={`rounded-xl flex flex-col items-start justify-start p-2 border transition-all duration-200 ${
                      isExpanded ? "min-h-[110px]" : "min-h-[72px]"
                    } ${
                      day === null ? "cursor-default border-transparent" :
                      isSelected
                        ? isDark ? "cursor-pointer border-indigo-500/40 bg-indigo-500/10" : "cursor-pointer border-blue-400/40 bg-blue-50/60"
                        : hasEvents
                          ? isDark ? "cursor-pointer border-zinc-700/50 bg-zinc-800/40 hover:border-zinc-600" : "cursor-pointer border-slate-200/70 bg-slate-50/60 hover:border-slate-300"
                          : isDark ? "cursor-pointer border-transparent hover:bg-zinc-800/30 hover:border-zinc-700/30" : "cursor-pointer border-transparent hover:bg-slate-50/50 hover:border-slate-200/30"
                    }`}
                  >
                    {day !== null && (
                      <>
                        <div className="flex justify-between items-center w-full">
                          <span className={`text-xs font-semibold flex items-center justify-center w-6 h-6 rounded-lg ${
                            todayMark
                              ? isDark ? "bg-indigo-600 text-white" : "bg-[#21569A] text-white"
                              : headingClass
                          }`}>
                            {day}
                          </span>
                          {/* Priority dots */}
                          <div className="flex gap-0.5">
                            {hasHigh && <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>}
                            {hasMedium && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
                            {hasLow && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                          </div>
                        </div>

                        {/* Events preview */}
                        <div className="w-full mt-1 flex flex-col gap-0.5">
                          {events.slice(0, isExpanded ? 4 : 2).map((ev, i) =>
                            isExpanded ? (
                              <div key={i} className={`text-[9px] px-1.5 py-0.5 rounded font-semibold truncate w-full border-l-2 ${
                                ev.priority === "high"
                                  ? isDark ? "bg-rose-500/10 text-rose-400 border-rose-500" : "bg-rose-50 text-rose-700 border-rose-500"
                                  : ev.priority === "medium"
                                    ? isDark ? "bg-amber-500/10 text-amber-400 border-amber-500" : "bg-amber-50 text-amber-700 border-amber-500"
                                    : isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500" : "bg-emerald-50 text-emerald-700 border-emerald-500"
                              }`}>
                                {ev.title}
                              </div>
                            ) : (
                              <div key={i} className={`w-full h-1 rounded-full ${getPriorityDot(ev.priority)}`}></div>
                            )
                          )}
                          {events.length > (isExpanded ? 4 : 2) && (
                            <span className={`text-[8px] font-bold ${subtleClass}`}>+{events.length - (isExpanded ? 4 : 2)} more</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Expand Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`absolute bottom-5 right-5 p-3 rounded-2xl transition-all shadow-lg ${
                isDark ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20" : "bg-[#21569A] hover:bg-[#1a4580] text-white shadow-blue-500/20"
              }`}
            >
              {isExpanded ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Right Sidebar */}
          {!isExpanded && (
            <div className={`rounded-3xl border backdrop-blur-xl flex flex-col ${panelClass}`}>
              {/* Tabs */}
              <div className={`flex gap-1.5 p-4 border-b ${isDark ? "border-zinc-800/80" : "border-slate-200/60"}`}>
                <button
                  onClick={() => setViewMode("all")}
                  className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs transition-all ${
                    viewMode === "all"
                      ? isDark ? "bg-indigo-600 text-white shadow-sm" : "bg-[#21569A] text-white shadow-sm"
                      : isDark ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  All Events
                </button>
                <button
                  onClick={() => setViewMode("selected")}
                  className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs transition-all ${
                    viewMode === "selected"
                      ? isDark ? "bg-indigo-600 text-white shadow-sm" : "bg-[#21569A] text-white shadow-sm"
                      : isDark ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Selected
                </button>
              </div>

              {/* Selected date header */}
              {viewMode === "selected" && selectedDay && (
                <div className={`px-5 pt-4 pb-2`}>
                  <h3 className={`text-sm font-bold ${headingClass}`}>
                    {new Date(year, month, selectedDay).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </h3>
                </div>
              )}

              {/* Task list */}
              <div className="flex-1 px-4 py-3 space-y-2.5 overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className={`h-14 rounded-2xl animate-pulse ${isDark ? "bg-zinc-800/50" : "bg-slate-100"}`}></div>)}
                  </div>
                ) : viewMode === "all" ? (
                  validTasks.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center py-10 text-center ${subtleClass}`}>
                      <FiCalendar className={`w-8 h-8 mb-3 ${isDark ? "text-zinc-600" : "text-slate-300"}`} />
                      <p className="text-sm font-medium">No events</p>
                    </div>
                  ) : (
                    (() => {
                      const grouped = {};
                      validTasks.forEach((t) => {
                        const d = t.deadline || "No date";
                        if (!grouped[d]) grouped[d] = [];
                        grouped[d].push(t);
                      });
                      return Object.keys(grouped).sort().map((date) => {
                        const dateTasks = grouped[date];
                        const dateObj = date !== "No date" ? new Date(date + "T00:00:00") : null;
                        const formattedDate = dateObj ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No date";
                        return (
                          <div key={date} className="mb-1">
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${subtleClass}`}>{formattedDate}</p>
                            <div className="space-y-2">
                              {dateTasks.map((t) => <TaskCard key={t.id} task={t} />)}
                            </div>
                          </div>
                        );
                      });
                    })()
                  )
                ) : (
                  selectedEvents.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center py-10 text-center ${subtleClass}`}>
                      <FiCalendar className={`w-8 h-8 mb-3 ${isDark ? "text-zinc-600" : "text-slate-300"}`} />
                      <p className="text-sm font-medium">{selectedDay ? "No tasks on this date" : "Click a date to view tasks"}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedEvents.map((t) => <TaskCard key={t.id} task={t} />)}
                    </div>
                  )
                )}
              </div>

              {/* Legend */}
              <div className={`p-4 border-t ${isDark ? "border-zinc-800/80" : "border-slate-200/60"}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${subtleClass}`}>Priority Legend</p>
                <div className="flex gap-4">
                  {[
                    { label: "High", dot: "bg-rose-500" },
                    { label: "Medium", dot: "bg-amber-500" },
                    { label: "Low", dot: "bg-emerald-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${item.dot}`}></div>
                      <span className={`text-[11px] font-medium ${subtleClass}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;