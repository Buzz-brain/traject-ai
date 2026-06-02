import { Radio, Wifi, WifiOff, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

export type TrackingMode = 'gps_only' | 'ai_only' | 'hybrid';
export type GpsSignalQuality = 'good' | 'weak' | 'poor' | 'lost';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

interface Props {
  mode: TrackingMode;
  gpsSignal: GpsSignalQuality;
  confidence: ConfidenceLevel;
  isTracking: boolean;
  gpsPoints: number;
  predictionActive: boolean;
  accuracy?: number | null;
}

const MODE_CONFIG: Record<TrackingMode, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  gps_only: {
    label: 'GPS Mode',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: <Radio size={16} />
  },
  ai_only: {
    label: 'AI Mode',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: <Zap size={16} />
  },
  hybrid: {
    label: 'Hybrid Mode',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    icon: <CheckCircle size={16} />
  }
};

const SIGNAL_CONFIG: Record<GpsSignalQuality, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  good: {
    label: 'GPS Good',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    icon: <Wifi size={16} />
  },
  weak: {
    label: 'GPS Weak',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: <Wifi size={16} />
  },
  poor: {
    label: 'GPS Poor',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: <AlertTriangle size={16} />
  },
  lost: {
    label: 'GPS Lost',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: <WifiOff size={16} />
  }
};

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; color: string }> = {
  high: { label: 'High', color: 'text-emerald-600' },
  medium: { label: 'Medium', color: 'text-amber-600' },
  low: { label: 'Low', color: 'text-red-600' },
  unknown: { label: 'Unknown', color: 'text-slate-500' }
};

export function SystemIndicators({
  mode,
  gpsSignal,
  confidence,
  isTracking,
  gpsPoints,
  predictionActive,
  accuracy
}: Props) {
  const modeConfig = MODE_CONFIG[mode];
  const signalConfig = SIGNAL_CONFIG[gpsSignal];
  const confidenceConfig = CONFIDENCE_CONFIG[confidence];

  return (
    <div className="glass-card p-4 rounded-2xl space-y-3">
      {/* Status Row */}
      <div className="flex items-center gap-2">
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${modeConfig.bgColor} ${modeConfig.color}`}>
          {modeConfig.icon}
          {modeConfig.label}
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${signalConfig.bgColor} ${signalConfig.color}`}>
          {signalConfig.icon}
          {signalConfig.label}
        </div>
      </div>

      {/* Tracking Status Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-slate-600 dark:text-slate-400">
            {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
          </span>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {gpsPoints} points
        </span>
      </div>

      {/* Accuracy & Confidence Row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-medium">Accuracy</div>
          <div className="font-bold text-slate-800 dark:text-white">
            {accuracy !== null && accuracy !== undefined
              ? `${accuracy.toFixed(1)}m`
              : 'N/A'}
          </div>
        </div>
        <div className="text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-medium">Confidence</div>
          <div className={`font-bold ${confidenceConfig.color}`}>
            {confidenceConfig.label}
          </div>
        </div>
      </div>

      {/* Prediction Status */}
      {predictionActive && (
        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
              AI Prediction Active
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
