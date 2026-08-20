import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import AccessibleDialog from '@/components/AccessibleDialog.vue'

const mountedWrappers: VueWrapper[] = []

function mountDialog(props: Partial<{
  open: boolean
  titleId: string
  descriptionId: string
  closeOnBackdrop: boolean
  initialFocus: 'first' | 'dialog'
  panelClass: string
}> = {}): VueWrapper {
  const wrapper = mount(AccessibleDialog, {
    attachTo: document.body,
    props: {
      open: true,
      titleId: 'dialog-title',
      ...props
    },
    slots: {
      default: `
        <h2 id="dialog-title">Title</h2>
        <p id="dialog-description">Description</p>
        <button id="first" type="button">First</button>
        <button id="last" type="button">Last</button>
      `
    }
  })

  mountedWrappers.push(wrapper)
  return wrapper
}

function dialog(): HTMLElement {
  const element = document.body.querySelector<HTMLElement>('[role="dialog"]')
  if (!element) throw new Error('Expected a dialog in the document')
  return element
}

async function settle(): Promise<void> {
  await nextTick()
  await nextTick()
}

function dispatchKey(key: string, shiftKey = false): void {
  dialog().dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }))
}

afterEach(() => {
  for (const wrapper of mountedWrappers.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('AccessibleDialog', () => {
  it('teleports dialog semantics, aria links, panel class, and initial focus to the first control', async () => {
    const wrapper = mountDialog({ descriptionId: 'dialog-description', panelClass: 'sample-dialog' })
    await settle()

    const panel = dialog()
    expect(document.body.contains(panel)).toBe(true)
    expect(wrapper.element.contains(panel)).toBe(false)
    expect(panel.getAttribute('aria-modal')).toBe('true')
    expect(panel.getAttribute('aria-labelledby')).toBe('dialog-title')
    expect(panel.getAttribute('aria-describedby')).toBe('dialog-description')
    expect(panel.classList.contains('sample-dialog')).toBe(true)
    expect(document.activeElement?.id).toBe('first')
  })

  it('focuses the dialog itself when initialFocus is dialog', async () => {
    mountDialog({ initialFocus: 'dialog' })
    await settle()

    expect(document.activeElement).toBe(dialog())
  })

  it('wraps Tab from the last focusable control to the first', async () => {
    mountDialog()
    await settle()
    document.getElementById('last')?.focus()

    dispatchKey('Tab')

    expect(document.activeElement?.id).toBe('first')
  })

  it('wraps Shift+Tab from the first focusable control to the last', async () => {
    mountDialog()
    await settle()
    document.getElementById('first')?.focus()

    dispatchKey('Tab', true)

    expect(document.activeElement?.id).toBe('last')
  })

  it('emits escape when Escape is pressed inside the dialog', async () => {
    const wrapper = mountDialog()
    await settle()

    dispatchKey('Escape')

    expect(wrapper.emitted('close')?.at(-1)).toEqual(['escape'])
  })

  it('emits backdrop when its backdrop is clicked by default', async () => {
    const wrapper = mountDialog()
    await settle()

    dialog().parentElement?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.emitted('close')?.at(-1)).toEqual(['backdrop'])
  })

  it('does not emit backdrop when backdrop closing is disabled', async () => {
    const wrapper = mountDialog({ closeOnBackdrop: false })
    await settle()

    dialog().parentElement?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('preserves the original body overflow until the last open dialog closes', async () => {
    document.body.style.overflow = 'clip'
    const first = mountDialog()
    await settle()
    const second = mountDialog({ titleId: 'second-title' })
    await settle()

    expect(document.body.style.overflow).toBe('hidden')

    await first.setProps({ open: false })
    await settle()
    expect(document.body.style.overflow).toBe('hidden')

    await second.setProps({ open: false })
    await settle()
    expect(document.body.style.overflow).toBe('clip')
  })

  it('restores focus and the exact body overflow value when closed', async () => {
    document.body.style.overflow = 'scroll'
    const trigger = document.createElement('button')
    trigger.id = 'trigger'
    document.body.append(trigger)
    trigger.focus()
    const wrapper = mountDialog()
    await settle()

    await wrapper.setProps({ open: false })
    await settle()

    expect(document.body.style.overflow).toBe('scroll')
    expect(document.activeElement).toBe(trigger)
  })

  it('restores focus and scroll state when unmounted while open', async () => {
    document.body.style.overflow = 'auto'
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const wrapper = mountDialog()
    await settle()

    wrapper.unmount()
    mountedWrappers.splice(mountedWrappers.indexOf(wrapper), 1)
    await settle()

    expect(document.body.style.overflow).toBe('auto')
    expect(document.activeElement).toBe(trigger)
  })
})
