import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import type { RecordingStatus } from '../hooks/useGPS';

interface Props {
  status: RecordingStatus;
  onStart: () => void;
  onAttemptStart?: () => void;
  onRecordAnyway?: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  startDisabled?: boolean;
  onOpenSessions?: () => void;
}

export function Controls({ status, onStart, onAttemptStart, onRecordAnyway, onPause, onResume, onStop, onReset, startDisabled, onOpenSessions }: Props) {
  return (
    <div className="flex gap-3 items-center justify-center">
      {status === 'idle' && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (startDisabled) {
                onAttemptStart && onAttemptStart();
              } else {
                onStart();
              }
            }}
            aria-disabled={!!startDisabled}
            className={`flex items-center gap-2 font-bold px-8 py-4 rounded-2xl transition-all duration-200 active:scale-95 text-base ${
              startDisabled
                ? 'bg-slate-300 text-slate-600 shadow-none'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/40'
            }`}
          >
            <Play size={20} fill="white" />
            Start Recording
          </button>

          {startDisabled && onRecordAnyway && (
            <button
              onClick={onRecordAnyway}
              className="flex items-center gap-2 font-bold px-6 py-4 rounded-2xl transition-all duration-200 active:scale-95 text-base
                bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/40"
            >
              Record Anyway
            </button>
          )}

          {/* Start helper moved to Dashboard */}
        </div>
      )}

      {status === 'recording' && (
        <>
          <button
            onClick={onPause}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold
              px-6 py-4 rounded-2xl shadow-lg shadow-amber-500/30 transition-all duration-200 active:scale-95"
          >
            <Pause size={18} fill="white" />
            Pause
          </button>
          <button
            onClick={onStop}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white font-bold
              px-6 py-4 rounded-2xl shadow-lg shadow-red-500/30 transition-all duration-200 active:scale-95"
          >
            <Square size={18} fill="white" />
            Stop
          </button>
        </>
      )}

      {status === 'paused' && (
        <>
          <button
            onClick={onResume}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold
              px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all duration-200 active:scale-95"
          >
            <Play size={18} fill="white" />
            Resume
          </button>
          <button
            onClick={onStop}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white font-bold
              px-6 py-4 rounded-2xl shadow-lg shadow-red-500/30 transition-all duration-200 active:scale-95"
          >
            <Square size={18} fill="white" />
            Stop
          </button>
        </>
      )}

      {status === 'stopped' && (
        <button
          onClick={onReset}
          className="flex items-center gap-2 bg-slate-500 hover:bg-slate-400 text-white font-bold
            px-6 py-4 rounded-2xl transition-all duration-200 active:scale-95"
        >
          <RotateCcw size={18} />
          New Session
        </button>
      )}

      {onOpenSessions && (
        <button
          onClick={onOpenSessions}
          className="absolute right-4 bottom-4 text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-700 dark:text-slate-300 border border-white/10"
        >
          Sessions
        </button>
      )}
    </div>
  );
}
