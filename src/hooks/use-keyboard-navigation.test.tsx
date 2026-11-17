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
      <button data-testid="icon-button"><span>icon</span></button>
      <input aria-label="name" />
      <select aria-label="choice"><option>one</option></select>
      <textarea aria-label="notes" />
      <div contentEditable suppressContentEditableWarning data-testid="editable">
        <span>text</span>
      </div>
    </div>
  )
}

const pressOn = (target: Element, key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(target, { key, ...init })

const queryTarget = (container: HTMLElement, selector: string): Element => {
  const target = container.querySelector(selector)
  if (target === null) {
    throw new Error(`No element matches ${selector}`)
  }
  return target
}

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
    const target = queryTarget(container, selector)
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

  it.each([
    ['ArrowDown', 2],
    ['PageDown', 2],
    ['ArrowUp', 0],
    ['PageUp', 0],
  ])('It moves from chapter 2 on %s to chapter index %i', (key, expectedIndex) => {
    renderHarness(2)

    pressOn(document.body, key)

    expect(scrollSpies[expectedIndex]).toHaveBeenCalledTimes(1)
    expect(scrolledChapters()).toBe(1)
  })

  it.each([
    ['input', 'input'],
    ['select', 'select'],
    ['textarea', 'textarea'],
    ['contenteditable', '[data-testid="editable"]'],
  ])('It yields ArrowDown from a focused %s', (_label, selector) => {
    const { container } = renderHarness(1)
    const target = queryTarget(container, selector)
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })

    target.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(scrolledChapters()).toBe(0)
  })

  it.each([
    ['a child of a button', '[data-testid="icon-button"] span'],
    ['a child of a contenteditable element', '[data-testid="editable"] span'],
  ])('It yields ArrowDown from %s', (_label, selector) => {
    const { container } = renderHarness(1)
    const target = queryTarget(container, selector)
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })

    target.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(scrolledChapters()).toBe(0)
  })

  it('It keeps handling keys while a dialog has aria-modal="false"', () => {
    const dialog = document.createElement('div')
    dialog.setAttribute('aria-modal', 'false')
    document.body.appendChild(dialog)
    renderHarness(1)

    pressOn(document.body, 'ArrowDown')

    expect(scrollSpies[1]).toHaveBeenCalledTimes(1)
  })

  describe.each(['metaKey', 'ctrlKey', 'altKey'])('with %s held', modifier => {
    it.each(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'])(
      'It leaves %s to the browser',
      key => {
        renderHarness(2)
        const event = new KeyboardEvent('keydown', {
          key,
          [modifier]: true,
          bubbles: true,
          cancelable: true,
        })

        document.body.dispatchEvent(event)

        expect(event.defaultPrevented).toBe(false)
        expect(scrolledChapters()).toBe(0)
      }
    )
  })
})
