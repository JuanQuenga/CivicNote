import type { CivicAlert } from "@/lib/service"

const DATABASE_NAME = "civicnote-offline"
const DATABASE_VERSION = 1
const FEED_STORE = "feeds"
const DETAIL_STORE = "alertDetails"

export type CachedAlertFeed = {
  key: string
  alerts: Array<CivicAlert>
  fetchedAt: number
}

type CachedAlertDetail = {
  key: string
  event: unknown
  fetchedAt: number
}

export async function readAlertFeed(
  key: string
): Promise<CachedAlertFeed | null> {
  const database = await openDatabase()
  if (!database) return null

  try {
    const transaction = database.transaction(FEED_STORE, "readonly")
    const result = await requestToPromise<CachedAlertFeed | undefined>(
      transaction.objectStore(FEED_STORE).get(key)
    )
    return result ?? null
  } catch {
    return null
  } finally {
    database.close()
  }
}

export async function writeAlertFeed(feed: CachedAlertFeed): Promise<void> {
  const database = await openDatabase()
  if (!database) return

  try {
    const transaction = database.transaction(FEED_STORE, "readwrite")
    transaction.objectStore(FEED_STORE).put(feed)
    await transactionDone(transaction)
  } catch {
    // Cached civic data is an enhancement; a blocked store must not break the feed.
  } finally {
    database.close()
  }
}

export async function readAlertDetail(key: string): Promise<unknown | null> {
  const database = await openDatabase()
  if (!database) return null

  try {
    const transaction = database.transaction(DETAIL_STORE, "readonly")
    const result = await requestToPromise<CachedAlertDetail | undefined>(
      transaction.objectStore(DETAIL_STORE).get(key)
    )
    return result?.event ?? null
  } catch {
    return null
  } finally {
    database.close()
  }
}

export async function writeAlertDetail(
  key: string,
  event: unknown
): Promise<void> {
  const database = await openDatabase()
  if (!database) return

  try {
    const transaction = database.transaction(DETAIL_STORE, "readwrite")
    transaction.objectStore(DETAIL_STORE).put({
      key,
      event,
      fetchedAt: Date.now(),
    } satisfies CachedAlertDetail)
    await transactionDone(transaction)
  } catch {
    // Detail caching is best-effort and must not block a verified network result.
  } finally {
    database.close()
  }
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null)

  return new Promise((resolve) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(FEED_STORE)) {
        database.createObjectStore(FEED_STORE, { keyPath: "key" })
      }
      if (!database.objectStoreNames.contains(DETAIL_STORE)) {
        database.createObjectStore(DETAIL_STORE, { keyPath: "key" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
    request.onblocked = () => resolve(null)
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}
