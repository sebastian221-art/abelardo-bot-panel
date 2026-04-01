// 📄 panel/src/lib/api.ts  ← REEMPLAZA EL ANTERIOR
import { getToken } from './auth'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function req<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res   = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type':  'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Error en la petición')
  }
  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────────────
export const login      = (u: string, p: string) => req<{token:string;user:unknown}>('/auth/login', { method:'POST', body: JSON.stringify({username:u,password:p}) })
export const getMe      = () => req('/auth/me')
export const getUsers   = () => req<unknown[]>('/auth/users')
export const createUser = (data: unknown) => req('/auth/users', { method:'POST', body: JSON.stringify(data) })
export const updateUser = (id: number, data: unknown) => req(`/auth/users/${id}`, { method:'PUT', body: JSON.stringify(data) })
export const deleteUser = (id: number) => req(`/auth/users/${id}`, { method:'DELETE' })

// ── Stats / Analytics ─────────────────────────────────────────────
export const getStats      = () => req<Record<string,unknown>>('/stats')
export const getDailyMsgs  = (days=14) => req(`/analytics/daily?days=${days}`)
export const getTopIntents = (days=7)  => req(`/analytics/intents?days=${days}`)
export const getOptinCurve = (days=30) => req(`/analytics/optin-curve?days=${days}`)
export const getCities     = () => req('/analytics/cities')
export const getAmbassadors = (limit=20) => req(`/analytics/ambassadors?limit=${limit}`)

// ── Contactos ─────────────────────────────────────────────────────
export const getContacts = (page=1, filters: Record<string,string>={}) => {
  const q = new URLSearchParams({ page: String(page), ...filters }).toString()
  return req(`/contacts?${q}`)
}
export const getContact              = (phone: string) => req(`/contacts/${phone}`)
export const getContactConversations = (phone: string) => req(`/contacts/${phone}/conversations`)
export const updateContact           = (phone: string, data: unknown) =>
  req(`/contacts/${phone}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteContact           = (phone: string) =>
  req(`/contacts/${phone}`, { method: 'DELETE' })

export const importContacts = (file: File) => {
  const fd = new FormData()
  fd.append('file', file)
  return fetch(`${BASE}/contacts/import`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body:    fd,
  }).then(r => r.json())
}

export const exportContacts = (filters: Record<string,string>={}) => {
  const q = new URLSearchParams(filters).toString()
  return fetch(`${BASE}/contacts/export?${q}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then(r => r.blob())
}

// ── Grupos ────────────────────────────────────────────────────────
export const getGroups       = () => req<unknown[]>('/groups/')
export const createGroup     = (data: unknown) => req('/groups/', { method:'POST', body: JSON.stringify(data) })
export const deleteGroup     = (id: number) => req(`/groups/${id}`, { method:'DELETE' })
export const getGroupMembers = (id: number) => req(`/groups/${id}/members`)
export const addGroupMembers = (id: number, phones: string[]) =>
  req(`/groups/${id}/members`, { method:'POST', body: JSON.stringify({ phones }) })
export const removeGroupMember = (groupId: number, phone: string) =>
  req(`/groups/${groupId}/members/${phone}`, { method:'DELETE' })

// ── Conversaciones ────────────────────────────────────────────────
export const getConversations    = (page=1, q='') => req(`/conversations?page=${page}&q=${encodeURIComponent(q)}`)
export const deleteOldConversations = (days: number) =>
  req(`/conversations/cleanup?days=${days}`, { method:'DELETE' })

// ── Broadcast ─────────────────────────────────────────────────────
export const getBroadcasts    = (page=1, status='') => req(`/broadcast/?page=${page}&status=${status}`)
export const getBroadcast     = (id: number) => req(`/broadcast/${id}`)
export const createBroadcast  = (data: unknown) => req('/broadcast/', { method:'POST', body: JSON.stringify(data) })
export const sendBroadcast    = (id: number) => req(`/broadcast/${id}/send`, { method:'POST' })
export const pauseBroadcast   = (id: number) => req(`/broadcast/${id}/pause`, { method:'POST' })
export const resumeBroadcast  = (id: number) => req(`/broadcast/${id}/resume`, { method:'POST' })
export const cancelBroadcast  = (id: number) => req(`/broadcast/${id}/cancel`, { method:'POST' })
export const duplicateBroadcast = (id: number) => req(`/broadcast/${id}/duplicate`, { method:'POST' })
export const getBroadcastLogs = (id: number, page=1) => req(`/broadcast/${id}/logs?page=${page}`)
export const previewBroadcast = (segment: string, value='') =>
  req(`/broadcast/preview?segment=${segment}&segment_value=${encodeURIComponent(value)}`)

// ── Encuestas (resultados) ────────────────────────────────────────
export const getSurveyResults = (broadcastId: number) =>
  req(`/broadcast/${broadcastId}/survey-results`)

// ── Knowledge ────────────────────────────────────────────────────
export const getKnowledge     = () => req('/knowledge/')
export const createKnowledge  = (data: unknown) => req('/knowledge/', { method:'POST', body: JSON.stringify(data) })
export const updateKnowledge  = (id: number, data: unknown) => req(`/knowledge/${id}`, { method:'PUT', body: JSON.stringify(data) })
export const deleteKnowledge  = (id: number) => req(`/knowledge/${id}`, { method:'DELETE' })
export const refreshWebScrape = () => req('/knowledge/refresh-web', { method:'POST' })

// ── Chat de prueba ────────────────────────────────────────────────
export const testChat = (phone: string, message: string) =>
  req<{reply:string;intent:string}>('/chat-test', { method:'POST', body: JSON.stringify({phone,message}) })

// ── Links / tracking ─────────────────────────────────────────────
export const getLinkStats = () => req('/links/stats')
export const trackLinkClick = (ref: string) =>
  req('/links/track', { method:'POST', body: JSON.stringify({ ref }) })