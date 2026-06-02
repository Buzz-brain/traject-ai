import { MapPin, Zap, Ruler, Clock, Navigation, Activity, Info } from 'lucide-react';
import { formatDistance, formatSpeed, formatDuration } from '../lib/utils';
import { SystemIndicators, type TrackingMode, type GpsSignalQuality, type ConfidenceLevel } from './SystemIndicators';

interface Props {
  pointsCount: number;
  totalDistance: number;
  currentSpeed: number;
  duration: number;
  currentPos: { lat: number; lon: number } | null;
  currentAccuracy?: number | null;
  // Hybrid tracking indicators (optional)
  trackingMode?: TrackingMode;
  gpsSignal?: GpsSignalQuality;
  confidence?: ConfidenceLevel;
  isTracking?: boolean;
  predictionActive?: boolean;
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

export function Dashboard({ 
  pointsCount, 
  totalDistance, 
  currentSpeed, 
  duration, 
  currentPos, 
  currentAccuracy, 
  onExplain,
  trackingMode = 'gps_only',
  gpsSignal = 'good',
  confidence = 'unknown',
  isTracking = false,
  predictionActive = false
}: Props & { onExplain?: () => void }) {
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
    <div className="space-y-3">
      {/* System Indicators */}
      <SystemIndicators
        mode={trackingMode}
        gpsSignal={gpsSignal}
        confidence={confidence}
        isTracking={isTracking}
        gpsPoints={pointsCount}
        predictionActive={predictionActive}
        accuracy={currentAccuracy}
      />

      {/* GPS Status Warning */}
      {typeof currentAccuracy === 'number' && currentAccuracy > 50 && (
        <div className="mb-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          ⚠️ Poor GPS signal - AI predictions will activate when GPS is lost
        </div>
      )}
      {typeof currentAccuracy === 'number' && currentAccuracy > 20 && currentAccuracy <= 50 && (
        <div className="mb-2 text-xs text-amber-600 dark:text-amber-400">
          📍 Go outside for better GPS accuracy
        </div>
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

      {/* Hybrid Tracking Metrics */}
      {predictionActive && (
        <div className="mt-3 glass-card p-3 rounded-2xl border-l-4 border-purple-500 bg-purple-50/50 dark:bg-purple-900/20">
          <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1.5">
            <Zap size={13} />
            AI Prediction Active
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            GPS signal lost. AI model is now predicting your trajectory based on previous movement patterns.
          </div>
        </div>
      )}

      {confidence !== 'unknown' && (
        <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 text-center">
          Prediction Confidence: <span className="font-semibold text-purple-600 dark:text-purple-400">{confidence.toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}
