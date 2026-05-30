import { Sun, Moon, Radio } from 'lucide-react';
import type { RecordingStatus } from '../hooks/useGPS';

interface Props {
  isDark: boolean;
  onToggleTheme: () => void;
  status: RecordingStatus;
}

const STATUS_CONFIG: Record<RecordingStatus, { label: string; color: string; pulse: boolean }> = {
  idle: { label: 'Ready', color: 'text-slate-400', pulse: false },
  recording: { label: 'Recording', color: 'text-emerald-400', pulse: true },
  paused: { label: 'Paused', color: 'text-amber-400', pulse: false },
  stopped: { label: 'Stopped', color: 'text-red-400', pulse: false },
};

export function Header({ isDark, onToggleTheme, status }: Props) {
  const cfg = STATUS_CONFIG[status];

  return (
    <header className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Radio size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-800 dark:text-white leading-none">Naija GPS</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-none mt-0.5">Trajectory Collector</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${cfg.color}`}>
          <span
            className={`w-1.5 h-1.5 rounded-full bg-current ${cfg.pulse ? 'animate-pulse' : ''}`}
          />
          {cfg.label}
        </div>
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-xl
            bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20
            border border-white/30 dark:border-white/10 transition-all duration-200"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-600" />}
        </button>
      </div>
    </header>
  );
}
