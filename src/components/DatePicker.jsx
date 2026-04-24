// src/components/DatePicker.jsx
import React, { useState, useEffect, useRef } from "react";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function DatePicker({ label, value, onChange, isDark = false, minDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });
  const wrapperRef = useRef(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDateObj = minDate ? new Date(minDate) : today;
  minDateObj.setHours(0, 0, 0, 0);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Sync viewDate when value changes externally
  useEffect(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      setViewDate(new Date(y, m - 1, 1));
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  // Build calendar grid
  const calendarDays = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, type: "prev", date: new Date(year, month - 1, prevMonthDays - i) });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ day: d, type: "current", date: new Date(year, month, d) });
  }

  // Next month leading days
  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({ day: d, type: "next", date: new Date(year, month + 1, d) });
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isSelected = (date) => {
    if (!value) return false;
    const [vy, vm, vd] = value.split("-").map(Number);
    return date.getFullYear() === vy && date.getMonth() === vm - 1 && date.getDate() === vd;
  };

  const isToday = (date) => {
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  };

  const isDisabled = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < minDateObj;
  };

  const selectDate = (date) => {
    if (isDisabled(date)) return;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const formatDisplayDate = (val) => {
    if (!val) return null;
    const [y, m, d] = val.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  // Quick picks
  const quickPicks = [
    { label: "Today", date: new Date() },
    { label: "Tomorrow", date: new Date(Date.now() + 86400000) },
    { label: "Next Week", date: new Date(Date.now() + 7 * 86400000) },
  ];

  const labelClass = isDark ? "text-zinc-300 font-semibold text-sm" : "text-slate-700 font-semibold text-sm";

  return (
    <div className="relative" ref={wrapperRef}>
      {label && <label className={`block mb-2 ${labelClass}`}>{label}</label>}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(s => !s)}
        className={`w-full flex justify-between items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 border outline-none ${
          isDark
            ? `bg-zinc-800 text-zinc-100 ${isOpen ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/5" : "border-zinc-700 hover:border-zinc-600"}`
            : `bg-slate-50/80 text-slate-900 ${isOpen ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/5" : "border-slate-200 hover:border-slate-300"}`
        }`}
      >
        <span className="flex items-center gap-2.5">
          <FiCalendar className={`w-4 h-4 ${isDark ? "text-indigo-400" : "text-blue-500"}`} />
          <span className={value ? "" : (isDark ? "text-zinc-500" : "text-slate-400")}>
            {formatDisplayDate(value) || "Pick a date..."}
          </span>
        </span>
        <FiChevronRight className={`w-4 h-4 transition-all duration-300 ${isDark ? "text-zinc-500" : "text-slate-400"} ${isOpen ? "rotate-90 scale-90" : ""}`} />
      </button>

      {/* Calendar Panel — opens upward */}
      <div
        className={`absolute z-30 w-[320px] bottom-full mb-1.5 rounded-2xl overflow-hidden border transition-all duration-300 origin-bottom-left ${
          isDark
            ? "bg-zinc-800/95 backdrop-blur-xl border-zinc-700 shadow-2xl shadow-black/40"
            : "bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl shadow-slate-300/30"
        } ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.97] translate-y-1 pointer-events-none"}`}
      >
        {/* Month/Year Header */}
        <div className={`flex items-center justify-between px-4 pt-4 pb-2`}>
          <button
            type="button"
            onClick={prevMonth}
            className={`p-2 rounded-xl transition-all duration-200 ${isDark ? "hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100" : "hover:bg-slate-100 text-slate-400 hover:text-slate-800"}`}
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <span className={`text-sm font-bold tracking-tight ${isDark ? "text-zinc-100" : "text-slate-900"}`}>
              {MONTHS[month]} {year}
            </span>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className={`p-2 rounded-xl transition-all duration-200 ${isDark ? "hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100" : "hover:bg-slate-100 text-slate-400 hover:text-slate-800"}`}
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 px-3 pb-1">
          {DAYS_SHORT.map((d) => (
            <div key={d} className={`text-center text-[10px] font-bold uppercase tracking-widest py-2 ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 px-3 pb-2 gap-0.5">
          {calendarDays.map((item, idx) => {
            const sel = isSelected(item.date);
            const todayMark = isToday(item.date);
            const disabled = isDisabled(item.date);
            const isOtherMonth = item.type !== "current";

            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() => selectDate(item.date)}
                className={`relative w-full aspect-square flex items-center justify-center rounded-xl text-xs font-semibold transition-all duration-200 ${
                  sel
                    ? isDark
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105"
                      : "bg-[#21569A] text-white shadow-md shadow-blue-500/30 scale-105"
                    : disabled
                      ? isDark ? "text-zinc-700 cursor-not-allowed" : "text-slate-200 cursor-not-allowed"
                      : isOtherMonth
                        ? isDark ? "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-700/40" : "text-slate-300 hover:text-slate-500 hover:bg-slate-50"
                        : isDark
                          ? "text-zinc-300 hover:bg-zinc-700/60 hover:text-white"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
                style={{
                  animation: isOpen ? `dropdownItemIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) ${(Math.floor(idx / 7)) * 30}ms both` : "none"
                }}
              >
                {item.day}
                {/* Today indicator dot */}
                {todayMark && !sel && (
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isDark ? "bg-indigo-400" : "bg-blue-500"}`}></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Picks */}
        <div className={`flex gap-2 px-3 pb-3 pt-1 border-t ${isDark ? "border-zinc-700/50" : "border-slate-100"}`}>
          {quickPicks.map((qp) => {
            const qpStr = `${qp.date.getFullYear()}-${String(qp.date.getMonth() + 1).padStart(2, "0")}-${String(qp.date.getDate()).padStart(2, "0")}`;
            const isActive = value === qpStr;
            return (
              <button
                key={qp.label}
                type="button"
                onClick={() => { onChange(qpStr); setIsOpen(false); }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                  isActive
                    ? isDark
                      ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                      : "bg-blue-50 border-blue-200 text-blue-700"
                    : isDark
                      ? "border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40 hover:border-zinc-600"
                      : "border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {qp.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DatePicker;
