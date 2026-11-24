import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHistory } from '@/composables/useHistory'
import { HISTORY_KEY, LEGACY_FAVORITES_KEYS, LEGACY_HISTORY_KEYS } from '@/config'

const legacyRecord = { id: 'legacy', data: 'data:image/jpeg;base64,AA==' }
const { history, storageError, initHistory, clearAllHistory, deleteHistory, toggleFavorite } = useHistory()

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(LEGACY_HISTORY_KEYS[0], JSON.stringify([legacyRecord]))
  localStorage.setItem(LEGACY_FAVORITES_KEYS[0], JSON.stringify([legacyRecord.id]))
})

describe('legacy history migration', () => {
  it('reports storage failures instead of claiming records were cleared', () => {
    initHistory()
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })
    try {
      expect(clearAllHistory()).toBe(false)
      expect(useHistory().storageError.value).toBe(true)
    } finally { write.mockRestore() }
  })

  it('warns when browser history cannot be read', () => {
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError') })
    try {
      initHistory()
      expect(history.value).toEqual([])
      expect(storageError.value).toBe(true)
    } finally { read.mockRestore() }
  })

  it('keeps a legacy prediction without an image and does not invent model or time', () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([{ id: 'old', prediction: { freshness_label: 1, confidence_score: 0.7, all_probabilities: [0.1, 0.7, 0.2] } }]))
    initHistory()
    expect(history.value).toHaveLength(1)
    expect(history.value[0].data).toBe('')
    expect(history.value[0].prediction?.model_version).toBe('')
    expect(history.value[0].prediction?.timestamp).toBe('')
    expect(history.value[0].timestamp).toBe('')
  })

  it('retains request and cache provenance after reload', async () => {
    initHistory()
    vi.stubGlobal('Image', class { onerror: (() => void) | null = null; set src(_: string) { queueMicrotask(() => this.onerror?.()) } })
    const provenance = { requestedAt: '2026-11-23T10:00:00.000Z', resultCreatedAt: '2026-11-23T09:55:00', cacheStatus: 'hit' as const, serviceRevision: 'abc123', weightsSha256: 'a'.repeat(64) }
    try {
      await useHistory().addHistoryRecord('data:image/jpeg;base64,AA==', 10, undefined, '', () => true, provenance)
      initHistory()
      expect(history.value[0].provenance).toEqual(provenance)
    } finally { vi.unstubAllGlobals() }
  })
  it('does not save an analysis cancelled while thumbnails are being prepared', async () => {
    initHistory()
    vi.stubGlobal('Image', class { onerror: (() => void) | null = null; set src(_: string) { queueMicrotask(() => this.onerror?.()) } })
    try {
      const result = await useHistory().addHistoryRecord('data:image/jpeg;base64,AA==', 10, undefined, '', () => false)
      expect(result).toBeNull()
      expect(history.value).toHaveLength(1)
    } finally { vi.unstubAllGlobals() }
  })
  it('keeps a cleared history empty across reloads', () => {
    initHistory()
    expect(history.value).toHaveLength(1)
    clearAllHistory()
    initHistory()
    expect(history.value).toEqual([])
    expect(localStorage.getItem(HISTORY_KEY)).toBe('[]')
    for (const key of [...LEGACY_HISTORY_KEYS, ...LEGACY_FAVORITES_KEYS]) expect(localStorage.getItem(key)).toBeNull()
  })

  it('reports legacy-key removal failures after clearing the current history', () => {
    initHistory()
    localStorage.setItem(LEGACY_HISTORY_KEYS[0], JSON.stringify([legacyRecord]))
    const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError') })
    try {
      expect(clearAllHistory()).toBe(false)
      expect(useHistory().storageError.value).toBe(true)
      expect(localStorage.getItem(HISTORY_KEY)).toBe('[]')
    } finally { remove.mockRestore() }
  })

  it('keeps the last legacy record deleted across reloads', () => {
    initHistory()
    deleteHistory(legacyRecord.id)
    initHistory()
    expect(history.value).toEqual([])
  })

  it('imports legacy favorites once and preserves an explicit unfavorite', () => {
    initHistory()
    expect(history.value[0].favorite).toBe(true)
    toggleFavorite(legacyRecord.id)
    initHistory()
    expect(history.value[0].favorite).toBe(false)
  })

  it('reads the second legacy key when the first legacy key is empty', () => {
    localStorage.setItem(LEGACY_HISTORY_KEYS[0], '[]')
    localStorage.setItem(LEGACY_HISTORY_KEYS[1], JSON.stringify([legacyRecord]))
    initHistory()
    expect(history.value[0].id).toBe(legacyRecord.id)
  })
})
