import { AlertCircle, BarChart3, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { haversineDistance } from '../lib/utils';
import type { GpsPoint } from '../lib/utils';

interface EvaluationMetrics {
  gpsOnlyError: number | null;
  hybridError: number | null;
  predictionAccuracy: number | null;
  continuityScore: number | null;
  recoveryTime: number | null;
  totalGpsPoints: number;
  totalPredictedPoints: number;
}

interface Props {
  gpsPoints: GpsPoint[];
  predictedPoints: Array<{ lat: number; lon: number; timestamp: string; predicted: boolean }>;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Calculate distance error between two locations
 */
function calculateLocationError(
  actualLat: number,
  actualLon: number,
  predictedLat: number,
  predictedLon: number
): number {
  return haversineDistance(actualLat, actualLon, predictedLat, predictedLon);
}

/**
 * Calculate evaluation metrics
 */
function calculateMetrics(gpsPoints: GpsPoint[], predictedPoints: any[]): EvaluationMetrics {
  if (gpsPoints.length === 0 || predictedPoints.length === 0) {
    return {
      gpsOnlyError: null,
      hybridError: null,
      predictionAccuracy: null,
      continuityScore: null,
      recoveryTime: null,
      totalGpsPoints: gpsPoints.length,
      totalPredictedPoints: predictedPoints.length
    };
  }

  // Calculate average prediction error
  let totalError = 0;
  let errorCount = 0;

  for (let i = 0; i < Math.min(gpsPoints.length, predictedPoints.length); i++) {
    const gps = gpsPoints[i];
    const pred = predictedPoints[i];
    const error = calculateLocationError(gps.lat, gps.lon, pred.lat, pred.lon);
    totalError += error;
    errorCount++;
  }

  const predictionAccuracy = errorCount > 0 ? totalError / errorCount : null;

  // Calculate continuity score (0-100)
  // Based on the smoothness of predicted path
  let continuity = 0;
  if (predictedPoints.length > 1) {
    let smoothness = 0;
    for (let i = 1; i < predictedPoints.length; i++) {
      const dist = calculateLocationError(
        predictedPoints[i - 1].lat,
        predictedPoints[i - 1].lon,
        predictedPoints[i].lat,
        predictedPoints[i].lon
      );
      smoothness += Math.min(dist, 50); // Cap at 50m to avoid outliers
    }
    continuity = Math.min(100, (smoothness / (predictedPoints.length - 1)) * 2);
  }

  return {
    gpsOnlyError: gpsPoints.length > 1 ? 1.5 : null, // Placeholder
    hybridError: predictionAccuracy,
    predictionAccuracy,
    continuityScore: continuity,
    recoveryTime: null,
    totalGpsPoints: gpsPoints.length,
    totalPredictedPoints: predictedPoints.length
  };
}

export function EvaluationPanel({ gpsPoints, predictedPoints, isOpen, onClose }: Props) {
  const metrics = calculateMetrics(gpsPoints, predictedPoints);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full sm:w-96 max-h-[80vh] overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-emerald-500" />
            Evaluation Metrics
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-2">
          {/* Prediction Accuracy */}
          {metrics.predictionAccuracy !== null && (
            <div className="glass-card p-3 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-blue-500" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Prediction Accuracy</span>
                </div>
                <span className={`text-sm font-bold ${
                  metrics.predictionAccuracy < 2
                    ? 'text-emerald-600'
                    : metrics.predictionAccuracy < 5
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}>
                  {metrics.predictionAccuracy.toFixed(2)}m
                </span>
              </div>
              <div className="mt-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metrics.predictionAccuracy < 2
                      ? 'bg-emerald-500'
                      : metrics.predictionAccuracy < 5
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (metrics.predictionAccuracy / 10) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Continuity Score */}
          {metrics.continuityScore !== null && (
            <div className="glass-card p-3 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-purple-500" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Path Continuity</span>
                </div>
                <span className="text-sm font-bold text-purple-600">{metrics.continuityScore.toFixed(1)}%</span>
              </div>
              <div className="mt-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-purple-500"
                  style={{ width: `${metrics.continuityScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Point Counts */}
          <div className="grid grid-cols-2 gap-2">
            <div className="glass-card p-3 rounded-xl">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">GPS Points</div>
              <div className="text-lg font-bold text-emerald-600">{metrics.totalGpsPoints}</div>
            </div>
            <div className="glass-card p-3 rounded-xl">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Predicted Points</div>
              <div className="text-lg font-bold text-purple-600">{metrics.totalPredictedPoints}</div>
            </div>
          </div>

          {/* Info Message */}
          {metrics.predictionAccuracy === null && (
            <div className="glass-card p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  Collect GPS and predicted data to see evaluation metrics. Ensure GPS loss occurs and predictions are made.
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          {metrics.predictionAccuracy !== null && (
            <div className="glass-card p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-emerald-800 dark:text-emerald-300">
                  {metrics.predictionAccuracy < 2
                    ? 'Excellent prediction accuracy! AI is performing very well.'
                    : metrics.predictionAccuracy < 5
                    ? 'Good prediction accuracy. Model is tracking well.'
                    : 'Predictions show room for improvement. Consider more training data.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded-xl transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}
