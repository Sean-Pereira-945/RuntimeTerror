import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
  FiBarChart2,
  FiUsers,
  FiCpu,
} from 'react-icons/fi';

interface NavItem {
  label: string;
  icon: ReactNode;
  path?: string;
  active?: boolean;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: <FiBarChart2 className="w-5 h-5" /> },
  { label: 'Clients', icon: <FiUsers className="w-5 h-5" /> },
  { label: 'Models', icon: <FiCpu className="w-5 h-5" /> },
];

const CLIENT_NAV: NavItem[] = [
  { label: 'Dashboard', icon: <FiBarChart2 className="w-5 h-5" /> },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user?.role === 'admin' ? ADMIN_NAV : CLIENT_NAV;
  const activeIdx = 0; // Dashboard is always active in this demo

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl glass text-white hover:bg-white/10 transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40
          flex flex-col
          transition-all duration-300 ease-in-out
          dark:bg-slate-900/95 bg-white/95
          backdrop-blur-xl
          border-r border-white/10 dark:border-white/5
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/30 flex-shrink-0">
            FL
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <div className="font-bold text-sm dark:text-white text-slate-900">FedLearn</div>
              <div className="text-[10px] text-slate-400">DevHacks 2026</div>
            </div>
          )}
          {/* Collapse btn – desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex ml-auto p-1 rounded-lg hover:bg-white/10 transition-colors dark:text-slate-400 text-slate-500"
          >
            <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => (
            <button
              key={item.label}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200 group
                ${idx === activeIdx
                  ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/10 dark:text-white text-slate-900 shadow-md shadow-violet-500/10'
                  : 'hover:bg-white/5 dark:text-slate-400 text-slate-500 hover:dark:text-white hover:text-slate-800'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <span className="text-lg flex-shrink-0 flex items-center justify-center">{item.icon}</span>
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {idx === activeIdx && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        {/* Theme toggle */}
        <div className={`px-4 py-3 border-t border-white/5 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <ThemeToggle />
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs dark:text-slate-500 text-slate-400">Theme</span>
              <ThemeToggle />
            </div>
          )}
        </div>

        {/* User info + logout */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.avatar}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <div className="text-sm font-medium dark:text-white text-slate-900 truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`
              mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl
              text-sm text-red-400 hover:bg-red-500/10 transition-colors
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
