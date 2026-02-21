import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MetricsCard from '../components/MetricsCard';
import AccuracyCurve from '../components/charts/AccuracyCurve';
import ClientComparison from '../components/charts/ClientComparison';
import TrainingHistoryTable from '../components/charts/TrainingHistoryTable';
import { adminMetrics, clients } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Detect sidebar width for main content offset
  useEffect(() => {
    const checkSidebar = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        const w = sidebar.getBoundingClientRect().width;
        setSidebarCollapsed(w < 100);
      }
    };
    const observer = new MutationObserver(checkSidebar);
    const sidebar = document.querySelector('aside');
    if (sidebar) observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    checkSidebar();
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen dark:bg-slate-950 bg-slate-50 transition-colors duration-300">
      <Sidebar />

      {/* Main content */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } p-4 sm:p-6 lg:p-8`}
      >
        {/* Header */}
        <div className={`mb-8 transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="ml-12 lg:ml-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-white text-slate-900">
                Analytics Dashboard
              </h1>
              <p className="mt-1 text-sm dark:text-slate-400 text-slate-500">
                Welcome back, <span className="text-violet-400 font-medium">{user?.name}</span> — here's your federated overview.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="dark:text-emerald-400 text-emerald-600 font-medium">All Systems Online</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs dark:text-slate-400 text-slate-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Last updated: just now
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {adminMetrics.map((metric, i) => (
            <div key={metric.id} style={{ animationDelay: `${i * 100}ms` }} className="animate-scale-in">
              <MetricsCard metric={metric} />
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className={`grid lg:grid-cols-2 gap-4 sm:gap-6 mb-8 transition-all duration-900 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <AccuracyCurve />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <ClientComparison />
          </div>
        </div>

        {/* Clients status strip */}
        <div className={`grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8 transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {clients.map((client, i) => (
            <div
              key={client.id}
              className="rounded-2xl glass p-5 flex items-center gap-4 group hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${600 + i * 100}ms` }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg flex-shrink-0"
                style={{ backgroundColor: client.color }}
              >
                {client.shortName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm dark:text-white text-slate-900 truncate">{client.shortName}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs dark:text-slate-400 text-slate-500">{client.dataPoints.toLocaleString()} records</span>
                  <span className="text-xs text-emerald-400">{client.localAccuracy}%</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${client.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-xs dark:text-slate-500 text-slate-400">{client.lastActive}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Training History Table */}
        <div className={`transition-all duration-1100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="animate-fade-in" style={{ animationDelay: '900ms' }}>
            <TrainingHistoryTable />
          </div>
        </div>
      </main>
    </div>
  );
}
