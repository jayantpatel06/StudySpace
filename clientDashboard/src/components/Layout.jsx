import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useLibraryStore } from "../store/libraryStore";
import { useState, useEffect } from "react";

const navItems = [
  {
    path: "/",
    label: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    emoji: "🏠",
  },
  {
    path: "/students",
    label: "Students",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    emoji: "👥",
  },
  {
    path: "/seats",
    label: "Seat Management",
    icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
    emoji: "💺",
  },
  {
    path: "/analytics",
    label: "Analytics",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    emoji: "📊",
  },
  {
    path: "/settings?tab=library",
    label: "Settings",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    emoji: "⚙️",
  },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { library, client, logout } = useAuthStore();
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const { stats, fetchStats } = useLibraryStore();
  const [hoveredItem, setHoveredItem] = useState(null);

  // Initialize theme on mount
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Fetch stats when library is available
  useEffect(() => {
    if (library?.id) {
      fetchStats(library.id);
    }
  }, [library?.id, fetchStats]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark'
      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
      : 'bg-gradient-to-br from-[#7AA2E3] via-[#B4C6E7] to-[#D4A5D9]'}`}>
      {/* Concentric circle decorations like in the reference image */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large circle on right side */}
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/10" />
        <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/10" />
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/10" />
        <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-white/10" />
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-white/10" />

        {/* Smaller circle on left side */}
        <div className="absolute -left-20 top-1/3 w-[300px] h-[300px] rounded-full border border-white/8" />
        <div className="absolute -left-12 top-1/3 w-[200px] h-[200px] rounded-full border border-white/8" />
        <div className="absolute -left-4 top-1/3 w-[100px] h-[100px] rounded-full border border-white/8" />

        {/* Soft gradient orbs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-[#D4A5D9]/20 rounded-full blur-3xl" />
      </div>

      {/* Sidebar - Fixed position with glassmorphism */}
      <aside className="fixed left-0 top-0 w-72 h-screen glass text-slate-700 flex flex-col overflow-y-auto z-50 border-r border-white/30">
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li
                key={item.path}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Link
                  to={item.path}
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ripple ${
                    location.pathname === item.path || 
                    (item.path !== "/" && location.pathname.startsWith(item.path.split('?')[0]))
                    ? "nav-item-active text-slate-800"
                    : "text-slate-600 hover:text-slate-800 nav-item-hover"
                    }`}
                >
                  {/* Hover glow background */}
                  {hoveredItem === item.path && location.pathname !== item.path && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent rounded-2xl" />
                  )}

                  {/* Icon container */}
                  <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    location.pathname === item.path || 
                    (item.path !== "/" && location.pathname.startsWith(item.path.split('?')[0]))
                    ? "bg-white/40"
                    : "bg-white/20 group-hover:bg-white/40"
                    }`}>
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ${hoveredItem === item.path ? "scale-110" : ""
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={item.icon}
                      />
                    </svg>
                  </div>

                  <span className="text-sm font-medium relative z-10">{item.label}</span>

                  {/* Active indicator */}
                  {(location.pathname === item.path || 
                    (item.path !== "/" && location.pathname.startsWith(item.path.split('?')[0]))) && (
                    <div className="absolute right-2 w-2 h-2 bg-[#5B8BD9] rounded-full shadow-lg shadow-[#5B8BD9]/50" />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Quick Stats Card */}
          <div className="mt-4 p-4 rounded-2xl bg-white/20 border border-white/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-600 uppercase tracking-wider">Quick Stats</span>
              <span className="text-lg">📈</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500">Subscribed Students</span>
                  <span className="text-sm font-semibold text-slate-800">{stats?.subscribedStudents || 0}</span>
                </div>
                <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full shimmer" 
                    style={{ width: `${Math.min((stats?.subscribedStudents || 0) * 10, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500">Occupancy Rate</span>
                  <span className="text-sm font-semibold text-slate-800">{stats?.occupancyRate || 0}%</span>
                </div>
                <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#5B8BD9] to-[#8B7FCF] rounded-full shimmer" 
                    style={{ width: `${stats?.occupancyRate || 0}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-white/20">
                <span className="text-xs text-slate-500">Checked In</span>
                <span className="text-sm font-semibold text-green-600">{stats?.checkedInUsers || 0}</span>
              </div>
            </div>
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/20">
          <div
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/20 mb-3 card-hover cursor-pointer"
            onClick={() => navigate('/settings?tab=account')}
            title="Click to view Account Settings"
          >
            {/* Avatar with gradient border */}
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#5B8BD9] to-[#8B7FCF] p-0.5">
                <div className="w-full h-full rounded-xl bg-white/90 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#5B8BD9]">
                    {client?.name?.[0] || "U"}
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-800">{client?.name || "User"}</p>
              <p className="text-xs text-slate-500 truncate">
                {client?.username || "user@email.com"}
              </p>
            </div>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 rounded-xl text-sm font-medium transition-all duration-300 text-red-600 hover:text-red-700 ripple group"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </aside >

      {/* Main Content - Offset by sidebar width */}
      <main className="ml-72 min-h-screen relative z-10 overflow-y-auto">
        <Outlet />
      </main>
    </div >
  );
}
