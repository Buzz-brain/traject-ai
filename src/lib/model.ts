import * as tf from '@tensorflow/tfjs';

let modelInstance: tf.LayersModel | null = null;
let modelLoading: Promise<tf.LayersModel> | null = null;

/**
 * Load the TensorFlow.js model from public/model/model.json
 * Handles caching to avoid reloading
 */
export async function loadModel(): Promise<tf.LayersModel> {
  // If already loaded, return it
  if (modelInstance) {
    return modelInstance;
  }

  // If currently loading, wait for it
  if (modelLoading) {
    return modelLoading;
  }

  // Load the model from public directory (served at root URL in Vite)
  modelLoading = tf.loadLayersModel('/model/model.json');

  try {
    modelInstance = await modelLoading;
    console.log('LSTM model loaded successfully');
    return modelInstance;
  } catch (error) {
    console.error('Failed to load model:', error);
    modelLoading = null;
    throw error;
  }
}

/**
 * Check if model is loaded
 */
export function isModelLoaded(): boolean {
  return modelInstance !== null;
}

/**
 * Dispose of the model to free memory
 */
export function disposeModel(): void {
  if (modelInstance) {
    modelInstance.dispose();
    modelInstance = null;
  }
}

/**
 * Get the loaded model instance
 */
export function getModel(): tf.LayersModel | null {
  return modelInstance;
}
