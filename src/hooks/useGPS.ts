import { useState, useRef, useCallback, useEffect } from 'react';
import { haversineDistance, calculateHeading, generateSessionId } from '../lib/utils';
import type { GpsPoint, MovementMode } from '../lib/utils';
import { useStorage } from './useStorage';

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

const MIN_INTERVAL_MS = 1000;
const MAX_ACCEPTABLE_ACCURACY = 20; // meters - points with accuracy > this are ignored
const MIN_SPEED_MPS = 0.5; // meters per second
const SMALL_STEP_THRESHOLD = 0.5; // meters - ignore sub-meter jitter
const MAX_STEP_DISTANCE = 20; // meters - ignore spikes larger than this

export function useGPS() {
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [mode, setMode] = useState<MovementMode>('walking');
  const [currentPos, setCurrentPos] = useState<{ lat: number; lon: number } | null>(null);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const accuracyIntervalRef = useRef<number | null>(null);
  const lastPointRef = useRef<GpsPoint | null>(null);
  const smoothingBufferRef = useRef<Array<{ lat: number; lon: number }>>([]);
  const lastAvgRef = useRef<{ lat: number; lon: number } | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(generateSessionId());
  const startedAtRef = useRef<string>('');
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const accDistRef = useRef<number>(0);
  const pointsRef = useRef<GpsPoint[]>([]);

  const { savePoints, clearAll, clearSessionPoints } = useStorage();
  // allow external session control
  const setSession = useCallback((sessionId: string) => {
    sessionIdRef.current = sessionId;
  }, []);

  // keep pointsRef in sync for callbacks
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePosition = useCallback(
    (pos: GeolocationPosition) => {
      const { latitude, longitude, speed, accuracy } = pos.coords;
      setCurrentAccuracy(accuracy);
      setCurrentPos({ lat: latitude, lon: longitude });

      // Ignore low-accuracy fixes entirely but keep accuracy state for warning
      if (accuracy > MAX_ACCEPTABLE_ACCURACY) return;

      const now = Date.now();
      const timeDiff = now - lastSaveTimeRef.current;

      // Add this raw point to smoothing buffer
      const buf = smoothingBufferRef.current;
      buf.push({ lat: latitude, lon: longitude });
      if (buf.length > 3) buf.shift();

      // compute averaged (smoothed) position from last up to 3 points
      const avg = buf.reduce(
        (acc, p) => ({ lat: acc.lat + p.lat, lon: acc.lon + p.lon }),
        { lat: 0, lon: 0 }
      );
      const avgCount = buf.length || 1;
      const avgLat = avg.lat / avgCount;
      const avgLon = avg.lon / avgCount;

      // distance & heading computed from last averaged position
      let distFromLast = 0;
      let heading = 0;
      const lastAvg = lastAvgRef.current;
      if (lastAvg) {
        distFromLast = haversineDistance(lastAvg.lat, lastAvg.lon, avgLat, avgLon);
        heading = calculateHeading(lastAvg.lat, lastAvg.lon, avgLat, avgLon);
      }

      // Ignore obvious GPS jumps/spikes
      if (lastAvg && distFromLast > MAX_STEP_DISTANCE) return;

      const computedSpeed = speed != null ? speed : lastAvg && timeDiff > 0 ? distFromLast / (timeDiff / 1000) : 0;

      const shouldSave =
        !lastAvg ||
        // save small meaningful steps (above jitter) but below jump threshold
        (distFromLast >= SMALL_STEP_THRESHOLD && distFromLast <= MAX_STEP_DISTANCE) ||
        // or save periodically if there's measurable speed
        (timeDiff >= MIN_INTERVAL_MS && computedSpeed > MIN_SPEED_MPS);

      if (!shouldSave) return;

      const mps = computedSpeed;

      // Movement status: moving if speed > MIN_SPEED_MPS or if the step distance indicates movement
      const moving = mps > MIN_SPEED_MPS || distFromLast >= SMALL_STEP_THRESHOLD;
      setCurrentSpeed(moving ? mps : 0);

      const point: GpsPoint = {
        lat: parseFloat(avgLat.toFixed(7)),
        lon: parseFloat(avgLon.toFixed(7)),
        timestamp: new Date().toISOString(),
        speed: parseFloat((moving ? mps : 0).toFixed(2)),
        heading: parseFloat(heading.toFixed(1)),
        mode,
      };

      lastPointRef.current = point;
      lastAvgRef.current = { lat: avgLat, lon: avgLon };
      lastSaveTimeRef.current = now;

      // Accumulate distance while moving. Ignore sub-meter noise and GPS jumps.
      if (
        lastAvg &&
        moving &&
        distFromLast >= SMALL_STEP_THRESHOLD &&
        distFromLast <= MAX_STEP_DISTANCE
      ) {
        accDistRef.current += distFromLast;
        setTotalDistance(accDistRef.current);
      }

      setPoints((prev) => {
        const next = [...prev, point];
        savePoints(next, sessionIdRef.current, mode, startedAtRef.current);
        return next;
      });
    },
    [mode, savePoints]
  );

  const requestPermission = useCallback(async (): Promise<number | null> => {
    setError(null);
    try {
      const accuracy = await new Promise<number>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve(p.coords.accuracy),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
      setPermissionGranted(true);
      setCurrentAccuracy(accuracy);
      // start polling accuracy every second
      if (accuracyIntervalRef.current) window.clearInterval(accuracyIntervalRef.current);
      accuracyIntervalRef.current = window.setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (p) => {
            setCurrentAccuracy(p.coords.accuracy);
            setCurrentPos({ lat: p.coords.latitude, lon: p.coords.longitude });
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
      }, 1000);
      return accuracy;
    } catch (err) {
      const geoError = err as GeolocationPositionError;
      if (geoError.code === 1) {
        setError('Location permission denied. Please allow location access.');
      } else {
        setError('Unable to get location. Ensure GPS is enabled.');
      }
      return null;
    }
  }, []);

  const startRecording = useCallback((force = false) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    // only allow starting when accuracy is acceptable (<= MAX_ACCEPTABLE_ACCURACY) unless forced
    if (!force && currentAccuracy != null && currentAccuracy > MAX_ACCEPTABLE_ACCURACY) {
      setError('Cannot start recording: poor GPS accuracy. Move outside or enable precise location.');
      return;
    }

    sessionIdRef.current = generateSessionId();
    startedAtRef.current = new Date().toISOString();
    startTimeRef.current = Date.now();
    lastPointRef.current = null;
    smoothingBufferRef.current = [];
    lastAvgRef.current = null;
    lastSaveTimeRef.current = 0;
    accDistRef.current = 0;
    setPoints([]);
    setTotalDistance(0);
    setDuration(0);
    setError(null);
    setStatus('recording');
    setPermissionGranted(true);
    startTimer();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPermissionGranted(true);
        handlePosition(pos);
      },
      (err) => {
        if (err.code === 1) setError('Location permission denied.');
        else setError('Location error: ' + err.message);
        setStatus('idle');
        stopTimer();
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }, [handlePosition, startTimer]);

  const pauseRecording = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    stopTimer();
    setStatus('paused');
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    startTimeRef.current = Date.now() - duration * 1000;
    setStatus('recording');
    startTimer();
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => { setError('Location error: ' + err.message); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }, [handlePosition, startTimer, duration]);

  const stopRecording = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    stopTimer();
    setStatus('stopped');
  }, [stopTimer]);

  const resetRecording = useCallback(() => {
    stopRecording();
    // only clear points for the current session to avoid wiping all stored sessions
    try {
      clearSessionPoints(sessionIdRef.current);
    } catch {
      // fallback to clearing all if the storage implementation fails
      clearAll();
    }
    setPoints([]);
    setTotalDistance(0);
    setDuration(0);
    setCurrentSpeed(0);
    setCurrentPos(null);
    smoothingBufferRef.current = [];
    lastAvgRef.current = null;
    accDistRef.current = 0;
    setStatus('idle');
  }, [stopRecording, clearAll, clearSessionPoints]);

  const savePointsToSession = useCallback((targetSessionId: string) => {
    savePoints(pointsRef.current, targetSessionId, mode, startedAtRef.current);
  }, [savePoints, mode]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      stopTimer();
      if (accuracyIntervalRef.current) window.clearInterval(accuracyIntervalRef.current);
    };
  }, [stopTimer]);

  return {
    points,
    status,
    mode,
    setMode,
    currentPos,
    currentSpeed,
    totalDistance,
    duration,
    error,
    permissionGranted,
    sessionId: sessionIdRef.current,
    setSession,
    startedAt: startedAtRef.current,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    savePointsToSession,
    currentAccuracy,
  };
}
