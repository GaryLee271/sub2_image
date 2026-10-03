// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { syncSub2Theme } from './sub2Theme'

let stop: () => void
let system: EventTarget & { matches: boolean }
beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/image/')
  document.documentElement.className = ''
  system = Object.assign(new EventTarget(), { matches: true })
  vi.stubGlobal('matchMedia', () => system)
})
afterEach(() => { stop?.(); vi.unstubAllGlobals() })
it('uses the host theme parameter over saved and system themes', () => {
  localStorage.setItem('theme', 'dark')
  window.history.replaceState(null, '', '/image/?theme=light')
  stop = syncSub2Theme()
  expect(document.documentElement.classList.contains('dark')).toBe(false)
})
it('supports explicit dark mode even on a light system', () => {
  system.matches = false
  window.history.replaceState(null, '', '/image/?theme=dark')
  stop = syncSub2Theme()
  expect(document.documentElement.classList.contains('dark')).toBe(true)
})
it('syncs standalone pages with the host saved preference', () => {
  localStorage.setItem('theme', 'light')
  stop = syncSub2Theme()
  expect(document.documentElement.classList.contains('dark')).toBe(false)
  localStorage.setItem('theme', 'dark')
  window.dispatchEvent(new Event('storage'))
  expect(document.documentElement.classList.contains('dark')).toBe(true)
  localStorage.setItem('theme', 'light')
  window.dispatchEvent(new Event('focus'))
  expect(document.documentElement.classList.contains('dark')).toBe(false)
})
it('follows system theme only when no host choice exists', () => {
  stop = syncSub2Theme()
  expect(document.documentElement.classList.contains('dark')).toBe(true)
  system.matches = false
  system.dispatchEvent(new Event('change'))
  expect(document.documentElement.classList.contains('dark')).toBe(false)
})
