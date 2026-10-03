import { create } from 'zustand'

export const useSub2Connection = create<{
  enabled: boolean
  ready: boolean
  token: string
}>(() => ({ enabled: false, ready: false, token: '' }))

export function isSub2Ready() {
  const state = useSub2Connection.getState()
  return !state.enabled || (state.ready && state.token === localStorage.getItem('auth_token'))
}
