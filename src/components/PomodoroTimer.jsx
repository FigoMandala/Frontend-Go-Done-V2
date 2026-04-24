import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiBell,
  FiBellOff,
  FiClock,
  FiCoffee,
  FiPause,
  FiPlay,
  FiRotateCcw,
  FiSkipForward,
  FiVolume2,
  FiVolumeX,
  FiZap,
} from "react-icons/fi";

const STORAGE_KEY = "godone-pomodoro-settings-v1";

const DEFAULT_DURATIONS = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const MODE_META = {
  focus: {
    label: "Focus",
    helper: "Deep work block",
    accent: "#2563eb",
    softLight: "bg-blue-50 border-blue-200 text-blue-700",
    softDark: "bg-blue-500/10 border-blue-500/20 text-blue-300",
  },
  shortBreak: {
    label: "Short Break",
    helper: "Recharge quickly",
    accent: "#10b981",
    softLight: "bg-emerald-50 border-emerald-200 text-emerald-700",
    softDark: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
  },
  longBreak: {
    label: "Long Break",
    helper: "Reset your energy",
    accent: "#f59e0b",
    softLight: "bg-amber-50 border-amber-200 text-amber-700",
    softDark: "bg-amber-500/10 border-amber-500/20 text-amber-300",
  },
};

const TIPS = [
  "Matikan notifikasi chat saat sesi fokus berjalan.",
  "Sebelum start, tulis target kecil yang mau selesai di sesi ini.",
  "Simpan hp di luar jangkauan agar tidak terdistraksi.",
  "Pakai jeda 5 menit untuk berdiri, minum, atau tarik napas.",
  "Setiap 4 sesi fokus, ambil long break agar stamina stabil.",
];

const clampDuration = (seconds) => Math.min(90 * 60, Math.max(60, seconds));

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const readInitialState = () => {
  const defaults = {
    mode: "focus",
    durations: DEFAULT_DURATIONS,
    timeLeft: DEFAULT_DURATIONS.focus,
    completedPomodoros: 0,
    cycleFocusCount: 0,
    autoStartNext: false,
    soundEnabled: true,
    history: [],
  };

  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw);
    const durations = {
      focus: clampDuration(Number(parsed?.durations?.focus) || DEFAULT_DURATIONS.focus),
      shortBreak: clampDuration(Number(parsed?.durations?.shortBreak) || DEFAULT_DURATIONS.shortBreak),
      longBreak: clampDuration(Number(parsed?.durations?.longBreak) || DEFAULT_DURATIONS.longBreak),
    };

    const mode = Object.keys(MODE_META).includes(parsed?.mode) ? parsed.mode : "focus";
    const initialLeft = Number(parsed?.timeLeft);
    const timeLeft = Number.isFinite(initialLeft)
      ? Math.min(durations[mode], Math.max(1, initialLeft))
      : durations[mode];

    const completedPomodoros = Number(parsed?.completedPomodoros) || 0;
    const cycleFocusCount = Number(parsed?.cycleFocusCount) || 0;
    const autoStartNext = Boolean(parsed?.autoStartNext);
    const soundEnabled = parsed?.soundEnabled !== false;

    const history = Array.isArray(parsed?.history)
      ? parsed.history
          .filter((item) => item && typeof item.mode === "string" && typeof item.at === "string")
          .slice(0, 8)
      : [];

    return {
      mode,
      durations,
      timeLeft,
      completedPomodoros,
      cycleFocusCount,
      autoStartNext,
      soundEnabled,
      history,
    };
  } catch {
    return defaults;
  }
};

function PomodoroTimer() {
  const initial = useMemo(() => readInitialState(), []);

  const [theme, setTheme] = useState(localStorage.getItem("dashboardTheme") || "light");
  const [mode, setMode] = useState(initial.mode);
  const [durations, setDurations] = useState(initial.durations);
  const [timeLeft, setTimeLeft] = useState(initial.timeLeft);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(initial.completedPomodoros);
  const [cycleFocusCount, setCycleFocusCount] = useState(initial.cycleFocusCount);
  const [autoStartNext, setAutoStartNext] = useState(initial.autoStartNext);
  const [soundEnabled, setSoundEnabled] = useState(initial.soundEnabled);
  const [history, setHistory] = useState(initial.history);
  const [tipIndex, setTipIndex] = useState(0);

  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window === "undefined") return "unsupported";
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  const endAtRef = useRef(null);
  const isDark = theme === "dark";

  const currentModeMeta = MODE_META[mode];
  const totalSeconds = durations[mode];
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - timeLeft) / totalSeconds) * 100));

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
    const timerId = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 8000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mode,
        durations,
        timeLeft,
        completedPomodoros,
        cycleFocusCount,
        autoStartNext,
        soundEnabled,
        history,
      })
    );
  }, [mode, durations, timeLeft, completedPomodoros, cycleFocusCount, autoStartNext, soundEnabled, history]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${formatTime(timeLeft)} | ${currentModeMeta.label} | GoDone`;

    return () => {
      document.title = previousTitle;
    };
  }, [timeLeft, currentModeMeta.label]);

  const playCompletionSound = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") {
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      oscillator.frequency.linearRampToValueAtTime(660, context.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.001, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.26);

      setTimeout(() => {
        context.close();
      }, 350);
    } catch {
      // Ignore audio errors to keep timer stable.
    }
  }, [soundEnabled]);

  const sendBrowserNotification = useCallback(
    (title, body) => {
      if (notificationPermission !== "granted" || typeof window === "undefined") {
        return;
      }

      try {
        const notification = new Notification(title, {
          body,
          icon: "/favicon.ico",
          tag: "godone-pomodoro",
        });

        setTimeout(() => {
          notification.close();
        }, 5000);
      } catch {
        // Ignore notification errors in unsupported browsers.
      }
    },
    [notificationPermission]
  );

  const moveToMode = useCallback(
    (nextMode, shouldAutoRun) => {
      const nextTime = durations[nextMode];
      setMode(nextMode);
      setTimeLeft(nextTime);
      setIsRunning(shouldAutoRun);
      endAtRef.current = shouldAutoRun ? Date.now() + nextTime * 1000 : null;
    },
    [durations]
  );

  const completeSession = useCallback(
    (countAsComplete) => {
      const finishedMode = mode;

      setHistory((prev) => [{ mode: finishedMode, at: new Date().toISOString(), counted: countAsComplete }, ...prev].slice(0, 8));

      if (countAsComplete) {
        playCompletionSound();
      }

      if (finishedMode === "focus") {
        const nextCycleCount = countAsComplete ? cycleFocusCount + 1 : cycleFocusCount;
        const useLongBreak = countAsComplete && nextCycleCount >= 4;

        if (countAsComplete) {
          setCompletedPomodoros((prev) => prev + 1);
          setCycleFocusCount(useLongBreak ? 0 : nextCycleCount);
          sendBrowserNotification(
            "Sesi fokus selesai",
            useLongBreak ? "Kerja bagus. Saatnya long break." : "Saatnya short break dulu."
          );
        }

        moveToMode(useLongBreak ? "longBreak" : "shortBreak", autoStartNext);
        return;
      }

      if (countAsComplete) {
        sendBrowserNotification("Break selesai", "Yuk kembali ke sesi fokus berikutnya.");
      }

      moveToMode("focus", autoStartNext);
    },
    [mode, cycleFocusCount, autoStartNext, moveToMode, playCompletionSound, sendBrowserNotification]
  );

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = setInterval(() => {
      if (!endAtRef.current) return;

      const remainingMs = endAtRef.current - Date.now();
      if (remainingMs <= 0) {
        setTimeLeft(0);
        setIsRunning(false);
        endAtRef.current = null;
        completeSession(true);
        return;
      }

      setTimeLeft(Math.ceil(remainingMs / 1000));
    }, 200);

    return () => clearInterval(intervalId);
  }, [isRunning, completeSession]);

  const handleStartPause = useCallback(() => {
    if (!isRunning) {
      endAtRef.current = Date.now() + timeLeft * 1000;
      setIsRunning(true);
      return;
    }

    if (endAtRef.current) {
      const remaining = Math.max(1, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
    }

    endAtRef.current = null;
    setIsRunning(false);
  }, [isRunning, timeLeft]);

  const handleReset = useCallback(() => {
    endAtRef.current = null;
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  }, [durations, mode]);

  const handleSkip = useCallback(() => {
    endAtRef.current = null;
    setIsRunning(false);
    completeSession(false);
  }, [completeSession]);

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return;
    endAtRef.current = null;
    setIsRunning(false);
    setMode(nextMode);
    setTimeLeft(durations[nextMode]);
  };

  const adjustDuration = (targetMode, deltaMinutes) => {
    setDurations((prev) => {
      const nextValue = clampDuration(prev[targetMode] + deltaMinutes * 60);
      const nextDurations = { ...prev, [targetMode]: nextValue };

      if (!isRunning && mode === targetMode) {
        setTimeLeft(nextValue);
      }

      return nextDurations;
    });
  };

  const requestNotificationAccess = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      sendBrowserNotification("Pomodoro siap", "Notifikasi browser sudah aktif.");
    }
  };

  const sendTestNotification = () => {
    sendBrowserNotification("Tes notifikasi", `Mode aktif: ${currentModeMeta.label} (${formatTime(timeLeft)})`);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        handleStartPause();
        return;
      }

      if (event.key.toLowerCase() === "r") {
        handleReset();
        return;
      }

      if (event.key.toLowerCase() === "n") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleStartPause, handleReset, handleSkip]);

  const panelClass = isDark
    ? "bg-zinc-900/40 border-zinc-800/80 shadow-md shadow-black/10"
    : "bg-white/90 border-slate-200/60 shadow-sm shadow-slate-200/50";

  const headingClass = isDark ? "text-zinc-50" : "text-slate-900";
  const subtleClass = isDark ? "text-zinc-400" : "text-slate-500";

  const statusLabel = isRunning ? "Running" : "Paused";
  const notificationReady = notificationPermission === "granted";

  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="min-h-full pb-10">
      <div className="max-w-[1300px] mx-auto space-y-6 animate-slide-up">
        <div className={`rounded-3xl border p-5 md:p-7 backdrop-blur-xl relative overflow-hidden ${panelClass}`}>
          <div className={`absolute -top-32 -right-16 w-80 h-80 rounded-full blur-[80px] pointer-events-none ${isDark ? "bg-blue-500/20" : "bg-blue-400/15"}`}></div>
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={`text-[11px] tracking-widest uppercase font-bold ${isDark ? "text-blue-300" : "text-[#21569A]"}`}>
                Deep Focus
              </p>
              <h1 className={`text-2xl md:text-3xl font-extrabold mt-1 tracking-tight ${headingClass}`}>Pomodoro Timer</h1>
              <p className={`mt-1 text-sm ${subtleClass}`}>Mode pintar dengan auto cycle, browser notification, suara, dan shortcut keyboard.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${isDark ? "border-zinc-700 text-zinc-300" : "border-slate-200 text-slate-600"}`}>
                Completed: {completedPomodoros}
              </span>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${isDark ? "border-zinc-700 text-zinc-300" : "border-slate-200 text-slate-600"}`}>
                Cycle: {cycleFocusCount}/4
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <section className={`xl:col-span-8 rounded-3xl border p-5 md:p-7 backdrop-blur-xl ${panelClass}`}>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {Object.keys(MODE_META).map((key) => {
                const active = key === mode;
                const chipClass = isDark ? MODE_META[key].softDark : MODE_META[key].softLight;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleModeChange(key)}
                    className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                      active
                        ? `${chipClass} scale-[1.02]`
                        : isDark
                          ? "border-zinc-700 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    {MODE_META[key].label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-5">
              <div className="relative w-[260px] h-[260px] sm:w-[300px] sm:h-[300px]">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
                    <circle
                      cx="130"
                      cy="130"
                      r={radius}
                      strokeWidth="14"
                      fill="none"
                      className={isDark ? "stroke-zinc-800" : "stroke-slate-200"}
                    />
                    <circle
                      cx="130"
                      cy="130"
                      r={radius}
                      strokeWidth="14"
                      fill="none"
                      stroke={currentModeMeta.accent}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={progressOffset}
                      style={{ transition: "stroke-dashoffset 0.45s ease" }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className={`text-xs uppercase tracking-[0.2em] font-bold ${subtleClass}`}>{currentModeMeta.label}</span>
                    <span className={`text-5xl font-black tabular-nums mt-2 ${headingClass}`}>{formatTime(timeLeft)}</span>
                    <span className={`text-sm mt-2 ${isRunning ? "text-emerald-500" : subtleClass}`}>{statusLabel}</span>
                    <span className={`text-xs mt-1 ${subtleClass}`}>{currentModeMeta.helper}</span>
                  </div>
              </div>

              <div className="w-full max-w-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleStartPause}
                    className={`col-span-1 px-3 py-3 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      isRunning
                        ? isDark
                          ? "bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700"
                          : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                        : "bg-[#21569A] border-[#21569A] text-white hover:bg-[#1a4580]"
                    }`}
                  >
                    {isRunning ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
                    {isRunning ? "Pause" : "Start"}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className={`col-span-1 px-3 py-3 rounded-xl border font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                      isDark
                        ? "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <FiRotateCcw className="w-4 h-4" /> Reset
                  </button>

                  <button
                    type="button"
                    onClick={handleSkip}
                    className={`col-span-1 px-3 py-3 rounded-xl border font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                      isDark
                        ? "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <FiSkipForward className="w-4 h-4" /> Skip
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className={`rounded-2xl border p-4 ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-slate-50/70 border-slate-200"}`}>
                    <p className={`text-xs uppercase tracking-widest font-bold mb-2 ${subtleClass}`}>Current insight</p>
                    <p className={`text-sm font-medium leading-relaxed ${headingClass}`}>{TIPS[tipIndex]}</p>
                  </div>

                  <div className={`rounded-2xl border p-4 ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-slate-50/70 border-slate-200"}`}>
                    <p className={`text-xs uppercase tracking-widest font-bold mb-3 ${subtleClass}`}>Keyboard shortcut</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2.5 py-1 rounded-lg border ${isDark ? "border-zinc-700 text-zinc-300" : "border-slate-200 text-slate-700"}`}>Space: Start/Pause</span>
                      <span className={`px-2.5 py-1 rounded-lg border ${isDark ? "border-zinc-700 text-zinc-300" : "border-slate-200 text-slate-700"}`}>R: Reset</span>
                      <span className={`px-2.5 py-1 rounded-lg border ${isDark ? "border-zinc-700 text-zinc-300" : "border-slate-200 text-slate-700"}`}>N: Skip</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="xl:col-span-4 space-y-5">
            <div className={`rounded-3xl border p-5 backdrop-blur-xl ${panelClass}`}>
              <h2 className={`text-base font-bold ${headingClass}`}>Durations</h2>
              <p className={`text-xs mt-1 mb-4 ${subtleClass}`}>Atur durasi tiap mode sesuai ritme kerja kamu.</p>

              <div className="space-y-3">
                {Object.keys(MODE_META).map((key) => (
                  <div key={key} className={`rounded-xl border p-3 ${isDark ? "border-zinc-800 bg-zinc-900/40" : "border-slate-200 bg-white/70"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${headingClass}`}>{MODE_META[key].label}</span>
                      <span className={`text-xs ${subtleClass}`}>{Math.floor(durations[key] / 60)} min</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => adjustDuration(key, -1)}
                        className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                      >
                        -1 min
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustDuration(key, 1)}
                        className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                      >
                        +1 min
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-3xl border p-5 backdrop-blur-xl ${panelClass}`}>
              <h2 className={`text-base font-bold ${headingClass}`}>Smart Features</h2>

              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setAutoStartNext((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl border transition-colors ${
                    autoStartNext
                      ? isDark
                        ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                      : isDark
                        ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <FiZap className="w-4 h-4" /> Auto start next session
                  </span>
                  <span className="text-xs font-bold">{autoStartNext ? "ON" : "OFF"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl border transition-colors ${
                    soundEnabled
                      ? isDark
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : isDark
                        ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm font-semibold flex items-center gap-2">
                    {soundEnabled ? <FiVolume2 className="w-4 h-4" /> : <FiVolumeX className="w-4 h-4" />} Sound alert
                  </span>
                  <span className="text-xs font-bold">{soundEnabled ? "ON" : "OFF"}</span>
                </button>

                <div className={`rounded-xl border p-3.5 ${isDark ? "border-zinc-700 bg-zinc-900/50" : "border-slate-200 bg-white/70"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-sm font-semibold flex items-center gap-2 ${headingClass}`}>
                        {notificationReady ? <FiBell className="w-4 h-4" /> : <FiBellOff className="w-4 h-4" />}
                        Browser notification
                      </p>
                      <p className={`text-xs mt-1 ${subtleClass}`}>
                        {notificationPermission === "granted"
                          ? "Aktif dan siap dipakai"
                          : notificationPermission === "denied"
                            ? "Diblokir browser"
                            : notificationPermission === "unsupported"
                              ? "Tidak didukung browser"
                              : "Belum diizinkan"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={requestNotificationAccess}
                        disabled={notificationPermission === "unsupported"}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                          isDark
                            ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                        }`}
                      >
                        Enable
                      </button>
                      <button
                        type="button"
                        onClick={sendTestNotification}
                        disabled={!notificationReady}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                          notificationReady
                            ? "bg-[#21569A] border-[#21569A] text-white hover:bg-[#1a4580]"
                            : isDark
                              ? "border-zinc-700 text-zinc-500"
                              : "border-slate-200 text-slate-400"
                        }`}
                      >
                        Test
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl border p-5 backdrop-blur-xl ${panelClass}`}>
              <h2 className={`text-base font-bold ${headingClass}`}>Recent Sessions</h2>
              <div className="mt-3 space-y-2">
                {history.length === 0 ? (
                  <p className={`text-sm ${subtleClass}`}>Belum ada riwayat sesi. Mulai satu sesi fokus dulu.</p>
                ) : (
                  history.map((item, index) => (
                    <div
                      key={`${item.at}-${index}`}
                      className={`rounded-xl border px-3 py-2.5 flex items-center justify-between ${isDark ? "border-zinc-800 bg-zinc-900/40" : "border-slate-200 bg-white/70"}`}
                    >
                      <div className="flex items-center gap-2">
                        {item.mode === "focus" ? (
                          <FiZap className={`w-4 h-4 ${isDark ? "text-blue-300" : "text-blue-600"}`} />
                        ) : (
                          <FiCoffee className={`w-4 h-4 ${isDark ? "text-emerald-300" : "text-emerald-600"}`} />
                        )}
                        <span className={`text-sm font-semibold ${headingClass}`}>{MODE_META[item.mode]?.label || "Session"}</span>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs ${subtleClass}`}>{new Date(item.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        <p className={`text-[11px] ${item.counted ? (isDark ? "text-emerald-300" : "text-emerald-600") : subtleClass}`}>
                          {item.counted ? "Completed" : "Skipped"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${isDark ? "border-zinc-800 bg-zinc-900/40" : "border-slate-200 bg-white/80"}`}>
          <FiClock className={`w-4 h-4 ${isDark ? "text-zinc-400" : "text-slate-500"}`} />
          <p className={`text-xs md:text-sm ${subtleClass}`}>
            Tip: gunakan mode Focus minimal 3 sesi berturut-turut untuk dapetin momentum kerja yang stabil.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PomodoroTimer;
