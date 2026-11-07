import { useEffect, useRef, useState } from 'react'
import type { Store } from '../domain/types'
import { emptyStore } from '../domain/storeSchema'
import { APP_CONFIG } from '../config/appConfig'
import { loadOrMigrateStore, saveCloudStore } from '../data/cloudStore'
import { readStore, writeStore } from '../data/localStore'
import { supabase } from '../data/supabaseClient'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function usePlannerData(userId: string | null) {
  const [store, setStore] = useState<Store>(() => supabase ? emptyStore() : readStore())
  const [storeOwnerId, setStoreOwnerId] = useState(supabase ? '' : 'local')
  const [cloudError, setCloudError] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [retryCount, setRetryCount] = useState(0)
  const saveAttempt = useRef(0)
  const storeReady = !supabase || (!!userId && storeOwnerId === userId)

  useEffect(() => {
    if (!supabase) return
    if (!userId) return
    let alive = true
    void loadOrMigrateStore(userId).then((loadedStore) => {
      if (!alive) return
      setStore(loadedStore)
      setStoreOwnerId(userId)
    }).catch((error: unknown) => {
      if (!alive) return
      setCloudError(error instanceof Error ? error.message : 'Не удалось загрузить данные из облака.')
      setSaveState('error')
    })
    return () => { alive = false }
  }, [userId, retryCount])

  useEffect(() => {
    const attempt = ++saveAttempt.current
    if (!storeReady) return
    if (!supabase) {
      try { writeStore(store) }
      catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось сохранить данные в этом браузере.'
        queueMicrotask(() => { if (attempt === saveAttempt.current) { setSaveState('error'); setCloudError(message) } })
      }
      return
    }
    if (!userId) return
    const timeout = window.setTimeout(() => {
      setSaveState('saving')
      void saveCloudStore(userId, store).then(() => {
        if (attempt !== saveAttempt.current) return
        setCloudError('')
        setSaveState('saved')
      }).catch((error: unknown) => {
        if (attempt !== saveAttempt.current) return
        setCloudError(error instanceof Error ? `Не удалось сохранить данные: ${error.message}` : 'Не удалось сохранить данные в облаке.')
        setSaveState('error')
      })
    }, APP_CONFIG.persistence.autosaveDelayMs)
    return () => window.clearTimeout(timeout)
  }, [store, storeReady, userId])

  return {
    store,
    setStore,
    storeReady,
    cloudError,
    setCloudError,
    saveState,
    retryCloudLoad: () => setRetryCount((count) => count + 1),
  }
}
