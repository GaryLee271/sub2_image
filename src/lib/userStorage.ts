import { Sub2LoginRequiredError } from './sub2Api'

let storageUserId: number | null = null

export function initializeUserStorage(userId: number) {
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error('用户 ID 无效')
  if (storageUserId !== null && storageUserId !== userId) throw new Error('切换用户需要重新加载页面')
  storageUserId = userId
}

export function userStorageKey(suffix = '') {
  if (storageUserId === null) throw new Error('尚未确认当前用户')
  return `gpt-image-playground:user:${storageUserId}${suffix ? `:${suffix}` : ''}`
}

export async function loadCurrentUserId(token: string): Promise<number> {
  const response = await fetch('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
  })
  if (response.status === 401) throw new Sub2LoginRequiredError()
  if (!response.ok) throw new Error('无法确认当前用户，请刷新重试')
  const body = await response.json()
  const id = body.data?.id
  if (body.code !== 0 || !Number.isSafeInteger(id) || id <= 0) throw new Error('当前用户信息无效，请重新登录')
  return id
}

export function watchSub2Session(token: string, onChange: () => void) {
  let changed = false
  const check = () => {
    if (changed || localStorage.getItem('auth_token') === token) return
    changed = true
    onChange()
  }
  window.addEventListener('storage', check)
  window.addEventListener('focus', check)
  window.addEventListener('pageshow', check)
  document.addEventListener('visibilitychange', check)
  return () => {
    window.removeEventListener('storage', check)
    window.removeEventListener('focus', check)
    window.removeEventListener('pageshow', check)
    document.removeEventListener('visibilitychange', check)
  }
}
