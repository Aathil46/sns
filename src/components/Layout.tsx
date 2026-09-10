import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Shield, Home, User, LogOut } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            TrustNet
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors">
            <Home className="w-5 h-5" />
            Home Feed
          </Link>
          <Link to="/trust-dashboard" className="flex items-center gap-3 px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors">
            <Shield className="w-5 h-5" />
            Trust Dashboard
          </Link>
        </nav>
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="text-sm font-medium">{user?.name}</div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
