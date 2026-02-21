import { useEffect, useState } from 'react';
import { fetchFaultTolerance } from '../../api';
import type { FaultToleranceData, FaultClient } from '../../data/securityMockData';
import { FiHeart, FiWifi, FiWifiOff, FiClock, FiActivity } from 'react-icons/fi';

const statusStyles: Record<string, { dot: string; badge: string; label: string }> = {
  healthy:  { dot: 'bg-emerald-500 animate-pulse', badge: 'bg-emerald-500/15 text-emerald-400', label: 'Healthy' },
  degraded: { dot: 'bg-amber-500 animate-pulse',   badge: 'bg-amber-500/15  text-amber-400',   label: 'Degraded' },
  dead:     { dot: 'bg-red-500',                     badge: 'bg-red-500/15    text-red-400',     label: 'Dead' },
};

/**
 * FaultTolerancePanel — shows heartbeat status, participation rate,
 * dead-client exclusion, and latency for each federated client.
 */
export default function FaultTolerancePanel() {
  const [ft, setFt] = useState<FaultToleranceData | null>(null);

  useEffect(() => {
    const load = () => fetchFaultTolerance().then(setFt);
    load();
    // Refresh every 10 s to show live heartbeats
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, []);

  if (!ft) {
    return (
      <div className="rounded-2xl glass p-5 sm:p-6 animate-pulse">
        <div className="h-48 bg-white/5 rounded-xl" />
      </div>
    );
  }

  const clients = Object.entries(ft.clients) as [string, FaultClient][];

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold dark:text-white text-slate-900 flex items-center gap-2">
            <FiHeart className="text-pink-500" /> Fault Tolerance
          </h3>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            Heartbeat interval: {ft.heartbeatIntervalSec}s · Dead threshold: {ft.deadThreshold} missed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ft.deadClients.length === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400 animate-pulse'}`}>
            {ft.healthyCount}/{Object.keys(ft.clients).length} healthy
          </span>
        </div>
      </div>

      {/* Client cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {clients.map(([cid, c]) => {
          const style = statusStyles[c.status] || statusStyles.healthy;
          const lastHb = new Date(c.lastHeartbeat);
          const secsAgo = Math.round((Date.now() - lastHb.getTime()) / 1000);

          return (
            <div
              key={cid}
              className="rounded-xl bg-white/[.03] border border-white/[.05] p-4 hover:bg-white/[.06] transition-all duration-300"
            >
              {/* Name + status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {c.alive ? <FiWifi className="text-emerald-400" size={13} /> : <FiWifiOff className="text-red-400" size={13} />}
                  <span className="text-sm font-semibold dark:text-white text-slate-900">{c.clientName}</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {style.label}
                </span>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <Stat icon={<FiHeart size={11} />} label="Missed heartbeats" value={`${c.missedHeartbeats}/${ft.deadThreshold}`} danger={c.missedHeartbeats > 0} />
                <Stat icon={<FiActivity size={11} />} label="Participation" value={`${c.participationRate}%`} />
                <Stat icon={<FiClock size={11} />} label="Avg latency" value={`${c.avgLatencyMs}ms`} warn={c.avgLatencyMs > 80} />
                <Stat icon={<FiWifi size={11} />} label="Last heartbeat" value={`${secsAgo}s ago`} />
              </div>

              {/* Participation bar */}
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-white/[.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${c.participationRate >= 95 ? 'bg-emerald-500' : c.participationRate >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${c.participationRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] dark:text-slate-500 text-slate-400">{c.consecutiveRounds} consecutive rounds</span>
                  <span className="text-[9px] dark:text-slate-500 text-slate-400">{ft.totalRounds} total</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dead-client exclusion notice */}
      {ft.deadClients.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2">
            <FiWifiOff className="text-red-400" size={14} />
            <span className="text-xs font-medium text-red-400">
              Dead clients excluded from aggregation: {ft.deadClients.join(', ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


function Stat({ icon, label, value, danger, warn }: { icon: React.ReactNode; label: string; value: string; danger?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-[10px] dark:text-slate-400 text-slate-500">
        {icon} {label}
      </div>
      <span className={`text-[11px] font-mono font-medium ${danger ? 'text-red-400' : warn ? 'text-amber-400' : 'dark:text-slate-300 text-slate-600'}`}>
        {value}
      </span>
    </div>
  );
}
