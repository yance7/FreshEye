import { describe, expect, it } from 'vitest'
import router from '@/router'

describe('route loading contract', () => {
  it('keeps secondary pages lazy while the home route stays eager', () => {
    const routes = router.getRoutes()
    const home = routes.find((route) => route.path === '/')
    const secondary = routes.find((route) => route.path === '/guide.html')

    expect(typeof home?.components?.default).toBe('object')
    expect(typeof secondary?.components?.default).toBe('function')
  })
})
