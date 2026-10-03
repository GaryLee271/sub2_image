import 'core-js/actual/array/at'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'streamdown/styles.css'
import 'katex/dist/katex.min.css'
import './index.css'
import { initializeUserStorage, loadCurrentUserId, watchSub2Session } from './lib/userStorage'
import { Sub2LoginRequiredError } from './lib/sub2Api'
import { redirectToSub2Login } from './lib/sub2Auth'
import { syncSub2Theme } from './lib/sub2Theme'
import { installMobileViewportGuards } from './lib/viewport'

syncSub2Theme()
installMobileViewportGuards()

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {
        console.error('Service worker registration failed:', error)
      })
    })
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister())
    })
  }
}

const token = localStorage.getItem('auth_token')
if (!token) {
  redirectToSub2Login()
} else {
  const container = document.getElementById('root')!
  const root = createRoot(container)
  root.render(<p className="p-4 text-sm text-gray-500">正在加载你的画廊…</p>)
  let sessionChanged = false
  watchSub2Session(token, () => {
    sessionChanged = true
    root.unmount()
    if (!localStorage.getItem('auth_token')) redirectToSub2Login()
    else window.location.reload()
  })
  // 确认用户后才加载 store，避免读取未分用户的配置或图片。
  loadCurrentUserId(token).then(async (userId) => {
    if (sessionChanged || localStorage.getItem('auth_token') !== token) return
    initializeUserStorage(userId)
    const { default: App } = await import('./App')
    if (sessionChanged || localStorage.getItem('auth_token') !== token) return
    root.render(<StrictMode><App /></StrictMode>)
  }).catch((error) => {
    if (sessionChanged || localStorage.getItem('auth_token') !== token) return
    if (error instanceof Sub2LoginRequiredError) { redirectToSub2Login(); return }
    root.render(
      <div role="alert" className="p-4 text-sm text-gray-600 dark:text-gray-400">
        无法加载当前用户，请重试。
        <button onClick={() => window.location.reload()} className="ml-2 text-blue-500 underline">重新加载</button>
      </div>,
    )
  })
}
