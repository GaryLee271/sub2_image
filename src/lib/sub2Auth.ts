export function redirectToSub2Login() {
  localStorage.removeItem('auth_token')
  // 嵌入页需要跳转整个页面，避免在 iframe 内显示登录表单。
  const target = window.top ?? window
  target.location.replace('/login')
}
