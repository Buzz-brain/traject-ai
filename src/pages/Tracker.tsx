import { useState } from 'react';
import { AlertTriangle, ArrowLeft, Lock, CheckCircle, XCircle } from 'lucide-react';
import { Header } from '../components/Header';
import { ModeSelector } from '../components/ModeSelector';
import { Controls } from '../components/Controls';
import { Dashboard } from '../components/Dashboard';
import { MapView } from '../components/MapView';
import { ExportPanel } from '../components/ExportPanel';
import { useGPS } from '../hooks/useGPS';
import type { MovementMode } from '../lib/utils';
import { haversineDistance } from '../lib/utils';
import { X, RefreshCw, Info, PlusCircle, Trash2, Edit3 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useSessions } from '../hooks/useSessions';
import { useStorage } from '../hooks/useStorage';
import { UPLOAD_URL } from '../lib/supabase';

interface Props {
  isDark: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
}

export function Tracker({ isDark, onToggleTheme, onBack }: Props) {
  const [showExport, setShowExport] = useState(false);
  const gps = useGPS();

  const isActive = gps.status === 'recording' || gps.status === 'paused';
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [countdown, setCountdown] = useState<number>(10);
  const [countdownActive, setCountdownActive] = useState(false);
  const countdownRef = useRef<number | null>(null);

  const sessions = useSessions();
  const storage = useStorage();

  useEffect(() => {
    const list = sessions.list();
    if (!list || list.length === 0) {
      const s = sessions.create(`Session ${new Date().toISOString().slice(0, 19)}`);
      setSelectedSession(s.sessionId);
      gps.setSession(s.sessionId);
      setSessionsList(sessions.list());
    } else {
      setSessionsList(list);
      setSelectedSession(list[0].sessionId);
      gps.setSession(list[0].sessionId);
    }
  }, []);

  const explainDisabled = () => {
    setModalMessage(
      'Cannot start recording because GPS accuracy is poor. Go outside or enable precise/high-accuracy location in your device settings.'
    );
    setShowAccuracyModal(true);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUploadToDb = async (sessionId: string, points: any[]) => {
    if (points.length === 0) return;
    try {
      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          mode: gps.mode,
          points,
          total_distance: gps.totalDistance,
          duration_seconds: gps.duration,
          started_at: gps.startedAt,
          completed_at: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      showToast('success', `${data.points_count} points saved to database!`);
    } catch (err) {
      showToast('error', `Failed to save: ${String(err)}`);
    }
  };

  const cancelCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current as number);
      countdownRef.current = null;
    }
    setCountdownActive(false);
    setCountdown(10);
  };

  const startRecordingWithCountdown = async (force = false) => {
    // request permission first
    const acc = await gps.requestPermission();
    if (!force && acc != null && acc > 50) {
      explainDisabled();
      return;
    }
    setCountdown(10);
    setCountdownActive(true);

    countdownRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current as number);
            countdownRef.current = null;
          }
          setCountdownActive(false);
          gps.startRecording();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current as number);
        countdownRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="glass-card mx-3 mt-3 rounded-2xl">
        <div className="flex items-center gap-2 px-4 pt-3">
          <button
            onClick={onBack}
            className="w-7 h-7 flex items-center justify-center rounded-lg
              bg-white/20 dark:bg-white/10 hover:bg-white/30 transition-all"
          >
            <ArrowLeft size={14} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex-1">
            <Header isDark={isDark} onToggleTheme={onToggleTheme} status={gps.status} />
          </div>
        </div>
      </div>

      {/* Permission / Error Banner */}
      {gps.error && (
        <div className="mx-3 mt-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/20
          border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400
          text-xs font-medium px-4 py-2.5 rounded-xl">
          <AlertTriangle size={14} />
          {gps.error}
        </div>
      )}

      {/* Permission Request */}
      {!gps.permissionGranted && gps.status === 'idle' && (
        <div className="mx-3 mt-2 glass-card rounded-2xl p-4 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto">
            <Lock size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Location Access Required</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Allow location access to begin recording your GPS trajectory.
            </p>
          </div>
          <button
            onClick={gps.requestPermission}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold
              py-3 rounded-xl transition-all duration-200 active:scale-95 shadow-sm shadow-emerald-500/30"
          >
            Allow Location Access
          </button>
        </div>
      )}

      {/* Mode Selector */}
      <div className="mx-3 mt-2 glass-card rounded-2xl p-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Movement Mode</p>
        <ModeSelector
          value={gps.mode}
          onChange={(m: MovementMode) => gps.setMode(m)}
          disabled={isActive}
        />
      </div>

      {/* Map */}
      <div className="mx-3 mt-2 glass-card rounded-2xl overflow-hidden flex-1 relative" style={{ minHeight: 260 }}>
        <MapView points={gps.points} currentPos={gps.currentPos} />
        {countdownActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 9999 }}>
            <div className="bg-black/60 text-white rounded-2xl px-6 py-4 text-center pointer-events-auto">
              <div className="text-5xl font-bold tabular-nums">{countdown}</div>
              <div className="text-sm mt-1">Recording starts in</div>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard */}
      <div className="mx-3 mt-2">
        <Dashboard
          pointsCount={gps.points.length}
          totalDistance={gps.totalDistance}
          currentSpeed={gps.currentSpeed}
          duration={gps.duration}
          currentPos={gps.currentPos}
          currentAccuracy={gps.currentAccuracy}
          onExplain={explainDisabled}
        />
      </div>

      {/* Controls */}
      <div className="mx-3 mt-3 glass-card rounded-2xl p-4 relative">
        {/* Current session display */}
        {selectedSession && (
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
            Recording to: <span className="text-emerald-500 dark:text-emerald-300">{sessionsList.find(s => s.sessionId === selectedSession)?.sessionName || 'Untitled Session'}</span>
          </div>
        )}
        <Controls
          status={gps.status}
          onStart={() => {
            // start with countdown (respecting accuracy)
            startRecordingWithCountdown(false);
          }}
          onAttemptStart={() => explainDisabled()}
          onRecordAnyway={() => {
            // force start with countdown ignoring accuracy
            startRecordingWithCountdown(true);
          }}
          onPause={gps.pauseRecording}
          onResume={gps.resumeRecording}
          onStop={() => {
            // cancel any pending countdown
            cancelCountdown();
            // If no session selected and we have points, prompt for session name
            if (!selectedSession && gps.points.length > 0) {
              const sessionName = prompt('Create a session name for this reading:', `Session ${new Date().toISOString().slice(0, 19)}`);
              if (sessionName) {
                const newSession = sessions.create(sessionName, gps.mode);
                setSelectedSession(newSession.sessionId);
                gps.setSession(newSession.sessionId);
                setSessionsList(sessions.list());
                // Save the current points to this new session
                gps.savePointsToSession(newSession.sessionId);
                // Upload to database
                handleUploadToDb(newSession.sessionId, gps.points);
              }
            } else if (selectedSession && gps.points.length > 0) {
              // Upload to database if session is selected
              handleUploadToDb(selectedSession, gps.points);
            }
            gps.stopRecording();
            // Save stoppedAt timestamp to session
            if (selectedSession) {
              const session = storage.loadSession(selectedSession);
              if (session) {
                session.stoppedAt = new Date().toISOString();
                const allSessions = storage.loadAll();
                const updated = allSessions.map(s => s.sessionId === selectedSession ? session : s);
                storage.writeAll(updated);
              }
            }
          }}
          onReset={gps.resetRecording}
          startDisabled={gps.currentAccuracy == null || gps.currentAccuracy > 50}
        />
      </div>

      {/* Sessions floating button (FAB) */}
      <button
        onClick={() => setShowSessionsModal(true)}
        className="fixed right-4 bottom-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30"
        aria-label="Open Sessions"
      >
        <PlusCircle size={18} />
        <span className="hidden sm:inline-block text-sm font-semibold">Sessions</span>
      </button>

      {/* Export Toggle */}
      {gps.points.length > 0 && (
        <div className="mx-3 mt-2">
          <button
            onClick={() => setShowExport((v) => !v)}
            className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400
              hover:text-emerald-500 transition-colors py-1"
          >
            {showExport ? '▲ Hide Export' : '▼ Show Export & Upload'}
          </button>
          {showExport && (
            <div className="mt-2">
              <ExportPanel
                points={gps.points}
                sessionId={gps.sessionId}
                sessionName={sessionsList.find((s) => s.sessionId === selectedSession)?.sessionName}
                mode={gps.mode}
                totalDistance={gps.totalDistance}
                duration={gps.duration}
                startedAt={gps.startedAt}
                onClear={gps.resetRecording}
                disabled={gps.status === 'recording'}
              />
            </div>
          )}
        </div>
      )}

      <div className="h-6" />

      {/* Accuracy modal */}
      {showAccuracyModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-5 mx-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Info className="text-emerald-500" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Poor GPS Signal</h3>
              </div>
              <button onClick={() => setShowAccuracyModal(false)} className="text-slate-500">
                <X />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">{modalMessage}</p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  // Retry accuracy check
                  gps.requestPermission().then((acc) => {
                    if (acc != null && acc <= 50) {
                      setShowAccuracyModal(false);
                      gps.startRecording();
                    } else {
                      setModalMessage(
                        `Still poor GPS (accuracy: ${acc == null ? 'unknown' : Math.round(acc) + ' m'}). Go outside or enable precise location.`
                      );
                    }
                  });
                }}
                className="flex items-center gap-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-3 py-2 rounded-lg"
              >
                <RefreshCw size={14} />
                Retry
              </button>
              <button onClick={() => setShowAccuracyModal(false)} className="text-sm px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sessions modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-5 mx-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Sessions</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const name = prompt('Session name') || `Session ${new Date().toISOString().slice(0, 19)}`;
                    const s = sessions.create(name);
                    setSessionsList(sessions.list());
                    setSelectedSession(s.sessionId);
                    gps.setSession(s.sessionId);
                  }}
                  className="text-xs px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white"
                >
                  <PlusCircle size={14} /> New
                </button>
                <button onClick={() => setShowSessionsModal(false)} className="text-slate-500">
                  <X />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => {
                    const all = sessions.list();
                    const lines: string[] = ['# All Sessions Export', `# Exported: ${new Date().toISOString()}`, `# Total Sessions: ${all.length}`, ''];
                    const header = ['lat','lon','timestamp','speed','heading','mode','sessionName','accuracy'];
                    lines.push(header.join(','));
                    
                    for (const ss of all) {
                      const pts = ss.points || [];
                      const maxSpeed = pts.length > 0 ? Math.max(...pts.map((p: any) => p.speed || 0)) : 0;
                      const totalDist = pts.length > 1 ? pts.reduce((sum: number, p: any, i: number) => i === 0 ? 0 : sum + (haversineDistance(pts[i-1].lat, pts[i-1].lon, p.lat, p.lon) || 0), 0) : 0;
                      const duration = ss.startedAt && pts.length > 1 ? Math.round((new Date(pts[pts.length - 1].timestamp).getTime() - new Date(pts[0].timestamp).getTime()) / 1000) : 0;
                      const avgSpeed = duration > 0 ? ((totalDist / 1000) / (duration / 3600)) : 0;
                      const startLat = pts.length > 0 ? pts[0].lat : null;
                      const startLon = pts.length > 0 ? pts[0].lon : null;
                      const endLat = pts.length > 0 ? pts[pts.length - 1].lat : null;
                      const endLon = pts.length > 0 ? pts[pts.length - 1].lon : null;
                      
                      lines.push(`# --- Session: ${ss.sessionName || 'Untitled'} ---`);
                      lines.push(`# ID: ${ss.sessionId}`);
                      lines.push(`# Started: ${ss.startedAt || ss.createdAt}`);
                      lines.push(`# Points: ${pts.length}`);
                      lines.push(`# Distance: ${totalDist.toFixed(2)} m`);
                      lines.push(`# Duration: ${duration} s`);
                      lines.push(`# Avg Speed: ${avgSpeed.toFixed(2)} km/h`);
                      lines.push(`# Max Speed: ${maxSpeed.toFixed(2)} km/h`);
                      lines.push(`# Start: ${startLat},${startLon}`);
                      lines.push(`# End: ${endLat},${endLon}`);
                      
                      for (const p of pts) {
                        lines.push([p.lat, p.lon, p.timestamp, p.speed, p.heading, ss.mode || p.mode || '', ss.sessionName || '', (p as any).accuracy ?? ''].join(','));
                      }
                      lines.push('');
                    }
                    
                    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'all_sessions.csv';
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }}
                  className="text-xs px-3 py-2 rounded-lg bg-indigo-500 text-white"
                >
                  Export All CSV
                </button>
                <button
                  onClick={() => {
                    const all = sessions.list();
                    const out = all.map((s) => {
                      const pts = s.points || [];
                      const maxSpeed = pts.length > 0 ? Math.max(...pts.map((p: any) => p.speed || 0)) : 0;
                      const totalDist = pts.length > 1 ? pts.reduce((sum: number, p: any, i: number) => i === 0 ? 0 : sum + (haversineDistance(pts[i-1].lat, pts[i-1].lon, p.lat, p.lon) || 0), 0) : 0;
                      const duration = s.startedAt && pts.length > 1 ? Math.round((new Date(pts[pts.length - 1].timestamp).getTime() - new Date(pts[0].timestamp).getTime()) / 1000) : 0;
                      const avgSpeed = duration > 0 ? ((totalDist / 1000) / (duration / 3600)) : 0;
                      const startLat = pts.length > 0 ? pts[0].lat : null;
                      const startLon = pts.length > 0 ? pts[0].lon : null;
                      const endLat = pts.length > 0 ? pts[pts.length - 1].lat : null;
                      const endLon = pts.length > 0 ? pts[pts.length - 1].lon : null;
                      
                      return {
                        session: {
                          id: s.sessionId,
                          name: s.sessionName || 'Untitled',
                          createdAt: s.createdAt,
                          startedAt: s.startedAt || s.createdAt,
                          stoppedAt: new Date().toISOString(),
                          mode: s.mode || '',
                          totalPoints: pts.length,
                          totalDistance: totalDist,
                          totalDistanceUnit: 'meters',
                          duration: duration,
                          durationUnit: 'seconds',
                          avgSpeed: parseFloat(avgSpeed.toFixed(2)),
                          avgSpeedUnit: 'km/h',
                          maxSpeed: parseFloat(maxSpeed.toFixed(2)),
                          maxSpeedUnit: 'km/h',
                          startLat: startLat,
                          startLon: startLon,
                          endLat: endLat,
                          endLon: endLon,
                          exportedAt: new Date().toISOString(),
                        },
                        points: pts.map((p:any)=>({lat:p.lat,lon:p.lon,timestamp:p.timestamp,speed:p.speed,heading:p.heading,mode:s.mode || p.mode || ''}))
                      };
                    });
                    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'all_sessions.json';
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }}
                  className="text-xs px-3 py-2 rounded-lg bg-indigo-500 text-white"
                >
                  Export All JSON
                </button>
              </div>

              {sessionsList.map((s) => (
                <div key={s.sessionId} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold">{s.sessionName || 'Untitled'}</div>
                      <div className="text-xs text-slate-500">({s.points?.length ?? 0} pts)</div>
                    </div>
                    <div className="text-xs text-slate-400">Created {new Date(s.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const name = prompt('Rename session', s.sessionName || '') ?? s.sessionName;
                        sessions.rename(s.sessionId, name);
                        setSessionsList(sessions.list());
                      }}
                      className="text-xs px-2 py-1 rounded bg-white/5"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm('Delete session and all its readings?')) return;
                        sessions.remove(s.sessionId);
                        const list = sessions.list();
                        setSessionsList(list);
                        if (list.length) {
                          setSelectedSession(list[0].sessionId);
                          gps.setSession(list[0].sessionId);
                        } else {
                          const ns = sessions.create('Session ' + new Date().toISOString().slice(0, 19));
                          setSessionsList(sessions.list());
                          setSelectedSession(ns.sessionId);
                          gps.setSession(ns.sessionId);
                        }
                      }}
                      className="text-xs px-2 py-1 rounded bg-red-50 text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm('Clear readings for this session?')) return;
                        sessions.clearPoints(s.sessionId);
                        setSessionsList(sessions.list());
                      }}
                      className="text-xs px-2 py-1 rounded bg-white/5"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        // export this session CSV with metadata header
                        const pts = s.points || [];
                        const maxSpeed = pts.length > 0 ? Math.max(...pts.map((p: any) => p.speed || 0)) : 0;
                        const totalDist = pts.length > 1 ? pts.reduce((sum: number, p: any, i: number) => i === 0 ? 0 : sum + (haversineDistance(pts[i-1].lat, pts[i-1].lon, p.lat, p.lon) || 0), 0) : 0;
                        const duration = s.startedAt && pts.length > 1 ? Math.round((new Date(pts[pts.length - 1].timestamp).getTime() - new Date(pts[0].timestamp).getTime()) / 1000) : 0;
                        const avgSpeed = duration > 0 ? ((totalDist / 1000) / (duration / 3600)) : 0;
                        const startLat = pts.length > 0 ? pts[0].lat : null;
                        const startLon = pts.length > 0 ? pts[0].lon : null;
                        const endLat = pts.length > 0 ? pts[pts.length - 1].lat : null;
                        const endLon = pts.length > 0 ? pts[pts.length - 1].lon : null;
                        
                        const lines: string[] = [
                          `# Session Export`,
                          `# ID: ${s.sessionId}`,
                          `# Name: ${s.sessionName || 'Untitled'}`,
                          `# Started: ${s.startedAt || s.createdAt}`,
                          `# Stopped: ${s.stoppedAt || new Date().toISOString()}`,
                          `# Points: ${pts.length}`,
                          `# Distance: ${totalDist.toFixed(2)} m`,
                          `# Duration: ${duration} s`,
                          `# Avg Speed: ${avgSpeed.toFixed(2)} km/h`,
                          `# Max Speed: ${maxSpeed.toFixed(2)} km/h`,
                          `# Start: ${startLat},${startLon}`,
                          `# End: ${endLat},${endLon}`,
                          `# Exported: ${new Date().toISOString()}`,
                          ''
                        ];
                        const header = ['lat','lon','timestamp','speed','heading','mode','sessionName','accuracy'];
                        lines.push(header.join(','));
                        for (const p of pts) {
                          lines.push([p.lat, p.lon, p.timestamp, p.speed, p.heading, s.mode || p.mode || '', s.sessionName || '', (p as any).accuracy ?? ''].join(','));
                        }
                        const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = `${(s.sessionName||s.sessionId).toLowerCase().replace(/[^a-z0-9]+/g,'_')}.csv`;
                        a.click();
                        URL.revokeObjectURL(a.href);
                      }}
                      className="text-xs px-2 py-1 rounded bg-white/5"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => {
                        // select this session for recording
                        setSelectedSession(s.sessionId);
                        gps.setSession(s.sessionId);
                        setShowSessionsModal(false);
                      }}
                      className={`text-xs px-3 py-2 rounded-lg ${selectedSession === s.sessionId ? 'bg-emerald-500 text-white' : 'bg-white/5'}`}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-4 right-4 max-w-sm mx-auto z-40 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle size={18} className="flex-shrink-0" />
          ) : (
            <XCircle size={18} className="flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
