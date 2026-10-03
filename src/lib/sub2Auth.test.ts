import { afterEach, expect, it, vi } from 'vitest'
import { redirectToSub2Login } from './sub2Auth'

afterEach(() => vi.unstubAllGlobals())
it('clears the expired session and redirects the top-level page', () => {
  const replace = vi.fn()
  const frameReplace = vi.fn()
  const removeItem = vi.fn()
  vi.stubGlobal('localStorage', { removeItem })
  vi.stubGlobal('window', { top: { location: { replace } }, location: { replace: frameReplace } })
  redirectToSub2Login()
  expect(removeItem).toHaveBeenCalledWith('auth_token')
  expect(replace).toHaveBeenCalledWith('/login')
  expect(frameReplace).not.toHaveBeenCalled()
})
