import type { Store } from '../domain/types'
import { readStore } from './localStore'
import { migrateLocalProjectImages } from './projectImages'
import { supabase } from './supabaseClient'
import { decodeStore, encodeStore, emptyStore } from '../domain/storeSchema'

const saveQueues = new Map<string, Promise<void>>()

export async function loadOrMigrateStore(userId: string): Promise<Store> {
  if (!supabase) throw new Error('Supabase не настроен')
  const { data, error } = await supabase.from('planner_data').select('data').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (data?.data) return decodeStore(data.data)

  const localStore = readStore()
  await migrateLocalProjectImages(userId, localStore)
  await saveCloudStore(userId, localStore)
  return localStore
}

async function writeCloudStore(userId: string, store: Store) {
  if (!supabase) throw new Error('Supabase не настроен')
  const { error } = await supabase.from('planner_data').upsert({ user_id: userId, data: encodeStore(store), updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}

export function saveCloudStore(userId: string, store: Store): Promise<void> {
  const previous = saveQueues.get(userId) ?? Promise.resolve()
  const next = previous.catch(() => undefined).then(() => writeCloudStore(userId, structuredClone(store)))
  saveQueues.set(userId, next)
  void next.finally(() => { if (saveQueues.get(userId) === next) saveQueues.delete(userId) }).catch(() => undefined)
  return next
}

export { emptyStore }
