// src/components/CustomDropdown.jsx
import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiTrash2, FiEdit2, FiPlus } from "react-icons/fi";

const CustomDropdown = ({
  label,
  options,
  selected,
  onSelect,
  allowCustom = false,
  onAddCustom,
  onEditCategory,
  onDeleteCategory,
  placeholder,
  isDark = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Reset highlight when opening
  useEffect(() => {
    if (isOpen) {
      const idx = options?.findIndex(o => String(o.value) === String(selected)) ?? -1;
      setHighlightedIndex(idx);
    }
  }, [isOpen, options, selected]);

  const handleAddCustom = () => {
    const value = customInput.trim();
    if (!value) return;
    onAddCustom?.(value);
    setCustomInput("");
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, (options?.length ?? 1) - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0 && options?.[highlightedIndex]) {
      e.preventDefault();
      onSelect?.(options[highlightedIndex].value);
      setIsOpen(false);
    }
  };

  const labelClass = isDark ? "text-zinc-300 font-semibold text-sm" : "text-slate-700 font-semibold text-sm";
  const selectedLabel = options?.find((o) => String(o.value) === String(selected))?.label;

  // Priority dot colors
  const getPriorityDot = (label) => {
    const l = (label || "").toLowerCase();
    if (l === "high") return "bg-rose-500";
    if (l === "medium") return "bg-amber-500";
    if (l === "low") return "bg-emerald-500";
    return null;
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {label && <label className={`block mb-2 ${labelClass}`}>{label}</label>}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((s) => !s)}
        onKeyDown={handleKeyDown}
        className={`w-full flex justify-between items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 border outline-none ${
          isDark
            ? `bg-zinc-800 text-zinc-100 ${isOpen ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/5" : "border-zinc-700 hover:border-zinc-600"}`
            : `bg-slate-50/80 text-slate-900 ${isOpen ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/5" : "border-slate-200 hover:border-slate-300"}`
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          {selectedLabel && getPriorityDot(selectedLabel) && (
            <span className={`w-2.5 h-2.5 rounded-full ${getPriorityDot(selectedLabel)} ring-2 ${
              getPriorityDot(selectedLabel) === "bg-rose-500" ? "ring-rose-500/20" :
              getPriorityDot(selectedLabel) === "bg-amber-500" ? "ring-amber-500/20" : "ring-emerald-500/20"
            }`}></span>
          )}
          <span className={selected ? "" : (isDark ? "text-zinc-500" : "text-slate-400")}>
            {selectedLabel || placeholder || `Choose ${label || "an option"}...`}
          </span>
        </span>
        <FiChevronDown
          className={`w-4 h-4 transition-all duration-300 ${isDark ? "text-zinc-500" : "text-slate-400"} ${isOpen ? "rotate-180 scale-90" : ""}`}
        />
      </button>

      {/* Dropdown Panel */}
      <div
        className={`absolute z-30 w-full mt-1.5 rounded-2xl overflow-hidden border transition-all duration-300 origin-top ${
          isDark
            ? "bg-zinc-800/95 backdrop-blur-xl border-zinc-700 shadow-2xl shadow-black/40"
            : "bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl shadow-slate-300/30"
        } ${isOpen ? "opacity-100 scale-y-100 translate-y-0" : "opacity-0 scale-y-[0.97] -translate-y-1 pointer-events-none"}`}
        role="listbox"
      >
        <ul ref={listRef} className="py-1.5 overflow-y-auto max-h-60 custom-scrollbar">
          {options?.length ? (
            options.map((option, idx) => {
              const isSelected = String(selected) === String(option.value);
              const isHighlighted = highlightedIndex === idx;
              const dot = getPriorityDot(option.label);

              return (
                <li
                  key={option.value}
                  className={`px-3.5 py-2.5 mx-1.5 rounded-xl flex items-center justify-between cursor-pointer group transition-all duration-200 ${
                    isSelected
                      ? isDark ? "bg-indigo-500/15 text-indigo-300" : "bg-blue-50 text-blue-700"
                      : isHighlighted
                        ? isDark ? "bg-zinc-700/60 text-zinc-100" : "bg-slate-50 text-slate-900"
                        : isDark ? "text-zinc-300 hover:bg-zinc-700/40" : "text-slate-700 hover:bg-slate-50"
                  }`}
                  style={{
                    animationDelay: `${idx * 25}ms`,
                    animation: isOpen ? `dropdownItemIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 25}ms both` : "none"
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => {
                    onSelect?.(option.value);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2.5 font-medium text-sm">
                    {dot && (
                      <span className={`w-2 h-2 rounded-full transition-transform duration-200 ${dot} ${isSelected ? "scale-125" : "group-hover:scale-110"}`}></span>
                    )}
                    <span>{option.label}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Category edit/delete icons */}
                    {onEditCategory && (
                      <button
                        type="button"
                        className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${isDark ? "hover:bg-zinc-600 text-zinc-500 hover:text-zinc-200" : "hover:bg-slate-200 text-slate-400 hover:text-slate-700"}`}
                        onClick={(e) => { e.stopPropagation(); onEditCategory(option.value); }}
                        title="Edit"
                      >
                        <FiEdit2 className="w-3 h-3" />
                      </button>
                    )}
                    {onDeleteCategory && (
                      <button
                        type="button"
                        className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${isDark ? "hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400" : "hover:bg-rose-50 text-slate-400 hover:text-rose-500"}`}
                        onClick={(e) => { e.stopPropagation(); onDeleteCategory(option.value); }}
                        title="Delete"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </button>
                    )}
                    {/* Checkmark */}
                    {isSelected && (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ml-1 transition-transform duration-300 ${isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-blue-100 text-blue-600"}`}>
                        <FiCheck className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </li>
              );
            })
          ) : (
            <li className={`px-4 py-4 text-sm text-center ${isDark ? "text-zinc-500" : "text-slate-400"}`}>No options available</li>
          )}
        </ul>

        {/* Add Custom Category */}
        {allowCustom && (
          <div className={`px-3.5 py-3 border-t transition-colors ${isDark ? "border-zinc-700/50 bg-zinc-800/30" : "border-slate-100 bg-slate-50/50"}`}
               style={{ animation: isOpen ? "dropdownItemIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" : "none" }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); handleAddCustom(); }
                }}
                placeholder="New category..."
                className={`flex-1 px-3 py-2 border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                  isDark
                    ? "bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                    : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isDark
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-500/20"
                    : "bg-[#21569A] hover:bg-[#1a4580] text-white hover:shadow-lg hover:shadow-blue-500/20"
                }`}
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomDropdown;
