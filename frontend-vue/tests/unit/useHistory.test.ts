import { beforeEach, describe, expect, it } from 'vitest'
import { useHistory } from '@/composables/useHistory'
import { HISTORY_KEY, LEGACY_FAVORITES_KEYS, LEGACY_HISTORY_KEYS } from '@/config'

const legacyRecord = { id: 'legacy', data: 'data:image/jpeg;base64,AA==' }
const { history, initHistory, clearAllHistory, deleteHistory, toggleFavorite } = useHistory()

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(LEGACY_HISTORY_KEYS[0], JSON.stringify([legacyRecord]))
  localStorage.setItem(LEGACY_FAVORITES_KEYS[0], JSON.stringify([legacyRecord.id]))
})

describe('legacy history migration', () => {
  it('keeps a cleared history empty across reloads', () => {
    initHistory()
    expect(history.value).toHaveLength(1)
    clearAllHistory()
    initHistory()
    expect(history.value).toEqual([])
    expect(localStorage.getItem(HISTORY_KEY)).toBe('[]')
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
