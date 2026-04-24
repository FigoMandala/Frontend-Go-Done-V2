function LoadingSpinner() {
  const isDark =
    typeof window !== "undefined" &&
    (localStorage.getItem("dashboardTheme") || "light") === "dark";

  const googleColors = ["#4285F4", "#DB4437", "#F4B400", "#0F9D58"];

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-6 ${
        isDark ? "bg-[#030712]" : "bg-[#f8fafc]"
      }`}
    >
      <div
        className={`w-full max-w-sm rounded-3xl border px-8 py-9 text-center backdrop-blur-xl ${
          isDark
            ? "bg-zinc-900/70 border-zinc-800 text-zinc-100"
            : "bg-white/90 border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex items-center justify-center gap-2.5" aria-label="loading">
          {googleColors.map((color, index) => (
            <span
              key={color}
              className="google-dot w-4 h-4 rounded-full"
              style={{
                backgroundColor: color,
                animationDelay: `${index * 0.12}s`,
              }}
            ></span>
          ))}
        </div>

        <p className={`mt-5 text-sm font-bold tracking-[0.22em] uppercase ${isDark ? "text-zinc-200" : "text-slate-700"}`}>
          Loading
        </p>
        <p className={`mt-2 text-xs ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
          Preparing your workspace...
        </p>
      </div>

      <style>{`
        @keyframes googleDotBounce {
          0%,
          80%,
          100% {
            transform: translateY(0) scale(0.9);
            opacity: 0.55;
          }

          40% {
            transform: translateY(-10px) scale(1.05);
            opacity: 1;
          }
        }

        .google-dot {
          animation: googleDotBounce 1.2s ease-in-out infinite;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.15);
        }
      `}</style>
    </div>
  );
}

export default LoadingSpinner;