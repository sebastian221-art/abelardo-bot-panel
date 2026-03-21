// 📄 panel/src/lib/auth.ts
export function getToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('ab_token') || ''
}

export function getUser(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem('ab_user') || 'null') }
  catch { return null }
}

export function saveSession(token: string, user: unknown) {
  localStorage.setItem('ab_token', token)
  localStorage.setItem('ab_user', JSON.stringify(user))
  document.cookie = `ab_token=${token}; path=/; max-age=${7 * 86400}`
}

export function logout() {
  localStorage.removeItem('ab_token')
  localStorage.removeItem('ab_user')
  document.cookie = 'ab_token=; path=/; max-age=0'
}

export function isLoggedIn(): boolean { return !!getToken() }
