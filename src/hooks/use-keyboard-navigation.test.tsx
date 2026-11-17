import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { createRef } from 'react'
import { useKeyboardNavigation } from './use-keyboard-navigation'

const chapterRefs = [createRef<HTMLDivElement>(), createRef<HTMLDivElement>(), createRef<HTMLDivElement>()]
const scrollSpies = [vi.fn(), vi.fn(), vi.fn()]

function Harness({ currentChapter = 1 }: { currentChapter?: number }) {
  useKeyboardNavigation({ chapterRefs, currentChapter })
  return (
    <div>
      {chapterRefs.map((ref, i) => (
        <div key={i} ref={ref} />
      ))}
      <button>action</button>
      <a href="#x">link</a>
    </div>
  )
}

const pressOn = (target: Element, key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(target, { key, ...init })

const scrolledChapters = () => scrollSpies.filter((spy) => spy.mock.calls.length > 0).length

beforeEach(() => {
  scrollSpies.forEach((spy, i) => {
    spy.mockClear()
    chapterRefs[i] = createRef<HTMLDivElement>()
  })
  Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true })
  delete (window as unknown as Record<string, unknown>).ontouchstart
})

afterEach(() => {
  document.querySelectorAll('[aria-modal]').forEach((el) => el.remove())
})

function renderHarness(currentChapter = 1) {
  const result = render(<Harness currentChapter={currentChapter} />)
  chapterRefs.forEach((ref, i) => {
    if (ref.current) {
      ref.current.scrollIntoView = scrollSpies[i]
    }
  })
  return result
}

describe('useKeyboardNavigation', () => {
  it('It scrolls to the next chapter on ArrowDown from the page body', () => {
    renderHarness(1)

    pressOn(document.body, 'ArrowDown')

    expect(scrollSpies[1]).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['Space', false],
    ['Shift+Space', true],
  ])('It does not handle %s from the page body', (_label, shiftKey) => {
    renderHarness(1)
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      shiftKey,
      bubbles: true,
      cancelable: true,
    })

    document.body.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(scrolledChapters()).toBe(0)
  })

  it.each([
    ['button', ' '],
    ['button', 'ArrowDown'],
    ['button', 'Home'],
    ['button', 'End'],
    ['a', ' '],
    ['a', 'Enter'],
  ])('It yields %s key %j to the focused control', (selector, key) => {
    const { container } = renderHarness(1)
    const target = container.querySelector(selector) as Element
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

    target.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(scrolledChapters()).toBe(0)
  })

  it.each(['ArrowDown', 'End'])('It ignores %s while a modal dialog is open', (key) => {
    const dialog = document.createElement('div')
    dialog.setAttribute('aria-modal', 'true')
    document.body.appendChild(dialog)
    renderHarness(1)

    pressOn(document.body, key)

    expect(scrolledChapters()).toBe(0)
  })

  it('It ignores keys on touch devices', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true })
    renderHarness(1)

    pressOn(document.body, 'ArrowDown')

    expect(scrolledChapters()).toBe(0)
  })
})
