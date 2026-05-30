import { useCallback } from 'react';
import { useStorage, StoredSession } from './useStorage';

export function useSessions() {
  const { loadAll, createSession, deleteSession, renameSession, clearSessionPoints } = useStorage();

  const list = useCallback(() => loadAll(), [loadAll]);

  const create = useCallback((name?: string, mode?: string) => createSession(name, mode), [createSession]);

  const remove = useCallback((id: string) => deleteSession(id), [deleteSession]);

  const rename = useCallback((id: string, name?: string) => renameSession(id, name), [renameSession]);

  const clearPoints = useCallback((id: string) => clearSessionPoints(id), [clearSessionPoints]);

  return { list, create, remove, rename, clearPoints };
}

export type Session = StoredSession;
