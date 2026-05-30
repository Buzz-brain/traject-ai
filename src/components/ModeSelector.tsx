import type { MovementMode } from '../lib/utils';

const MODES: { value: MovementMode; label: string; icon: string }[] = [
  { value: 'walking', label: 'Walk', icon: '🚶' },
  { value: 'running', label: 'Run', icon: '🏃' },
  { value: 'driving', label: 'Drive', icon: '🚗' },
  { value: 'bike', label: 'Bike', icon: '🚴' },
];

interface Props {
  value: MovementMode;
  onChange: (mode: MovementMode) => void;
  disabled?: boolean;
}

export function ModeSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="flex gap-2">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          disabled={disabled}
          className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-semibold
            transition-all duration-200 border
            ${
              value === m.value
                ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 scale-105'
                : 'bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-white/10'
            }
            disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <span className="text-lg">{m.icon}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
}
