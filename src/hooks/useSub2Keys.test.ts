// @vitest-environment jsdom
vi.mock('../lib/userStorage', () => ({ userStorageKey: (suffix: string) => `test-user-1:${suffix}` }))
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../lib/apiProfiles'
import { loadImageKeys, loadImageModels, Sub2LoginRequiredError, type Sub2Key } from '../lib/sub2Api'
import { useSub2Connection } from '../lib/sub2Connection'
import { useSub2Keys } from './useSub2Keys'
import { redirectToSub2Login } from '../lib/sub2Auth'
import { useStore } from '../store'

vi.mock('../store', () => {
  const state = { settings: {}, setSettings: vi.fn((settings) => { state.settings = settings }), setReusedTaskApiProfile: vi.fn() }
  return { useStore: { getState: () => state } }
})
vi.mock('../lib/sub2Auth', () => ({ redirectToSub2Login: vi.fn() }))
vi.mock('../lib/sub2Api', async (importOriginal) => ({ ...await importOriginal<typeof import('../lib/sub2Api')>(), loadImageKeys: vi.fn(), loadImageModels: vi.fn() }))
let result: ReturnType<typeof useSub2Keys>
let root: ReturnType<typeof createRoot>
function Harness() { result = useSub2Keys(); return null }
const key = (id: number): Sub2Key => ({ id, key: `test-${id}`, name: `key-${id}`, status: 'active', quota: 0, quota_used: 0, expires_at: null, group: { platform: 'openai', name: 'image', status: 'active', allow_image_generation: true } })
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  localStorage.clear()
  localStorage.setItem('auth_token', 'session')
  useStore.getState().settings = DEFAULT_SETTINGS
  useSub2Connection.setState({ enabled: false, ready: false, token: '' })
  vi.mocked(loadImageKeys).mockResolvedValue([key(1), key(2)])
  vi.mocked(loadImageModels).mockResolvedValue(['gpt-image-2'])
  root = createRoot(document.createElement('div'))
})
afterEach(async () => { await act(async () => root.unmount()); vi.clearAllMocks(); vi.unstubAllGlobals() })
it('automatically configures the same-origin image API after loading key and model', async () => {
  await act(async () => root.render(createElement(Harness)))
  expect(useStore.getState().settings.profiles.find((profile) => profile.id === 'sub2-key-2')?.apiKey).toBe('test-2')
  expect(useStore.getState().settings.reuseTaskApiProfileTemporarily).toBe(false)
  expect(result.keyId).toBe('1')
  expect(result.model).toBe('gpt-image-2')
  expect(useStore.getState().settings.apiKey).toBe('test-1')
  expect(useStore.getState().settings.baseUrl).toBe(`${location.origin}/v1`)
  expect(useSub2Connection.getState().ready).toBe(true)
})
it('discards a late model response when switching keys', async () => {
  let resolveOld!: (models: string[]) => void
  vi.mocked(loadImageModels).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve }))
  await act(async () => root.render(createElement(Harness)))
  await act(async () => result.selectKey('2'))
  await act(async () => resolveOld(['gpt-image-old']))
  expect(result.models).toEqual(['gpt-image-2'])
  expect(useStore.getState().settings.apiKey).toBe('test-2')
})
it('clears keys and blocks generation when the host logs out', async () => {
  await act(async () => root.render(createElement(Harness)))
  await act(async () => { localStorage.removeItem('auth_token'); window.dispatchEvent(new Event('storage')) })
  expect(redirectToSub2Login).toHaveBeenCalledOnce()
  expect(result.keys).toEqual([])
  expect(result.model).toBe('')
  expect(useSub2Connection.getState().ready).toBe(false)
  expect(useStore.getState().settings.profiles.some((profile) => profile.id.startsWith('sub2-key-'))).toBe(false)
})
it('keeps generation blocked when the key has no image models', async () => {
  vi.mocked(loadImageModels).mockResolvedValue([])
  await act(async () => root.render(createElement(Harness)))
  expect(result.error).toContain('没有可用')
  expect(useSub2Connection.getState().ready).toBe(false)
})

it('redirects missing sessions without requesting keys', async () => {
  localStorage.removeItem('auth_token')
  await act(async () => root.render(createElement(Harness)))
  expect(redirectToSub2Login).toHaveBeenCalledOnce()
  expect(loadImageKeys).not.toHaveBeenCalled()
})
it('redirects an expired login reported by the user API', async () => {
  vi.mocked(loadImageKeys).mockRejectedValueOnce(new Sub2LoginRequiredError())
  await act(async () => root.render(createElement(Harness)))
  expect(redirectToSub2Login).toHaveBeenCalledOnce()
  expect(useSub2Connection.getState().ready).toBe(false)
})
it('does not redirect on model key failures or temporary network errors', async () => {
  vi.mocked(loadImageModels).mockRejectedValueOnce(new Error('此 Key 已失效'))
  await act(async () => root.render(createElement(Harness)))
  expect(redirectToSub2Login).not.toHaveBeenCalled()
  expect(result.error).toContain('Key 已失效')
})
it('restores the selected key and model after remount without saving key secrets', async () => {
  vi.mocked(loadImageModels).mockResolvedValue(['gpt-image-2', 'gpt-image-2.5-flare'])
  await act(async () => root.render(createElement(Harness)))
  await act(async () => result.selectKey('2'))
  await act(async () => result.selectModel('gpt-image-2.5-flare'))
  expect(JSON.parse(localStorage.getItem('test-user-1:selection')!)).toEqual({ keyId: '2', model: 'gpt-image-2.5-flare' })
  await act(async () => root.unmount())
  root = createRoot(document.createElement('div'))
  await act(async () => root.render(createElement(Harness)))
  expect(result.keyId).toBe('2')
  expect(result.model).toBe('gpt-image-2.5-flare')
})
it('selects an available model when the remembered model is no longer listed', async () => {
  localStorage.setItem('test-user-1:selection', JSON.stringify({ keyId: '2', model: 'removed-model' }))
  await act(async () => root.render(createElement(Harness)))
  expect(result.keyId).toBe('2')
  expect(result.model).toBe('gpt-image-2')
})
it('ignores unavailable remembered keys', async () => {
  localStorage.setItem('test-user-1:selection', JSON.stringify({ keyId: 'deleted-key', model: 'old-model' }))
  await act(async () => root.render(createElement(Harness)))
  expect(result.keyId).toBe('1')
  expect(result.model).toBe('gpt-image-2')
})
