import { trainingHistory } from '../../data/mockData';

export default function TrainingHistoryTable() {
  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold dark:text-white text-slate-900">Training History</h3>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            Recent federated aggregation rounds
          </p>
        </div>
        <span className="text-xs dark:text-slate-500 text-slate-400 bg-white/5 px-3 py-1 rounded-full">
          {trainingHistory.length} rounds shown
        </span>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-3 px-3 font-medium dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider">Round</th>
              <th className="text-left py-3 px-3 font-medium dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider">Timestamp</th>
              <th className="text-left py-3 px-3 font-medium dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider">Accuracy</th>
              <th className="text-left py-3 px-3 font-medium dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider">Loss</th>
              <th className="text-left py-3 px-3 font-medium dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider hidden sm:table-cell">Clients</th>
              <th className="text-left py-3 px-3 font-medium dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">Duration</th>
              <th className="text-left py-3 px-3 font-medium dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {trainingHistory.map((row, idx) => (
              <tr
                key={row.round}
                className="border-b border-white/[.03] hover:bg-white/[.03] transition-colors duration-200"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <td className="py-3 px-3">
                  <span className="font-mono font-semibold dark:text-white text-slate-900">#{row.round}</span>
                </td>
                <td className="py-3 px-3">
                  <span className="font-mono text-xs dark:text-slate-400 text-slate-500">{row.timestamp}</span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-1000"
                        style={{ width: `${row.globalAccuracy}%` }}
                      />
                    </div>
                    <span className="font-mono font-medium dark:text-emerald-400 text-emerald-600 text-xs">
                      {row.globalAccuracy}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className="font-mono text-xs dark:text-slate-300 text-slate-600">{row.loss}</span>
                </td>
                <td className="py-3 px-3 hidden sm:table-cell">
                  <div className="flex -space-x-1">
                    {Array.from({ length: row.participants }).map((_, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border-2 border-slate-900/50 flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899'][i] }}
                      >
                        {['A', 'B', 'C'][i]}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-3 hidden md:table-cell">
                  <span className="font-mono text-xs dark:text-slate-400 text-slate-500">{row.duration}</span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      row.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : row.status === 'in-progress'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        row.status === 'completed'
                          ? 'bg-emerald-500'
                          : row.status === 'in-progress'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-red-500'
                      }`}
                    />
                    {row.status === 'completed' ? 'Done' : row.status === 'in-progress' ? 'Running' : 'Failed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
