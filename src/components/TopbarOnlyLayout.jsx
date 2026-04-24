import { useEffect, useState } from 'react';
import Topbar from './Topbar';

function TopbarOnlyLayout({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('dashboardTheme') || 'light');
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleThemeChange = (event) => {
      if (event.detail === 'light' || event.detail === 'dark') {
        setTheme(event.detail);
      }
    };

    window.addEventListener('dashboardThemeChange', handleThemeChange);
    return () => window.removeEventListener('dashboardThemeChange', handleThemeChange);
  }, []);

  return (
    <div className={`flex flex-col min-h-screen overflow-hidden transition-colors duration-500 ${
      isDark ? 'bg-[#030712] text-zinc-200' : 'bg-gradient-to-br from-[#eff6ff] via-[#f8fafc] to-[#e0f2fe] text-slate-800'
    }`}>
      <div className={`absolute top-[-18%] left-[-10%] w-[42%] h-[42%] rounded-full blur-[150px] pointer-events-none animate-pan ${
        isDark ? 'bg-indigo-900/20 mix-blend-screen' : 'bg-blue-300/30'
      }`}></div>
      <div className={`absolute bottom-[-14%] right-[-10%] w-[36%] h-[36%] rounded-full blur-[150px] pointer-events-none animate-pan ${
        isDark ? 'bg-rose-900/10 mix-blend-screen' : 'bg-cyan-300/30'
      }`} style={{ animationDirection: 'reverse' }}></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Topbar theme={theme} />

        <main className="flex-1 overflow-y-auto px-5 pb-8 pt-2 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default TopbarOnlyLayout;
