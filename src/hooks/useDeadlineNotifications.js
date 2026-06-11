import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import backend from "../api/backend";

// How often to re-scan tasks while the app is open.
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
// Minimum gap between scans (guards rapid re-mounts on navigation).
const MIN_GAP_MS = 60 * 1000;
const STORAGE_KEY = "godone-deadline-notified";

// Shared across re-mounts so navigating between pages doesn't re-scan constantly.
let lastCheckAt = 0;

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const normalizeDeadline = (raw) => {
  if (!raw) return null;
  return raw.split(" ")[0].split("T")[0]; // -> YYYY-MM-DD
};

const diffDaysFromToday = (deadline) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = deadline.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
};

const readNotified = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const writeNotified = (map) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
};

const isNotifEnabled = () => {
  const saved = localStorage.getItem("notifEnabled");
  return saved === null ? true : JSON.parse(saved);
};

const sendBrowserNotification = (title, body) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const notification = new Notification(title, { body, icon: "/favicon.ico", tag: "godone-deadline" });
    setTimeout(() => notification.close(), 6000);
  } catch {
    /* ignore unsupported browsers */
  }
};

// Notifies the user about pending tasks that are due today/tomorrow or overdue.
// Browser notification (if granted) + in-app toast, deduped once per task per day.
export default function useDeadlineNotifications() {
  const runningRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // Best-effort one-time permission request for browser notifications.
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      try {
        Promise.resolve(Notification.requestPermission()).catch(() => {});
      } catch {
        /* older browsers use a callback signature; ignore */
      }
    }

    const check = async () => {
      if (cancelled || runningRef.current) return;
      if (!localStorage.getItem("token")) return; // only when logged in
      if (!isNotifEnabled()) return;
      if (Date.now() - lastCheckAt < MIN_GAP_MS) return;

      runningRef.current = true;
      lastCheckAt = Date.now();

      try {
        const res = await backend.get("/tasks");
        if (cancelled) return;

        const today = todayKey();
        const notified = readNotified();
        let changed = false;

        // Drop entries from previous days so each task can notify again on a new day.
        for (const key of Object.keys(notified)) {
          if (notified[key] !== today) {
            delete notified[key];
            changed = true;
          }
        }

        const dueSoon = [];
        const overdue = [];

        (res.data || []).forEach((t) => {
          if ((t.status || "").toLowerCase() !== "pending") return;
          const deadline = normalizeDeadline(t.deadline);
          if (!deadline) return;
          const diff = diffDaysFromToday(deadline);
          const id = t.task_id;

          if (diff < 0) {
            const key = `${id}:overdue`;
            if (notified[key] !== today) {
              overdue.push({ ...t, diff });
              notified[key] = today;
              changed = true;
            }
          } else if (diff === 0 || diff === 1) {
            const key = `${id}:due`;
            if (notified[key] !== today) {
              dueSoon.push({ ...t, diff });
              notified[key] = today;
              changed = true;
            }
          }
        });

        // Cap per scan so a big backlog doesn't flood the screen.
        dueSoon.slice(0, 5).forEach((t) => {
          const when = t.diff === 0 ? "hari ini" : "besok";
          const body = `"${t.title}" jatuh tempo ${when}.`;
          toast(`⏰ ${body}`, { duration: 6000 });
          sendBrowserNotification(t.diff === 0 ? "Deadline hari ini" : "Deadline besok", body);
        });

        overdue.slice(0, 5).forEach((t) => {
          const body = `"${t.title}" sudah lewat ${Math.abs(t.diff)} hari.`;
          toast.error(`⚠️ Terlambat: ${body}`, { duration: 7000 });
          sendBrowserNotification("Task terlambat", body);
        });

        if (changed) writeNotified(notified);
      } catch {
        /* network error: skip this round, try again next tick */
      } finally {
        runningRef.current = false;
      }
    };

    const initialTimer = setTimeout(check, 2500);
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    const handleFocus = () => check();
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);
}
