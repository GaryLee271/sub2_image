import { afterEach, describe, expect, it, vi } from 'vitest'
import { imageModelIds, isImageKey, loadImageKeys, loadImageModels, stripSub2Keys, type Sub2Key } from './sub2Api'
import { DEFAULT_SETTINGS, createDefaultOpenAIProfile } from './apiProfiles'

const key: Sub2Key = { id: 1, name: 'test', key: 'test-key', status: 'active', quota: 0, quota_used: 0, expires_at: null, group: { platform: 'openai', name: 'test', status: 'active', allow_image_generation: true } }
afterEach(() => vi.unstubAllGlobals())

describe('Sub2API image keys and models', () => {
  it('only accepts OpenAI and Grok image groups', () => {
    expect(isImageKey(key)).toBe(true)
    expect(isImageKey({ ...key, group: { ...key.group!, platform: 'grok' } })).toBe(true)
    for (const platform of ['anthropic', 'gemini', 'antigravity']) {
      expect(isImageKey({ ...key, group: { ...key.group!, platform } })).toBe(false)
    }
    expect(isImageKey({ ...key, group: undefined })).toBe(false)
    expect(isImageKey({ ...key, group: { ...key.group!, allow_image_generation: false } })).toBe(false)
  })
  it('excludes inactive, expired, empty and exhausted keys', () => {
    for (const patch of [{ status: 'inactive' }, { status: 'quota_exhausted' }, { key: '' }, { expires_at: '2020-01-01' }, { quota: 10, quota_used: 10 }]) {
      expect(isImageKey({ ...key, ...patch })).toBe(false)
    }
    expect(isImageKey({ ...key, group: { ...key.group!, status: 'inactive' } })).toBe(false)
  })
  it('filters and deduplicates models by platform', () => {
    const data = ['gpt-5', 'gpt-image-1', 'gpt-image-2', 'gpt-image-2', 'grok-imagine-image', 'grok-imagine-video', 'grok-4'].map((id) => ({ id }))
    expect(imageModelIds(data, 'openai')).toEqual(['gpt-image-1', 'gpt-image-2'])
    expect(imageModelIds(data, 'grok')).toEqual(['grok-imagine-image'])
    expect(imageModelIds([], 'openai')).toEqual([])
    expect(() => imageModelIds({}, 'openai')).toThrow()
  })
  it('loads every page of the current user keys with bearer auth', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ code: 0, data: { items: [{ ...key, group: { ...key.group!, platform: 'gemini' } }], pages: 2 } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 0, data: { items: [key], pages: 2 } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 0, data: {} })))
    vi.stubGlobal('fetch', fetcher)
    const signal = new AbortController().signal
    expect(await loadImageKeys('session-token', signal)).toEqual([key])
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/v1/keys?page=2&page_size=100&status=active', expect.objectContaining({ headers: { Authorization: 'Bearer session-token' }, signal }))
  })
  it('includes the user group rate without replacing the base group rate', async () => {
    const item = { ...key, group: { ...key.group!, id: 8, rate_multiplier: 2, description: 'image group' } }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 0, data: { items: [item], pages: 1 } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 0, data: { 8: 0.5 } }))))
    expect((await loadImageKeys('session', new AbortController().signal))[0].group).toMatchObject({ rate_multiplier: 2, user_rate_multiplier: 0.5, description: 'image group' })
  })
  it('uses the selected key for its own model catalog', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 'gpt-image-2' }, { id: 'gpt-5' }] })))
    vi.stubGlobal('fetch', fetcher)
    expect(await loadImageModels(key, new AbortController().signal)).toEqual(['gpt-image-2'])
    expect(fetcher).toHaveBeenCalledWith('/v1/models', expect.objectContaining({ headers: { Authorization: 'Bearer test-key' } }))
  })
  it('reports expired login without returning stale credentials', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })))
    await expect(loadImageKeys('expired', new AbortController().signal)).rejects.toThrow('登录已过期')
  })
  it('does not persist auto-loaded API secrets or mutate runtime settings', () => {
    const profile = createDefaultOpenAIProfile({ id: 'sub2-key-1', apiKey: 'test-secret' })
    const settings = { ...DEFAULT_SETTINGS, activeProfileId: profile.id, apiKey: profile.apiKey, profiles: [profile] }
    const saved = stripSub2Keys(settings)
    expect(saved.apiKey).toBe('')
    expect(saved.profiles[0].apiKey).toBe('')
    expect(settings.apiKey).toBe('test-secret')
  })
})
