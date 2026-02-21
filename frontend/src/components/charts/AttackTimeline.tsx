import { useEffect, useState } from 'react';
import { fetchAttackTimeline } from '../../api';
import type { AttackEvent } from '../../data/securityMockData';

const severityColor: Record<string, string> = {
  low:      'bg-blue-500',
  medium:   'bg-amber-500',
  high:     'bg-orange-500',
  critical: 'bg-red-500',
};

const severityBg: Record<string, string> = {
  low:      'bg-blue-500/15  text-blue-400',
  medium:   'bg-amber-500/15 text-amber-400',
  high:     'bg-orange-500/15 text-orange-400',
  critical: 'bg-red-500/15   text-red-400',
};

const attackLabel: Record<string, string> = {
  byzantine_gradient: 'Byzantine Gradient',
  model_poisoning:    'Model Poisoning',
  sybil_node:         'Sybil Node',
  ddos_flood:         'DDoS Flood',
  data_poisoning:     'Data Poisoning',
  label_flip:         'Label Flip',
  free_rider:         'Free Rider',
};

const defenseLabel: Record<string, string> = {
  krum_filter:         'Krum Filter',
  cosine_reject:       'Cosine Reject',
  rate_limit:          'Rate Limit',
  ecdsa_block:         'ECDSA Block',
  anomaly_quarantine:  'Quarantine',
  gradient_clip:       'Gradient Clip',
  reputation_decay:    'Rep. Decay',
};

/**
 * AttackTimeline — vertical timeline showing attack events and defences.
 * Colour-coded by severity with blocked/unblocked badges.
 */
export default function AttackTimeline() {
  const [events, setEvents] = useState<AttackEvent[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchAttackTimeline(30).then(setEvents);
  }, []);

  const display = expanded ? events : events.slice(0, 6);

  if (!events.length) {
    return (
      <div className="rounded-2xl glass p-5 sm:p-6 animate-pulse">
        <div className="h-48 bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold dark:text-white text-slate-900">Attack Timeline</h3>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            Recent attack events & automated defences
          </p>
        </div>
        <span className="text-xs dark:text-slate-500 text-slate-400 bg-white/5 px-3 py-1 rounded-full">
          {events.length} events
        </span>
      </div>

      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-500/60 via-pink-500/40 to-transparent" />

        <div className="space-y-3">
          {display.map((ev, idx) => {
            const timeStr = new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div
                key={ev.id}
                className="relative flex items-start gap-3 group animate-fade-in"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Dot */}
                <div className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full ring-2 ring-slate-950/80 ${severityColor[ev.severity]} shadow-lg shadow-${ev.severity === 'critical' ? 'red' : 'orange'}-500/30`} />

                <div className="flex-1 rounded-xl bg-white/[.03] dark:bg-white/[.03] border border-white/[.05] p-3 hover:bg-white/[.06] transition-colors duration-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${severityBg[ev.severity]}`}>
                        {ev.severity.toUpperCase()}
                      </span>
                      <span className="text-xs font-medium dark:text-white text-slate-900">
                        {attackLabel[ev.attackType] || ev.attackType}
                      </span>
                      <span className="text-[10px] dark:text-slate-500 text-slate-400">→ {ev.targetClient}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${ev.blocked ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                        {ev.blocked ? '✓ Blocked' : '✗ Passed'}
                      </span>
                      <span className="text-[10px] font-mono dark:text-slate-500 text-slate-400">{timeStr}</span>
                    </div>
                  </div>

                  <p className="text-[11px] dark:text-slate-400 text-slate-500 mb-1.5">{ev.details}</p>

                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="dark:text-slate-500 text-slate-400">
                      Defence: <span className="text-violet-400 font-medium">{defenseLabel[ev.defenseAction] || ev.defenseAction}</span>
                    </span>
                    <span className="dark:text-slate-500 text-slate-400">Round #{ev.round}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {events.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full text-center text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          {expanded ? 'Show less' : `Show all ${events.length} events`}
        </button>
      )}
    </div>
  );
}
