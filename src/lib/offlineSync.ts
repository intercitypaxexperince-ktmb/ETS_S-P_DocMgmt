/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OfflineSyncQueueItem } from '../types/dms';

const QUEUE_STORAGE_KEY = 'arkadms_offline_sync_queue';
const OFFLINE_DRAFTS_KEY = 'arkadms_offline_drafts';

export function getOfflineQueue(): OfflineSyncQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Gagal membaca giliran luar talian:', e);
    return [];
  }
}

export function addToOfflineQueue(item: Omit<OfflineSyncQueueItem, 'id' | 'timestamp' | 'status'>): OfflineSyncQueueItem {
  const newItem: OfflineSyncQueueItem = {
    ...item,
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    status: 'pending',
  };

  const queue = getOfflineQueue();
  queue.push(newItem);
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Gagal menyimpan ke storan luar talian:', e);
  }
  return newItem;
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch (e) {
    console.error('Gagal mengosongkan giliran luar talian:', e);
  }
}

export function removeOfflineQueueItem(id: string): void {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Gagal mengemas kini giliran luar talian:', e);
  }
}

export function saveOfflineDraft(docId: string, draftData: any): void {
  try {
    const drafts = getOfflineDrafts();
    drafts[docId] = {
      ...draftData,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(drafts));
  } catch (e) {
    console.error('Gagal menyimpan draf luar talian:', e);
  }
}

export function getOfflineDrafts(): Record<string, any> {
  try {
    const raw = localStorage.getItem(OFFLINE_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
