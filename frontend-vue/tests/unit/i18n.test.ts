import { describe, expect, it } from 'vitest'
import zh from '@/i18n/zh'
import en from '@/i18n/en'

function flattenShape(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    const key = `${prefix}[]`
    return value.length === 0
      ? [`${key}:array`]
      : [`${key}:array`, ...flattenShape(value[0], key)]
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .flatMap((key) => flattenShape((value as Record<string, unknown>)[key], prefix ? `${prefix}.${key}` : key))
  }
  return [`${prefix}:${typeof value}`]
}

describe('bilingual message packs', () => {
  it('keep identical flattened keys and value shapes', () => {
    expect(flattenShape(en)).toEqual(flattenShape(zh))
  })

  it('keep the user-facing workflow copy localized', () => {
    expect(en.home.model.v2).toContain('High-accuracy model (recommended)')
    expect(en.home.camera.capture).toBe('Capture')
    expect(en.home.low_conf_modal.view_anyway).toBe('View result anyway')
    expect(zh.home.model.v2).toContain('高精度版')
    expect(zh.home.camera.capture).toBe('拍摄')
    expect(zh.home.low_conf_modal.view_anyway).toBe('仍要查看结果')
  })
})
