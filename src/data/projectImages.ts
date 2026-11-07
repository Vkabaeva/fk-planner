import { PROJECT_IMAGES_BUCKET, supabase } from './supabaseClient'

const DATABASE_NAME = 'fk-planner-media-v1'
const STORE_NAME = 'project-images'

let databasePromise: Promise<IDBDatabase> | undefined

function openDatabase() {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 1)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME)
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Не удалось открыть хранилище изображений'))
    })
  }
  return databasePromise
}

function runTransaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore, resolveValue: (value: T) => void) => void) {
  return openDatabase().then((database) => new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    let result: T
    operation(transaction.objectStore(STORE_NAME), (value) => { result = value })
    transaction.oncomplete = () => resolve(result)
    transaction.onerror = () => reject(transaction.error ?? new Error('Не удалось сохранить изображение'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Операция с изображением отменена'))
  }))
}

export async function saveProjectImage(id: string, image: Blob, userId?: string) {
  if (userId && supabase) {
    const { error } = await supabase.storage.from(PROJECT_IMAGES_BUCKET).upload(`${userId}/${id}`, image, { contentType: image.type || 'application/octet-stream', upsert: true })
    if (error) throw error
    return
  }
  return runTransaction<void>('readwrite', (store, resolveValue) => {
    const request = store.put(image, id)
    request.onsuccess = () => resolveValue(undefined)
  })
}

export async function loadProjectImage(id: string, userId?: string) {
  if (userId && supabase) {
    const { data, error } = await supabase.storage.from(PROJECT_IMAGES_BUCKET).download(`${userId}/${id}`)
    if (error) throw error
    return data
  }
  return runTransaction<Blob | undefined>('readonly', (store, resolveValue) => {
    const request = store.get(id)
    request.onsuccess = () => resolveValue(request.result as Blob | undefined)
  })
}

export async function deleteProjectImage(id: string, userId?: string) {
  if (userId && supabase) {
    const { error } = await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove([`${userId}/${id}`])
    if (error) throw error
    return
  }
  return runTransaction<void>('readwrite', (store, resolveValue) => {
    const request = store.delete(id)
    request.onsuccess = () => resolveValue(undefined)
  })
}

export async function migrateLocalProjectImages(userId: string, store: { projects: { attachments?: { id: string }[] }[] }) {
  if (!supabase) return
  for (const project of store.projects) {
    for (const attachment of project.attachments ?? []) {
      const image = await runTransaction<Blob | undefined>('readonly', (objectStore, resolveValue) => {
        const request = objectStore.get(attachment.id)
        request.onsuccess = () => resolveValue(request.result as Blob | undefined)
      })
      if (!image) throw new Error('Не удалось найти одно из локально сохранённых изображений. Данные не перенесены, локальная копия осталась на месте.')
      await saveProjectImage(attachment.id, image, userId)
    }
  }
}

export async function deleteProjectImages(attachments: { id: string }[], userId?: string) {
  const results = await Promise.allSettled(attachments.map((attachment) => deleteProjectImage(attachment.id, userId)))
  const failedCount = results.filter((result) => result.status === 'rejected').length
  if (failedCount) throw new Error(`Не удалось удалить вложения: ${failedCount}`)
}
