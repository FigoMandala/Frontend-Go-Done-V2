import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

function MainLayout({ children }) {
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
    <div className={`flex flex-col h-screen max-h-screen selection:bg-indigo-500/30 overflow-hidden font-sans transition-colors duration-500 ${
      isDark ? 'bg-[#030712] text-zinc-200' : 'bg-gradient-to-br from-[#f5f7fa] via-[#f9fafb] to-[#f0f4f8] text-slate-800'
    }`}>
      {/* Dynamic Animated Ornaments */}
      <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] pointer-events-none animate-pan ${
        isDark ? 'bg-indigo-900/20 mix-blend-screen' : 'bg-indigo-200/20'
      }`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[150px] pointer-events-none animate-pan ${
        isDark ? 'bg-rose-900/10 mix-blend-screen' : 'bg-slate-300/20'
      }`} style={{ animationDirection: 'reverse' }}></div>

      <div className="relative z-10 flex flex-col h-full min-h-0">
        <Topbar theme={theme} />
        
        <div className="flex flex-1 min-h-0 gap-5 p-5 pt-2">
          {/* Sidebar - Left Side */}
          <div className="w-56 flex-shrink-0 min-h-0">
            <Sidebar />
          </div>
          
          {/* Main Content - Right Side */}
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
