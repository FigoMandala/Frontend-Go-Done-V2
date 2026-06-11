import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

function MainLayout({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('dashboardTheme') || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDark = theme === 'dark';

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const handleThemeChange = (event) => {
      if (event.detail === 'light' || event.detail === 'dark') {
        setTheme(event.detail);
      }
    };

    window.addEventListener('dashboardThemeChange', handleThemeChange);
    return () => window.removeEventListener('dashboardThemeChange', handleThemeChange);
  }, []);

  // Close the mobile drawer when the viewport grows to desktop size.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e) => { if (e.matches) setSidebarOpen(false); };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
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
        <Topbar theme={theme} onMenuToggle={() => setSidebarOpen(true)} />

        <div className="flex flex-1 min-h-0 gap-0 lg:gap-5 px-3 pb-3 pt-2 sm:px-5 sm:pb-5 lg:p-5 lg:pt-2">
          {/* Mobile drawer backdrop */}
          <div
            onClick={closeSidebar}
            className={`lg:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Sidebar - drawer on phone/tablet, static column on desktop */}
          <div
            className={`fixed inset-y-0 left-0 z-[70] w-[82%] max-w-xs p-3 transition-transform duration-300 ease-out flex-shrink-0 min-h-0 lg:static lg:z-auto lg:w-56 lg:max-w-none lg:p-0 lg:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar onNavigate={closeSidebar} />
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
