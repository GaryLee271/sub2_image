import { userStorageKey } from '../lib/userStorage'
import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { createDefaultOpenAIProfile, normalizeSettings } from '../lib/apiProfiles'
import { loadImageKeys, loadImageModels, Sub2LoginRequiredError, type Sub2Key } from '../lib/sub2Api'
import { redirectToSub2Login } from '../lib/sub2Auth'
import { useSub2Connection } from '../lib/sub2Connection'

export function useSub2Keys() {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') ?? '')
  const [keysToken, setKeysToken] = useState('')
  const [keys, setKeys] = useState<Sub2Key[]>([])
  const [keyId, setKeyId] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [model, setModel] = useState('')
  const [loading, setLoading] = useState<'keys' | 'models' | null>(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [savedSelection] = useState<{ keyId?: string; model?: string }>(() => {
    try { return JSON.parse(localStorage.getItem(userStorageKey('selection')) ?? '{}') ?? {} }
    catch { return {} }
  })

  function clearSelection() {
    useSub2Connection.setState({ enabled: true, ready: false, token: '' })
    setModels([])
    setModel('')
  }

  useEffect(() => {
    const sync = () => setToken(localStorage.getItem('auth_token') ?? '')
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    clearSelection()
    setKeysToken('')
    setKeys([])
    setKeyId('')
    setError('')
    const current = useStore.getState()
    const profiles = current.settings.profiles.filter((profile) => !profile.id.startsWith('sub2-key-'))
    current.setSettings(normalizeSettings({ ...current.settings, profiles, activeProfileId: profiles[0]?.id, apiKey: '' }))
    if (!token) {
      setLoading(null)
      redirectToSub2Login()
      return () => controller.abort()
    }
    setLoading('keys')
    loadImageKeys(token, controller.signal).then((items) => {
      if (controller.signal.aborted) return
      const state = useStore.getState()
      state.setSettings({ ...state.settings, profiles: [
        ...state.settings.profiles.filter((profile) => !profile.id.startsWith('sub2-key-')),
        ...items.map((key) => createDefaultOpenAIProfile({
          id: `sub2-key-${key.id}`, name: key.name, baseUrl: `${window.location.origin}/v1`,
          apiKey: key.key, apiMode: 'images', apiProxy: false, streamImages: false, codexCli: false,
        })),
      ] })
      setKeysToken(token)
      setKeys(items)
      setKeyId(items.some((key) => String(key.id) === savedSelection.keyId) ? savedSelection.keyId! : items[0] ? String(items[0].id) : '')
      if (!items.length) setError('暂无可用于生图的 Key，请在 API Key 页面创建或选择已开启生图的 OpenAI/Grok 分组')
    }).catch((err) => {
      if (controller.signal.aborted) return
      if (err instanceof Sub2LoginRequiredError) { redirectToSub2Login(); return }
      setError(err.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(null)
    })
    return () => controller.abort()
  }, [token, revision])

  useEffect(() => {
    const key = keys.find((item) => String(item.id) === keyId)
    if (!key || keysToken !== token) return
    const controller = new AbortController()
    clearSelection()
    setError('')
    setLoading('models')
    loadImageModels(key, controller.signal).then((items) => {
      if (controller.signal.aborted) return
      setModels(items)
      setModel(keyId === savedSelection.keyId && items.includes(savedSelection.model ?? '') ? savedSelection.model! : items[0] ?? '')
      if (!items.length) setError('这个 Key 没有可用的生图模型，请切换 Key 或联系管理员配置模型')
    }).catch((err) => {
      if (!controller.signal.aborted) setError(err.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(null)
    })
    return () => controller.abort()
  }, [keyId, keys, keysToken, token])

  useEffect(() => {
    const key = keys.find((item) => String(item.id) === keyId)
    if (keysToken !== token || !key || !model || !models.includes(model) || token !== localStorage.getItem('auth_token')) return
    const current = useStore.getState()
    const profile = createDefaultOpenAIProfile({
      id: `sub2-key-${key.id}`, name: key.name, baseUrl: `${window.location.origin}/v1`,
      apiKey: key.key, model, apiMode: 'images', apiProxy: false, streamImages: false, codexCli: false,
    })
    current.setSettings(normalizeSettings({
      ...current.settings,
      profiles: [...current.settings.profiles.filter((item) => item.id !== profile.id), profile],
      activeProfileId: profile.id, baseUrl: profile.baseUrl, apiKey: profile.apiKey, model,
      apiMode: 'images', apiProxy: false, streamImages: false, codexCli: false,
    }))
    localStorage.setItem(userStorageKey('selection'), JSON.stringify({ keyId, model }))
    current.setReusedTaskApiProfile(null)
    useSub2Connection.setState({ enabled: true, ready: true, token })
  }, [keyId, keys, keysToken, model, models, token])

  return {
    keys, keyId, models, model, loading, error,
    selectKey: (id: string) => { if (id === keyId) return; clearSelection(); setKeyId(id) },
    selectModel: (value: string) => { if (value === model) return; useSub2Connection.setState({ ready: false }); setModel(value) },
    retry: () => setRevision((value) => value + 1),
  }
}
