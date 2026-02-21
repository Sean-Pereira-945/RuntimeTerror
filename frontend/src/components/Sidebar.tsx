import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { FiBarChart2, FiLogOut, FiMenu, FiX } from 'react-icons/fi';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full dark:bg-slate-900/95 bg-white/95 backdrop-blur-xl border-b border-white/10 dark:border-white/5">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/30 flex-shrink-0">
              FL
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-sm dark:text-white text-slate-900 leading-tight">FedLearn</div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500/20 to-pink-500/10 dark:text-white text-slate-900 text-sm font-medium shadow-sm shadow-violet-500/10">
              <FiBarChart2 className="w-4 h-4" />
              Dashboard
            </button>
          </nav>
        </div>

        {/* Right: theme + user + logout */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* User pill — desktop */}
          <div className="hidden sm:flex items-center gap-2.5 pl-3 pr-1 py-1 rounded-full glass">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              {user?.avatar}
            </div>
            <span className="text-xs font-medium dark:text-white text-slate-900 max-w-[120px] truncate">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-full hover:bg-red-500/10 text-red-400 transition-colors"
              title="Logout"
            >
              <FiLogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors dark:text-white text-slate-700"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-3 dark:bg-slate-900/95 bg-white/95 backdrop-blur-xl">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500/20 to-pink-500/10 dark:text-white text-slate-900 text-sm font-medium">
            <FiBarChart2 className="w-4 h-4" />
            Dashboard
          </button>
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">
                {user?.avatar}
              </div>
              <div>
                <div className="text-xs font-medium dark:text-white text-slate-900">{user?.name}</div>
                <div className="text-[10px] text-slate-400">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <FiLogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
