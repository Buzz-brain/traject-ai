import * as tf from '@tensorflow/tfjs';
import { loadModel } from './model';
import type { GpsPoint } from './utils';

// Scaler parameters from public/scaler.json
const SCALER = {
  data_min: [5.3720293, 6.9976181, 0.0, 0.0],
  data_max: [5.3791277, 7.0027822, 3.68, 355.6],
  scale: [140.87681731095535, 193.64458472918787, 0.2717391304347826, 0.00281214848143982],
  feature_names: ['latitude', 'longitude', 'speed', 'heading']
};

export interface PredictionResult {
  dx: number;
  dy: number;
  confidence: number;
}

/**
 * Normalize GPS point using scaler parameters
 */
function normalizePoint(lat: number, lon: number, speed: number, heading: number): number[] {
  const values = [lat, lon, speed, heading];
  const normalized: number[] = [];

  for (let i = 0; i < 4; i++) {
    // MinMaxScaler formula: (x - min) / (max - min) * scale
    const minMaxNormalized = (values[i] - SCALER.data_min[i]) / (SCALER.data_max[i] - SCALER.data_min[i]);
    normalized.push(minMaxNormalized);
  }

  return normalized;
}

/**
 * Normalize a sequence of GPS points
 */
function normalizeSequence(points: GpsPoint[]): number[][] {
  return points.map(p => normalizePoint(p.lat, p.lon, p.speed, p.heading));
}

/**
 * Run LSTM prediction on a sequence of 10 GPS points
 * Returns predicted displacement in meters
 */
export async function predictNextLocation(points: GpsPoint[]): Promise<PredictionResult | null> {
  try {
    if (!points || points.length < 10) {
      console.warn('Need at least 10 points for prediction');
      return null;
    }

    // // Take the last 10 points
    // const last10Points = points.slice(-10);

    // Take the last 10 GPS points only (ignore AI predictions for input)
    const last10Points = points.filter(p => p.source === 'gps').slice(-10);

    // Normalize the sequence
    const normalizedSeq = normalizeSequence(last10Points);

    // Load model
    const model = await loadModel();

    // Create tensor and run prediction
    const inputTensor = tf.tensor3d([normalizedSeq], [1, 10, 4]);
    const prediction = model.predict(inputTensor) as tf.Tensor;

    // Get prediction values
    const predArray = await prediction.array() as number[][];
    const [dx, dy] = predArray[0];

    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();

    // Calculate confidence (inverse of displacement magnitude)
    // Smaller displacement = higher confidence in short-term prediction
    const displacement = Math.sqrt(dx * dx + dy * dy);
    const confidence = Math.max(0, Math.min(1, 1 - (displacement / 50))); // Normalize to 0-1

    return {
      dx: parseFloat(dx.toFixed(2)),
      dy: parseFloat(dy.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(3))
    };
  } catch (error) {
    console.error('Prediction error:', error);
    return null;
  }
}

/**
 * Batch predict multiple sequences (for testing/evaluation)
 */
export async function batchPredict(
  sequences: GpsPoint[][]
): Promise<PredictionResult[]> {
  const results: PredictionResult[] = [];

  for (const seq of sequences) {
    const result = await predictNextLocation(seq);
    if (result) {
      results.push(result);
    }
  }

  return results;
}
