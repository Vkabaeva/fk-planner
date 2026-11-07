import { STORAGE_KEY } from '../domain/constants'
import type { Store } from '../domain/types'
import { decodeStore, encodeStore, emptyStore } from '../domain/storeSchema'

const INVALID_BACKUP_KEY = `${STORAGE_KEY}-invalid-backup`

export function readStore(): Store {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
    return raw ? decodeStore(JSON.parse(raw)) : emptyStore()
  } catch (error) {
    if (raw) {
      try { localStorage.setItem(INVALID_BACKUP_KEY, raw) } catch { /* Preserve the original value when storage is unavailable. */ }
    }
    console.error('Локальные данные не прошли проверку; исходная копия сохранена.', error)
    return emptyStore()
  }
}

export function writeStore(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encodeStore(store)))
}
