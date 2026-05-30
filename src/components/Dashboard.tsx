import { MapPin, Zap, Ruler, Clock, Navigation, Activity, Info } from 'lucide-react';
import { formatDistance, formatSpeed, formatDuration } from '../lib/utils';

interface Props {
  pointsCount: number;
  totalDistance: number;
  currentSpeed: number;
  duration: number;
  currentPos: { lat: number; lon: number } | null;
  currentAccuracy?: number | null;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="glass-card p-3 rounded-2xl flex flex-col gap-1">
      <div className={`flex items-center gap-1.5 text-xs font-medium ${accent ?? 'text-slate-500 dark:text-slate-400'}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{value}</div>
      {sub && <div className="text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  );
}

export function Dashboard({ pointsCount, totalDistance, currentSpeed, duration, currentPos, currentAccuracy, onExplain }: Props & { onExplain?: () => void }) {
  const renderBadge = () => {
    if (typeof currentAccuracy !== 'number') return null;
    const isPoor = currentAccuracy > 50;
    const isWeak = !isPoor && currentAccuracy > 20;
    const label = isPoor ? 'Poor GPS Signal' : isWeak ? 'Weak GPS' : 'Good GPS';
    const badgeClass = isPoor
      ? 'inline-flex items-center gap-2 rounded-full bg-red-100 text-red-800 text-xs font-semibold px-3 py-1'
      : isWeak
      ? 'inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1'
      : 'inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1';
    const dotClass = isPoor ? 'w-2 h-2 rounded-full bg-red-600' : isWeak ? 'w-2 h-2 rounded-full bg-amber-600' : 'w-2 h-2 rounded-full bg-emerald-600';

    return (
      <div className="mb-2 flex items-center justify-between">
        <div className={badgeClass}>
          <span className={dotClass} />
          {label}
        </div>
        {onExplain && (
          <button onClick={onExplain} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Info size={14} />
            Why?
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      {renderBadge()}
      {typeof currentAccuracy === 'number' && currentAccuracy > 20 && (
        <div className="mb-2 text-xs text-slate-600 dark:text-slate-400">Go outside or enable precise location for better accuracy</div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <StatCard
        icon={<Activity size={13} />}
        label="Points"
        value={pointsCount.toLocaleString()}
        sub="collected"
        accent="text-emerald-500"
      />
      <StatCard
        icon={<Ruler size={13} />}
        label="Distance"
        value={formatDistance(totalDistance)}
        accent="text-sky-500"
      />
      <StatCard
        icon={<Zap size={13} />}
        label="Speed"
        value={formatSpeed(currentSpeed)}
        accent="text-amber-500"
      />
      <StatCard
        icon={<Clock size={13} />}
        label="Duration"
        value={formatDuration(duration)}
        accent="text-rose-500"
      />
      <StatCard
        icon={<MapPin size={13} />}
        label="Latitude"
        value={currentPos ? currentPos.lat.toFixed(6) : '—'}
        accent="text-teal-500"
      />
      <StatCard
        icon={<Navigation size={13} />}
        label="Longitude"
        value={currentPos ? currentPos.lon.toFixed(6) : '—'}
        accent="text-teal-500"
      />
      </div>
    </div>
  );
}
