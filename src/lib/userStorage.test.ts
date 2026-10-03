// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import type { TaskRecord } from '../types'
import { DEFAULT_PARAMS } from '../types'

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
  vi.stubGlobal('indexedDB', new IDBFactory())
})
afterEach(() => vi.unstubAllGlobals())

async function user(id: number) {
  vi.resetModules()
  const scope = await import('./userStorage')
  scope.initializeUserStorage(id)
  const db = await import('./db')
  const { useStore } = await import('../store')
  return { scope, db, store: useStore }
}
const task = (prompt: string): TaskRecord => ({
  id: 'same-task-id', prompt, params: { ...DEFAULT_PARAMS }, inputImageIds: [], outputImages: [],
  maskTargetImageId: null, maskImageId: null, status: 'done', error: null, createdAt: 1, finishedAt: 2, elapsed: 1,
})
it('isolates tasks, images, collections and settings and restores them on return', async () => {
  const a = await user(101)
  await a.db.putTask(task('user A'))
  await a.db.putImage({ id: 'same-image-id', dataUrl: 'data:image/png;base64,AA==', source: 'generated', createdAt: 1 })
  a.store.getState().setSettings({ persistInputOnRestart: true })
  a.store.setState({ prompt: 'draft A', favoriteCollections: [{ id: 'a', name: 'A collection', createdAt: 1, updatedAt: 1 }] })

  const b = await user(202)
  expect(await b.db.getAllTasks()).toEqual([])
  expect(await b.db.getImage('same-image-id')).toBeUndefined()
  expect(b.store.getState().favoriteCollections.some((collection) => collection.id === 'a')).toBe(false)
  expect(b.store.getState().prompt).not.toBe('draft A')
  await b.db.putTask(task('user B'))
  await b.db.putImage({ id: 'same-image-id', dataUrl: 'data:image/png;base64,BB==', source: 'generated', createdAt: 1 })
  b.store.getState().setSettings({ persistInputOnRestart: true })
  b.store.setState({ prompt: 'draft B' })
  await b.db.clearTasks()
  await b.db.clearImages()

  // 旧页面的异步操作仍绑定原用户，不能写进后来打开的用户数据库。
  await a.db.putTask(task('user A completed'))
  expect(await b.db.getAllTasks()).toEqual([])
  const returned = await user(101)
  expect((await returned.db.getAllTasks())[0].prompt).toBe('user A completed')
  expect((await returned.db.getImage('same-image-id'))?.dataUrl).toBe('data:image/png;base64,AA==')
  expect(returned.store.getState().favoriteCollections.some((collection) => collection.id === 'a')).toBe(true)
  expect(returned.store.getState().prompt).toBe('draft A')
})
it('never opens an unscoped store or changes identity in an existing page', async () => {
  const scope = await import('./userStorage')
  expect(() => scope.userStorageKey()).toThrow('尚未确认')
  expect(() => scope.initializeUserStorage(-1)).toThrow()
  scope.initializeUserStorage(101)
  expect(scope.userStorageKey('options')).toBe('gpt-image-playground:user:101:options')
  expect(() => scope.initializeUserStorage(202)).toThrow('重新加载')
  expect(scope.userStorageKey()).toBe('gpt-image-playground:user:101')
})
it('uses the authenticated server ID rather than cached user details', async () => {
  localStorage.setItem('auth_user', JSON.stringify({ id: 999 }))
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 0, data: { id: 101 } })))
  vi.stubGlobal('fetch', fetcher)
  const { loadCurrentUserId } = await import('./userStorage')
  expect(await loadCurrentUserId('test-token')).toBe(101)
  expect(fetcher).toHaveBeenCalledWith('/api/v1/auth/me', expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }))
})
it('rejects expired sessions and malformed user IDs before storage initialization', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ code: 0, data: { id: '../other' } })))
  vi.stubGlobal('fetch', fetcher)
  const { loadCurrentUserId, userStorageKey } = await import('./userStorage')
  await expect(loadCurrentUserId('expired')).rejects.toThrow('登录已过期')
  await expect(loadCurrentUserId('invalid')).rejects.toThrow('用户信息无效')
  expect(() => userStorageKey()).toThrow()
})
it('clears the page once when the session changes and also checks restored pages', async () => {
  localStorage.setItem('auth_token', 'A')
  const { watchSub2Session } = await import('./userStorage')
  const clearPage = vi.fn()
  const stop = watchSub2Session('A', clearPage)
  window.dispatchEvent(new Event('focus'))
  expect(clearPage).not.toHaveBeenCalled()
  localStorage.setItem('auth_token', 'B')
  window.dispatchEvent(new Event('pageshow'))
  window.dispatchEvent(new Event('storage'))
  expect(clearPage).toHaveBeenCalledOnce()
  stop()
})
