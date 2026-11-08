import type { JobPhoto } from '../types'

const DB_NAME = 'fielddesk-photos'
const DB_VERSION = 1
const STORE = 'photos'
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024
export const MAX_PHOTOS_PER_JOB = 8

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment.'))
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
}

export async function savePhotoBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ id, blob })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Failed to save photo'))
  })
  db.close()
}

export async function getPhotoBlob(id: string): Promise<Blob | null> {
  const db = await openDb()
  const result = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => {
      const row = req.result as { id: string; blob: Blob } | undefined
      resolve(row?.blob ?? null)
    }
    req.onerror = () => reject(req.error ?? new Error('Failed to read photo'))
  })
  db.close()
  return result
}

export async function deletePhotoBlob(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Failed to delete photo'))
  })
  db.close()
}

export async function clearAllPhotoBlobs(): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Failed to clear photos'))
  })
  db.close()
}

export function validatePhotoFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Only image files are supported.'
  if (file.size > MAX_PHOTO_BYTES) return `Images must be under ${MAX_PHOTO_BYTES / (1024 * 1024)}MB.`
  return null
}

export function canAddPhoto(meta: JobPhoto[], jobId: string): string | null {
  const count = meta.filter((p) => p.jobId === jobId).length
  if (count >= MAX_PHOTOS_PER_JOB) return `Maximum ${MAX_PHOTOS_PER_JOB} photos per job.`
  return null
}
