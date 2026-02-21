import { useEffect, useState } from 'react';
import { fetchSecuritySummary } from '../../api';
import type { SecuritySummary, SecurityMetric, KrumData, CosineData, RateLimitData, EcdsaData } from '../../data/securityMockData';
import { FiShield, FiLock, FiActivity, FiZap } from 'react-icons/fi';

const metricIcons: Record<string, typeof FiShield> = {
  shield: FiShield,
  krum: FiActivity,
  heart: FiZap,
  lock: FiLock,
};

/**
 * SecurityPanel — Byzantine defence overview: Krum scores, cosine-sim
 * matrix, ECDSA verification, and rate-limiting visualizations.
 */
export default function SecurityPanel() {
  const [data, setData] = useState<SecuritySummary | null>(null);

  useEffect(() => {
    fetchSecuritySummary().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="rounded-2xl glass p-5 sm:p-6 animate-pulse">
        <div className="h-64 bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {data.overviewMetrics.map((m) => {
          const Icon = metricIcons[m.icon] || FiShield;
          return (
            <div
              key={m.id}
              className="rounded-xl glass p-4 group hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center text-white`}>
                  <Icon size={14} />
                </div>
                <span className="text-[10px] uppercase tracking-wider dark:text-slate-400 text-slate-500 font-medium">
                  {m.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold dark:text-white text-slate-900">{m.value}</span>
                <span className="text-xs dark:text-slate-400 text-slate-500">{m.suffix}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Krum Scores */}
        <KrumPanel krum={data.krum} />
        {/* Cosine Similarity Matrix */}
        <CosinePanel cosine={data.cosineSimilarity} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* ECDSA */}
        <EcdsaPanel ecdsa={data.ecdsa} />
        {/* Rate Limiting */}
        <RateLimitPanel rateLimit={data.rateLimit} />
      </div>
    </div>
  );
}


/* ── Sub-panels ─────────────────────────────────────────────── */

function KrumPanel({ krum }: { krum: KrumData }) {
  const latestRound = krum.rounds[krum.rounds.length - 1];
  if (!latestRound) return null;

  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-sm dark:text-white text-slate-900">Multi-Krum Defence</h4>
          <p className="text-[10px] dark:text-slate-400 text-slate-500">Threshold: {krum.threshold} · {krum.algorithm}</p>
        </div>
        <span className="text-[10px] dark:text-slate-500 text-slate-400 font-mono">R{latestRound.round}</span>
      </div>

      <div className="space-y-2">
        {Object.entries(latestRound.clients).map(([cid, c]) => (
          <div key={cid} className="flex items-center gap-3">
            <span className="text-xs w-16 dark:text-slate-300 text-slate-600 truncate">{c.clientName}</span>
            <div className="flex-1 h-2 rounded-full bg-white/[.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${c.accepted ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`}
                style={{ width: `${Math.min(c.score * 100, 100)}%` }}
              />
            </div>
            <span className={`text-xs font-mono font-medium ${c.accepted ? 'text-emerald-400' : 'text-red-400'}`}>
              {c.score.toFixed(3)}
            </span>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${c.accepted ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {c.accepted ? 'PASS' : 'REJECT'}
            </span>
          </div>
        ))}
      </div>

      {/* Mini sparkline across rounds */}
      <div className="mt-3 pt-3 border-t border-white/[.05]">
        <p className="text-[10px] dark:text-slate-500 text-slate-400 mb-1">Score trend (last {krum.rounds.length} rounds)</p>
        <div className="flex items-end gap-px h-8">
          {krum.rounds.map((r) => {
            const avg = Object.values(r.clients).reduce((s, c) => s + c.score, 0) / Object.values(r.clients).length;
            return (
              <div
                key={r.round}
                className="flex-1 bg-gradient-to-t from-violet-500/60 to-cyan-400/60 rounded-t transition-all duration-300 hover:from-violet-400 hover:to-cyan-300"
                style={{ height: `${avg * 100}%` }}
                title={`R${r.round}: ${avg.toFixed(3)}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}


function CosinePanel({ cosine }: { cosine: CosineData }) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="mb-3">
        <h4 className="font-semibold text-sm dark:text-white text-slate-900">Cosine Similarity Matrix</h4>
        <p className="text-[10px] dark:text-slate-400 text-slate-500">
          Gradient agreement · Anomaly threshold: {cosine.anomalyThreshold}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="py-1 px-2" />
              {cosine.clientIds.map(id => (
                <th key={id} className="py-1 px-2 text-center dark:text-slate-400 text-slate-500 font-medium">{id}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cosine.matrix.map((row, i) => (
              <tr key={i}>
                <td className="py-1 px-2 font-medium dark:text-slate-300 text-slate-600">{cosine.clientIds[i]}</td>
                {row.map((val, j) => {
                  const isAnomaly = i !== j && val < cosine.anomalyThreshold;
                  const isDiag = i === j;
                  return (
                    <td key={j} className="py-1 px-2 text-center">
                      <span
                        className={`inline-block w-12 py-1 rounded font-mono text-[11px] ${
                          isDiag
                            ? 'bg-white/[.04] dark:text-slate-500 text-slate-400'
                            : isAnomaly
                              ? 'bg-red-500/20 text-red-400 font-semibold'
                              : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {val.toFixed(2)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function EcdsaPanel({ ecdsa }: { ecdsa: EcdsaData }) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-sm dark:text-white text-slate-900">ECDSA Verification</h4>
          <p className="text-[10px] dark:text-slate-400 text-slate-500">{ecdsa.algorithm}</p>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ecdsa.allVerified ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
          {ecdsa.allVerified ? '✓ All Verified' : '✗ Failure Detected'}
        </span>
      </div>

      <div className="space-y-2">
        {Object.entries(ecdsa.clients).map(([cid, c]) => (
          <div key={cid} className="flex items-center gap-3 p-2 rounded-lg bg-white/[.02]">
            <FiLock className={c.verified ? 'text-emerald-400' : 'text-red-400'} size={14} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium dark:text-white text-slate-900">{c.clientName}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono dark:text-slate-500 text-slate-400 truncate">
                  {c.publicKeyFingerprint}
                </span>
              </div>
            </div>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${c.verified ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {c.verified ? 'VERIFIED' : 'FAILED'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


function RateLimitPanel({ rateLimit }: { rateLimit: RateLimitData }) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-sm dark:text-white text-slate-900">DDoS / Rate Limiting</h4>
          <p className="text-[10px] dark:text-slate-400 text-slate-500">
            Window: {rateLimit.windowSeconds}s · Limit: {rateLimit.globalLimit} req/min
          </p>
        </div>
        {rateLimit.activeBlocks > 0 && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 animate-pulse">
            {rateLimit.activeBlocks} blocked
          </span>
        )}
      </div>

      <div className="space-y-2">
        {Object.entries(rateLimit.clients).map(([cid, c]) => (
          <div key={cid} className="flex items-center gap-3">
            <span className="text-xs w-16 dark:text-slate-300 text-slate-600">{c.clientName}</span>
            <div className="flex-1 h-2 rounded-full bg-white/[.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${c.blocked ? 'bg-red-500' : c.requestsPerMin > c.limit * 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min((c.requestsPerMin / c.limit) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono dark:text-slate-400 text-slate-500 w-16 text-right">
              {c.requestsPerMin}/{c.limit}
            </span>
            {c.blocked && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">BLOCKED</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
