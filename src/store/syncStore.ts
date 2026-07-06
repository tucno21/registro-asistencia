import { create } from 'zustand'
import {
  getLocalSyncData,
  replaceLocalSyncData,
  mergeSyncData,
  normalizeRemoteData,
  type SyncData,
} from '../db/syncRepository'

const SCRIPT_URL_KEY = 'google_script_url'
const LAST_SYNC_KEY = 'google_last_sync'
const AUTO_SYNC_KEY = 'google_auto_sync_min'

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success'

interface SyncState {
  scriptUrl: string
  status: SyncStatus
  lastSync: string | null
  autoSyncMin: number
  errorMsg: string | null
  setScriptUrl: (url: string) => void
  clearScriptUrl: () => void
  setAutoSyncMin: (min: number) => void
  syncNow: () => Promise<boolean>
  restoreConfig: () => void
}

let autoSyncTimer: ReturnType<typeof setInterval> | null = null

function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLS(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function removeLS(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

async function fetchFromSheets(
  scriptUrl: string,
  payload: Record<string, unknown>,
): Promise<SyncData> {
  const res = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  const json = await res.json()
  if (!json.success) {
    throw new Error(json.error || 'Error desconocido')
  }
  return json.data as SyncData
}

export const useSyncStore = create<SyncState>((set, get) => ({
  scriptUrl: '',
  status: 'idle',
  lastSync: null,
  autoSyncMin: 0,
  errorMsg: null,

  setScriptUrl: (url) => {
    writeLS(SCRIPT_URL_KEY, url)
    set({ scriptUrl: url })
  },

  clearScriptUrl: () => {
    removeLS(SCRIPT_URL_KEY)
    removeLS(LAST_SYNC_KEY)
    set({ scriptUrl: '', lastSync: null })
    if (autoSyncTimer) {
      clearInterval(autoSyncTimer)
      autoSyncTimer = null
    }
  },

  setAutoSyncMin: (min) => {
    writeLS(AUTO_SYNC_KEY, String(min))
    set({ autoSyncMin: min })
    if (autoSyncTimer) {
      clearInterval(autoSyncTimer)
      autoSyncTimer = null
    }
    if (min > 0 && get().scriptUrl) {
      autoSyncTimer = setInterval(() => {
        void get().syncNow()
      }, min * 60 * 1000)
    }
  },

  syncNow: async () => {
    const { scriptUrl } = get()
    if (!scriptUrl) {
      set({ errorMsg: 'No hay URL configurada' })
      return false
    }

    set({ status: 'syncing', errorMsg: null })

    try {
      const local = await getLocalSyncData()

      const remoteRaw = await fetchFromSheets(scriptUrl, { action: 'read' })
      const remote = normalizeRemoteData(remoteRaw)

      const merged = mergeSyncData(local, remote)

      await fetchFromSheets(scriptUrl, { action: 'write', data: merged })

      await replaceLocalSyncData(merged)

      const now = new Date().toISOString()
      writeLS(LAST_SYNC_KEY, now)
      set({ status: 'success', lastSync: now })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de conexión'
      set({ status: 'error', errorMsg: msg })
      return false
    }
  },

  restoreConfig: () => {
    const url = readLS(SCRIPT_URL_KEY) ?? ''
    const last = readLS(LAST_SYNC_KEY)
    const autoMin = Number(readLS(AUTO_SYNC_KEY) ?? '0') || 0
    set({ scriptUrl: url, lastSync: last, autoSyncMin: autoMin })
    if (autoMin > 0 && url) {
      if (autoSyncTimer) clearInterval(autoSyncTimer)
      autoSyncTimer = setInterval(() => {
        void get().syncNow()
      }, autoMin * 60 * 1000)
    }
  },
}))
