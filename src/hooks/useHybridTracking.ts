import { useState, useCallback, useRef, useEffect } from 'react';
import type { GpsPoint } from '../lib/utils';
import { displacementToCoordinates } from '../lib/utils';
import { predictNextLocation } from '../lib/predictor';
import { loadModel } from '../lib/model';
import type { TrackingMode, GpsSignalQuality, ConfidenceLevel } from '../components/SystemIndicators';

export interface HybridTrackingState {
  mode: TrackingMode;
  gpsSignal: GpsSignalQuality;
  confidence: ConfidenceLevel;
  currentPos: { lat: number; lon: number } | null;
  gpsPoints: GpsPoint[];
  predictedPoints: Array<{ lat: number; lon: number; timestamp: string; predicted: true }>;
  predictionActive: boolean;
  gpsLossStart: number | null;
  accuracy: number | null;
  // NEW: Hybrid data tracking
  gpsPointsCount: number;
  aiPointsCount: number;
  switchEvents: Array<{ timestamp: string; from: TrackingMode; to: TrackingMode }>;
  lastModeSwitch: string | null;
  avgAiConfidence: number;
}

interface UseHybridTrackingOptions {
  gpsLossThreshold?: number; // ms before switching to AI
  accuracyThreshold?: number; // meters for "good" GPS
  updateInterval?: number; // ms
}

const DEFAULT_OPTIONS: UseHybridTrackingOptions = {
  gpsLossThreshold: 5000, // 5 seconds
  accuracyThreshold: 20, // 20 meters
  updateInterval: 1000 // 1 second
};

export function useHybridTracking(options: UseHybridTrackingOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [state, setState] = useState<HybridTrackingState>({
    mode: 'gps_only',
    gpsSignal: 'good',
    confidence: 'unknown',
    currentPos: null,
    gpsPoints: [],
    predictedPoints: [],
    predictionActive: false,
    gpsLossStart: null,
    accuracy: null,
    gpsPointsCount: 0,
    aiPointsCount: 0,
    switchEvents: [],
    lastModeSwitch: null,
    avgAiConfidence: 0
  });

  // Refs
  const modelLoadedRef = useRef(false);
  const predictionIntervalRef = useRef<number | null>(null);
  const gpsWatchIdRef = useRef<number | null>(null);
  const lastGpsUpdateRef = useRef<number>(Date.now());
  const userModeRef = useRef<TrackingMode | null>(null); // User's explicit mode choice

  // Initialize model on mount
  useEffect(() => {
    loadModel()
      .then(() => {
        modelLoadedRef.current = true;
        console.log('Hybrid tracking: Model loaded');
      })
      .catch(err => console.error('Hybrid tracking: Failed to load model', err));
  }, []);

  /**
   * Update GPS signal quality based on accuracy
   */
  const updateGpsSignal = useCallback((accuracy: number | null): GpsSignalQuality => {
    if (accuracy === null || accuracy === undefined) return 'lost';
    if (accuracy <= opts.accuracyThreshold!) return 'good';
    if (accuracy <= 50) return 'weak';
    return 'poor';
  }, [opts]);

  /**
   * Update current position and tracking state
   */
  const updatePosition = useCallback((lat: number, lon: number, accuracy: number | null) => {
    const signal = updateGpsSignal(accuracy);
    lastGpsUpdateRef.current = Date.now();

    setState(prev => ({
      ...prev,
      currentPos: { lat, lon },
      accuracy,
      gpsSignal: signal,
      gpsLossStart: signal === 'lost' ? prev.gpsLossStart || Date.now() : null
    }));
  }, [updateGpsSignal]);

  /**
   * Add a GPS point to the tracking history
   */
  const addGpsPoint = useCallback((lat: number, lon: number, accuracy: number | null, speed: number = 0, heading: number = 0) => {
    const newPoint: GpsPoint = {
      lat,
      lon,
      timestamp: new Date().toISOString(),
      speed,
      heading,
      mode: 'tracking',
      source: 'gps',  // NEW: Tag as GPS source
      accuracy: accuracy ?? undefined
    };

    setState(prev => {
      const updated = [...prev.gpsPoints, newPoint];
      // Keep only last 100 points to avoid memory issues
      if (updated.length > 100) {
        updated.shift();
      }
      return {
        ...prev,
        gpsPoints: updated,
        gpsPointsCount: prev.gpsPointsCount + 1  // NEW: Track count
      };
    });

    updatePosition(lat, lon, accuracy);
  }, [updatePosition]);

  /**
   * Run AI prediction and add predicted point
   */
  const runPrediction = useCallback(async () => {
    if (!modelLoadedRef.current || !state.currentPos) return;

    try {
      const result = await predictNextLocation(state.gpsPoints);
      if (!result) return;

      const { dx, dy, confidence } = result;

      // Convert displacement to new coordinates
      const predictedPos = displacementToCoordinates(
        state.currentPos.lat,
        state.currentPos.lon,
        dx,
        dy
      );

      // NEW: Create AI point with source tagging
      const aiPoint: GpsPoint = {
        lat: predictedPos.lat,
        lon: predictedPos.lon,
        timestamp: new Date().toISOString(),
        speed: 0,
        heading: 0,
        mode: 'tracking',
        source: 'ai_prediction',  // NEW: Tag as AI source
        confidence: confidence     // NEW: Store confidence
      };

      // Add predicted point
      const predictedPoint = {
        lat: predictedPos.lat,
        lon: predictedPos.lon,
        timestamp: new Date().toISOString(),
        predicted: true as const
      };

      setState(prev => {
        // Calculate running average confidence
        const totalConfidence = (prev.avgAiConfidence * prev.aiPointsCount) + confidence;
        const newAiCount = prev.aiPointsCount + 1;
        const newAvgConfidence = totalConfidence / newAiCount;

        return {
          ...prev,
          predictedPoints: [...prev.predictedPoints, predictedPoint].slice(-20), // Keep last 20
          gpsPoints: [...prev.gpsPoints, aiPoint],  // NEW: Add AI point to records
          confidence: confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low',
          aiPointsCount: newAiCount,  // NEW: Track count
          avgAiConfidence: newAvgConfidence  // NEW: Track average
        };
      });
    } catch (error) {
      console.error('Prediction error:', error);
    }
  }, [state.currentPos, state.gpsPoints]);

  /**
   * Set explicit tracking mode
   */
  const setTrackingMode = useCallback((mode: TrackingMode) => {
    userModeRef.current = mode;
    setState(prev => {
      // NEW: Track mode switches
      const switchEvent = {
        timestamp: new Date().toISOString(),
        from: prev.mode,
        to: mode
      };

      return {
        ...prev,
        mode,
        predictionActive: mode === 'ai_only' || (mode === 'hybrid' && prev.gpsSignal === 'lost'),
        switchEvents: [...prev.switchEvents, switchEvent],  // NEW: Record switch
        lastModeSwitch: switchEvent.timestamp  // NEW: Track last switch
      };
    });
  }, []);

  /**
   * Auto-update mode based on GPS signal (for hybrid mode)
   */
  useEffect(() => {
    if (userModeRef.current === 'gps_only') return;

    setState(prev => {
      let newMode = prev.mode;
      let predictionActive = prev.predictionActive;

      if (userModeRef.current === 'hybrid') {
        // In hybrid mode, switch between GPS and AI based on signal
        // But ALWAYS show predictions once we have 10+ points
        predictionActive = prev.gpsPoints.length >= 10;
        
        if (prev.gpsSignal === 'lost' || prev.gpsSignal === 'poor') {
          newMode = prev.gpsPoints.length >= 10 ? 'hybrid' : 'gps_only';
        } else {
          newMode = 'hybrid';
        }
      } else if (userModeRef.current === 'ai_only') {
        newMode = 'ai_only';
        predictionActive = prev.gpsPoints.length >= 10;
      }

      if (newMode !== prev.mode || predictionActive !== prev.predictionActive) {
        // NEW: Track mode switches
        const switchEvent = {
          timestamp: new Date().toISOString(),
          from: prev.mode,
          to: newMode
        };

        return {
          ...prev,
          mode: newMode,
          predictionActive,
          switchEvents: [...prev.switchEvents, switchEvent],  // NEW: Record switch
          lastModeSwitch: switchEvent.timestamp  // NEW: Track last switch
        };
      }

      return prev;
    });
  }, [state.gpsSignal, state.gpsPoints.length]);

  /**
   * Start periodic predictions when GPS is lost
   */
  useEffect(() => {
    if (state.predictionActive && state.gpsPoints.length >= 10) {
      if (!predictionIntervalRef.current) {
        predictionIntervalRef.current = window.setInterval(() => {
          runPrediction();
        }, opts.updateInterval);
      }
    } else {
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current);
        predictionIntervalRef.current = null;
      }
    }

    return () => {
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current);
        predictionIntervalRef.current = null;
      }
    };
  }, [state.predictionActive, state.gpsPoints.length, opts.updateInterval, runPrediction]);

  /**
   * Start tracking (use browser Geolocation API)
   */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not available');
      return;
    }

    // Set default mode if not specified
    if (!userModeRef.current) {
      userModeRef.current = 'hybrid';
    }

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        const { latitude, longitude, accuracy } = position.coords;
        addGpsPoint(latitude, longitude, accuracy);
      },
      error => {
        console.error('Geolocation error:', error);
        setState(prev => ({
          ...prev,
          gpsSignal: 'lost'
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    );
  }, [addGpsPoint]);

  /**
   * Stop tracking
   */
  const stopTracking = useCallback(() => {
    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }

    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current);
      predictionIntervalRef.current = null;
    }
  }, []);

  /**
   * Reset tracking state
   */
  const reset = useCallback(() => {
    stopTracking();
    setState({
      mode: 'gps_only',
      gpsSignal: 'good',
      confidence: 'unknown',
      currentPos: null,
      gpsPoints: [],
      predictedPoints: [],
      predictionActive: false,
      gpsLossStart: null,
      accuracy: null,
      gpsPointsCount: 0,  // NEW: Reset count
      aiPointsCount: 0,   // NEW: Reset count
      switchEvents: [],   // NEW: Reset switches
      lastModeSwitch: null,  // NEW: Reset last switch
      avgAiConfidence: 0  // NEW: Reset average
    });
    userModeRef.current = null;
  }, [stopTracking]);

  return {
    state,
    startTracking,
    stopTracking,
    reset,
    addGpsPoint,
    setTrackingMode,
    runPrediction
  };
}
