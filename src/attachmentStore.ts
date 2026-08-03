import { APP_MODE } from './appMode'
import type { WorkPageAttachment, WorkPageAttachmentSource } from './types'

const DB_NAME = `vfx-flow-attachments.${APP_MODE.target}.v1`
const STORE_NAME = 'attachments'
const DB_VERSION = 1

const canUseIndexedDb = () => typeof indexedDB !== 'undefined'

const openDatabase = (): Promise<IDBDatabase | null> => new Promise((resolve, reject) => {
  if (!canUseIndexedDb()) { resolve(null); return }
  const request = indexedDB.open(DB_NAME, DB_VERSION)
  request.onupgradeneeded = () => {
    const database = request.result
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      store.createIndex('taskId', 'taskId', { unique: false })
      store.createIndex('updatedAt', 'updatedAt', { unique: false })
    }
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error ?? new Error('IndexedDB is unavailable'))
})

const requestResult = <T>(request: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
})

export const putAttachment = async (attachment: WorkPageAttachment): Promise<void> => {
  const database = await openDatabase()
  if (!database) throw new Error('This browser does not provide IndexedDB.')
  await requestResult(database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(attachment))
  database.close()
}

export const getAttachment = async (id: string): Promise<WorkPageAttachment | undefined> => {
  const database = await openDatabase()
  if (!database) return undefined
  const result = await requestResult(database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id))
  database.close()
  return result as WorkPageAttachment | undefined
}

export const listAttachments = async (taskId?: string): Promise<WorkPageAttachment[]> => {
  const database = await openDatabase()
  if (!database) return []
  const transaction = database.transaction(STORE_NAME, 'readonly')
  const request = taskId ? transaction.objectStore(STORE_NAME).index('taskId').getAll(taskId) : transaction.objectStore(STORE_NAME).getAll()
  const result = await requestResult(request)
  database.close()
  return result as WorkPageAttachment[]
}

export const deleteAttachment = async (id: string): Promise<void> => {
  const database = await openDatabase()
  if (!database) return
  await requestResult(database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id))
  database.close()
}

export const estimateAttachmentStorage = async (): Promise<number | undefined> => {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return undefined
  const estimate = await navigator.storage.estimate()
  return estimate.usage
}

export const makeAttachment = (taskId: string, file: Blob, source: WorkPageAttachmentSource, metadata: Partial<Pick<WorkPageAttachment, 'fileName' | 'width' | 'height' | 'caption' | 'altText'>> = {}): WorkPageAttachment => {
  const timestamp = new Date().toISOString()
  return {
    id: `attachment-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36).slice(-5)}`,
    taskId,
    fileName: metadata.fileName ?? `vfx-capture-${timestamp.replace(/[:.]/g, '-')}.${file.type.split('/')[1] ?? 'bin'}`,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
    width: metadata.width,
    height: metadata.height,
    createdAt: timestamp,
    updatedAt: timestamp,
    source,
    blob: file,
    caption: metadata.caption,
    altText: metadata.altText,
  }
}
