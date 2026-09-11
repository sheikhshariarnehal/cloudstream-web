import Dexie, { type Table } from 'dexie'
import type { BookmarkItem, WatchProgressItem } from '../types/media'

export class CloudStreamDB extends Dexie {
  progress!: Table<WatchProgressItem, string>
  bookmarks!: Table<BookmarkItem, string>

  constructor() {
    super('CloudStreamWebDB')
    this.version(1).stores({
      progress: 'id, mediaUrl, apiName, updatedAt',
      bookmarks: 'url, status, apiName, updatedAt'
    })
  }
}

export const db = new CloudStreamDB()

export async function saveWatchProgress(item: WatchProgressItem): Promise<void> {
  await db.progress.put(item)
}

export async function getWatchProgress(id: string): Promise<WatchProgressItem | undefined> {
  return await db.progress.get(id)
}

export async function getAllContinueWatching(): Promise<WatchProgressItem[]> {
  return await db.progress.orderBy('updatedAt').reverse().toArray()
}

export async function saveBookmark(item: BookmarkItem): Promise<void> {
  await db.bookmarks.put(item)
}

export async function removeBookmark(url: string): Promise<void> {
  await db.bookmarks.delete(url)
}

export async function getBookmarksByStatus(status?: string): Promise<BookmarkItem[]> {
  if (status) {
    return await db.bookmarks.where('status').equals(status).reverse().sortBy('updatedAt')
  }
  return await db.bookmarks.orderBy('updatedAt').reverse().toArray()
}

export async function exportBackupJson(): Promise<string> {
  const progress = await db.progress.toArray()
  const bookmarks = await db.bookmarks.toArray()
  return JSON.stringify({ version: 1, exportedAt: Date.now(), progress, bookmarks }, null, 2)
}

export async function importBackupJson(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString)
    if (Array.isArray(data.progress)) {
      await db.progress.bulkPut(data.progress)
    }
    if (Array.isArray(data.bookmarks)) {
      await db.bookmarks.bulkPut(data.bookmarks)
    }
    return true
  } catch (e) {
    console.error('Failed importing backup', e)
    return false
  }
}
