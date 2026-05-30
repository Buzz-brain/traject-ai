import { useCallback } from 'react';
import type { GpsPoint } from '../lib/utils';

const STORAGE_KEY = 'naija-gps-sessions';

export interface StoredSession {
  sessionId: string;
  sessionName?: string;
  mode?: string;
  createdAt: string;
  startedAt?: string;
  stoppedAt?: string;
  points: GpsPoint[];
}

function readAll(): StoredSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession[]) : [];
  } catch {
    return [];
  }
}

function writeAll(sessions: StoredSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // ignore storage errors
  }
}

export function useStorage() {
  const savePoints = useCallback((points: GpsPoint[], sessionId: string, mode?: string, startedAt?: string, sessionName?: string) => {
    const sessions = readAll();
    const idx = sessions.findIndex((s) => s.sessionId === sessionId);
    if (idx >= 0) {
      sessions[idx].points = points;
      if (mode) sessions[idx].mode = mode;
      if (startedAt) sessions[idx].startedAt = startedAt;
      if (sessionName) sessions[idx].sessionName = sessionName;
    } else {
      sessions.push({ sessionId, sessionName, mode, startedAt, createdAt: new Date().toISOString(), points });
    }
    writeAll(sessions);
  }, []);

  const loadSession = useCallback((sessionId?: string): StoredSession | null => {
    const sessions = readAll();
    if (!sessionId) return sessions.length ? sessions[0] : null;
    return sessions.find((s) => s.sessionId === sessionId) ?? null;
  }, []);

  const loadAll = useCallback((): StoredSession[] => readAll(), []);

  const createSession = useCallback((sessionName?: string, mode?: string) => {
    const sessions = readAll();
    const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const s: StoredSession = { sessionId, sessionName, mode, createdAt: new Date().toISOString(), points: [] };
    sessions.push(s);
    writeAll(sessions);
    return s;
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    const sessions = readAll().filter((s) => s.sessionId !== sessionId);
    writeAll(sessions);
  }, []);

  const renameSession = useCallback((sessionId: string, sessionName?: string) => {
    const sessions = readAll();
    const s = sessions.find((x) => x.sessionId === sessionId);
    if (s) {
      s.sessionName = sessionName;
      writeAll(sessions);
    }
  }, []);

  const clearSessionPoints = useCallback((sessionId: string) => {
    const sessions = readAll();
    const s = sessions.find((x) => x.sessionId === sessionId);
    if (s) {
      s.points = [];
      writeAll(sessions);
    }
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { savePoints, loadSession, loadAll, createSession, deleteSession, renameSession, clearSessionPoints, clearAll, writeAll };
}
