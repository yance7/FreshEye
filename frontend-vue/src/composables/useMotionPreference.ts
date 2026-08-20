import { computed, onBeforeUnmount, onMounted, readonly, ref } from 'vue'

type MediaListener = (event: MediaQueryListEvent) => void
type MediaQueryListWithLegacyListener = MediaQueryList & {
  addListener?: (listener: MediaListener) => void
  removeListener?: (listener: MediaListener) => void
}

function listenToMediaQuery(query: MediaQueryList, listener: MediaListener): () => void {
  const legacyQuery = query as MediaQueryListWithLegacyListener
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }
  legacyQuery.addListener?.(listener)
  return () => legacyQuery.removeListener?.(listener)
}

function readMediaQuery(query: string, fallback: boolean): MediaQueryList | null {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query)
      : null
  } catch {
    return null
  }
}

export function useMotionPreference() {
  const reduceMotion = ref(false)
  const canHover = ref(true)
  const coarsePointer = ref(false)
  const pageVisible = ref(typeof document === 'undefined' || document.visibilityState !== 'hidden')
  const allowDecorativeMotion = computed(() => !reduceMotion.value && pageVisible.value)

  const cleanups: Array<() => void> = []

  function syncMediaQueries(): void {
    const reduced = readMediaQuery('(prefers-reduced-motion: reduce)', false)
    const hover = readMediaQuery('(hover: hover)', true)
    const coarse = readMediaQuery('(pointer: coarse)', false)
    reduceMotion.value = reduced?.matches ?? false
    canHover.value = hover?.matches ?? true
    coarsePointer.value = coarse?.matches ?? false

    if (reduced) cleanups.push(listenToMediaQuery(reduced, () => { reduceMotion.value = reduced.matches }))
    if (hover) cleanups.push(listenToMediaQuery(hover, () => { canHover.value = hover.matches }))
    if (coarse) cleanups.push(listenToMediaQuery(coarse, () => { coarsePointer.value = coarse.matches }))
  }

  onMounted(() => {
    syncMediaQueries()
    const onVisibilityChange = (): void => {
      pageVisible.value = document.visibilityState !== 'hidden'
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    cleanups.push(() => document.removeEventListener('visibilitychange', onVisibilityChange))
  })

  onBeforeUnmount(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup())
  })

  return {
    reduceMotion: readonly(reduceMotion),
    canHover: readonly(canHover),
    coarsePointer: readonly(coarsePointer),
    pageVisible: readonly(pageVisible),
    allowDecorativeMotion: readonly(allowDecorativeMotion)
  }
}
