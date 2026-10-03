export function syncSub2Theme() {
  const system = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = () => {
    const supplied = new URLSearchParams(window.location.search).get('theme')
    const saved = localStorage.getItem('theme')
    const theme = supplied === 'dark' || supplied === 'light' ? supplied : saved
    const dark = theme === 'dark' || (theme !== 'light' && system.matches)
    document.documentElement.classList.toggle('dark', dark)
  }
  apply()
  window.addEventListener('storage', apply)
  window.addEventListener('focus', apply)
  system.addEventListener('change', apply)
  return () => {
    window.removeEventListener('storage', apply)
    window.removeEventListener('focus', apply)
    system.removeEventListener('change', apply)
  }
}
