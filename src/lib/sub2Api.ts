import type { AppSettings } from '../types'

export interface Sub2Key {
  id: number
  name: string
  key: string
  status: string
  quota: number
  quota_used: number
  expires_at: string | null
  group?: { id?: number; description?: string; rate_multiplier?: number; user_rate_multiplier?: number; platform: string; name: string; status: string; allow_image_generation: boolean }
}

export function isImageKey(key: Sub2Key, now = Date.now()) {
  return Boolean(key) && key.status === 'active' && Boolean(key.key) &&
    (key.group?.platform === 'openai' || key.group?.platform === 'grok') &&
    key.group.status === 'active' && key.group.allow_image_generation !== false &&
    (!key.expires_at || Date.parse(key.expires_at) > now) &&
    (!key.quota || key.quota_used < key.quota)
}

export function imageModelIds(data: unknown, platform: string): string[] {
  if (!Array.isArray(data)) throw new Error('模型列表格式异常')
  return [...new Set(data.flatMap((model) => {
    if (!model || typeof model.id !== 'string') return []
    const id = model.id as string
    const supported = platform === 'openai' ? /^gpt-image-/i.test(id) : platform === 'grok' && /^grok-.*image/i.test(id)
    return supported ? [id] : []
  }))]
}

export class Sub2LoginRequiredError extends Error {
  constructor() { super('登录已过期，请重新登录 Sub2API') }
}

async function readResponse(response: Response, login = false) {
  if (response.status === 401) {
    if (login) throw new Sub2LoginRequiredError()
    throw new Error('此 Key 已失效，请换一个 Key')
  }
  if (response.status === 403) throw new Error('当前账号或 Key 无权访问，请检查分组权限')
  if (!response.ok) throw new Error(`加载失败（${response.status}），请重试`)
  return response.json()
}

export async function loadImageKeys(token: string, signal: AbortSignal): Promise<Sub2Key[]> {
  const keys: Sub2Key[] = []
  let page = 1
  let pages = 1
  do {
    const response = await fetch(`/api/v1/keys?page=${page}&page_size=100&status=active`, {
      headers: { Authorization: `Bearer ${token}` }, signal, cache: 'no-store',
    })
    const body = await readResponse(response, true)
    if (body.code !== 0 || !Array.isArray(body.data?.items)) throw new Error('无法读取 Key 列表，请重试')
    keys.push(...body.data.items.filter((key: Sub2Key) => isImageKey(key)))
    pages = Number(body.data.pages ?? Math.ceil(body.data.total / body.data.page_size)) || 1
    page += 1
  } while (page <= pages)
  try {
    const response = await fetch('/api/v1/groups/rates', { headers: { Authorization: `Bearer ${token}` }, signal, cache: 'no-store' })
    const body = await readResponse(response, true)
    if (body.code === 0 && body.data) {
      for (const key of keys) {
        const rate = key.group?.id == null ? undefined : body.data[key.group.id]
        if (key.group && typeof rate === 'number') key.group.user_rate_multiplier = rate
      }
    }
  } catch (error) {
    if (signal.aborted || error instanceof Sub2LoginRequiredError) throw error
    console.warn('无法加载用户分组倍率', error)
  }
  return keys
}

export async function loadImageModels(key: Sub2Key, signal: AbortSignal) {
  const response = await fetch('/v1/models', {
    headers: { Authorization: `Bearer ${key.key}` }, signal, cache: 'no-store',
  })
  const body = await readResponse(response)
  return imageModelIds(body.data, key.group!.platform)
}

// 登录获得的 Key 只保留在内存，不复制到生图页的持久化配置。
export function stripSub2Keys(settings: AppSettings): AppSettings {
  const managed = settings.activeProfileId.startsWith('sub2-key-')
  return {
    ...settings,
    ...(managed ? { apiKey: '' } : {}),
    profiles: settings.profiles.map((profile) => profile.id.startsWith('sub2-key-') ? { ...profile, apiKey: '' } : profile),
  }
}
