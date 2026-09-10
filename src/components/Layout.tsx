import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Shield, Home, LogOut, Award, Sparkles } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isDashboard = location.pathname === '/trust-dashboard';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Header (Visible only on small screens) */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">TrustNet</h1>
            <span className="text-[10px] text-slate-500 font-medium">Academic Prototype</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            to="/"
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              isHome ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Home Feed"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Feed</span>
          </Link>
          <Link
            to="/trust-dashboard"
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              isDashboard ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Trust Dashboard"
          >
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 mx-0.5" />
          <button
            onClick={logout}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sidebar (Desktop only) */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col min-h-screen shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">TrustNet</h1>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Academic Prototype</p>
            </div>
          </div>
          <div className="mt-4 px-3 py-2 bg-blue-50/80 rounded-xl border border-blue-100/80 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[11px] font-medium text-blue-700 leading-snug">
              Trust-Aware Recommendation Engine
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <Link
            to="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
              isHome
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home Feed</span>
          </Link>
          <Link
            to="/trust-dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
              isDashboard
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Award className="w-5 h-5" />
            <span>Trust Dashboard</span>
          </Link>
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 mb-2 rounded-xl bg-white border border-slate-200/60 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-800 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate">@{user?.username}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-all text-xs font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen bg-slate-50/80">
        <Outlet />
      </main>
    </div>
  );
}
