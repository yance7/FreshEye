import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { useMotionPreference } from '@/composables/useMotionPreference'

type QueryStub = MediaQueryList & {
  setMatches: (value: boolean) => void
  emitChange: () => void
}

const wrappers: VueWrapper[] = []
const originalMatchMedia = window.matchMedia
const originalVisibilityState = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')

function createQuery(media: string, matches: boolean): QueryStub {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const query = {
    media,
    matches,
    onchange: null,
    addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)),
    addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => listeners.add(listener)),
    removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)),
    dispatchEvent: vi.fn(() => true),
    setMatches(value: boolean) { query.matches = value },
    emitChange() {
      const event = new Event('change') as MediaQueryListEvent
      listeners.forEach((listener) => listener(event))
      query.onchange?.(event)
    }
  } as unknown as QueryStub
  return query
}

function installMediaQueries(): Record<string, QueryStub> {
  const queries = {
    reduced: createQuery('(prefers-reduced-motion: reduce)', false),
    hover: createQuery('(hover: hover)', true),
    coarse: createQuery('(pointer: coarse)', false)
  }
  window.matchMedia = vi.fn((query: string) => {
    if (query === queries.reduced.media) return queries.reduced
    if (query === queries.hover.media) return queries.hover
    if (query === queries.coarse.media) return queries.coarse
    return createQuery(query, false)
  })
  return queries
}

function setVisibility(value: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  window.matchMedia = originalMatchMedia
  if (originalVisibilityState) Object.defineProperty(Document.prototype, 'visibilityState', originalVisibilityState)
  vi.restoreAllMocks()
})

describe('useMotionPreference', () => {
  it('tracks reduced motion, hover capability, coarse pointer, and page visibility live', async () => {
    const queries = installMediaQueries()
    setVisibility('visible')
    let state!: ReturnType<typeof useMotionPreference>
    const wrapper = mount(defineComponent({
      setup() {
        state = useMotionPreference()
        return () => null
      }
    }))
    wrappers.push(wrapper)

    expect(state.reduceMotion.value).toBe(false)
    expect(state.canHover.value).toBe(true)
    expect(state.coarsePointer.value).toBe(false)
    expect(state.pageVisible.value).toBe(true)
    expect(state.allowDecorativeMotion.value).toBe(true)

    queries.reduced.setMatches(true)
    queries.reduced.emitChange()
    queries.hover.setMatches(false)
    queries.hover.emitChange()
    queries.coarse.setMatches(true)
    queries.coarse.emitChange()
    setVisibility('hidden')
    await nextTick()

    expect(state.reduceMotion.value).toBe(true)
    expect(state.canHover.value).toBe(false)
    expect(state.coarsePointer.value).toBe(true)
    expect(state.pageVisible.value).toBe(false)
    expect(state.allowDecorativeMotion.value).toBe(false)
  })

  it('allows decorative motion again only after motion and visibility are both allowed', async () => {
    const queries = installMediaQueries()
    setVisibility('hidden')
    let state!: ReturnType<typeof useMotionPreference>
    const wrapper = mount(defineComponent({
      setup() {
        state = useMotionPreference()
        return () => null
      }
    }))
    wrappers.push(wrapper)

    expect(state.allowDecorativeMotion.value).toBe(false)
    setVisibility('visible')
    await nextTick()
    expect(state.allowDecorativeMotion.value).toBe(true)

    queries.reduced.setMatches(true)
    queries.reduced.emitChange()
    await nextTick()
    expect(state.allowDecorativeMotion.value).toBe(false)
  })

  it('removes media and visibility listeners on unmount', () => {
    const queries = installMediaQueries()
    setVisibility('visible')
    const state = useMotionPreference
    const wrapper = mount(defineComponent({ setup: () => state(), template: '<span />' }))
    wrappers.push(wrapper)

    wrapper.unmount()

    expect(queries.reduced.removeEventListener).toHaveBeenCalled()
    expect(queries.hover.removeEventListener).toHaveBeenCalled()
    expect(queries.coarse.removeEventListener).toHaveBeenCalled()
  })
})
