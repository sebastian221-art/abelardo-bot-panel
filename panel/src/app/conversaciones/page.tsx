'use client'
// 📄 panel/src/app/conversaciones/page.tsx  ← REEMPLAZA EL ANTERIOR
import { useEffect, useState, useCallback, useRef } from 'react'
import Layout from '@/components/Layout'
import { getConversations } from '@/lib/api'
import { Search, MessageSquare, X, Trash2, RefreshCw } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const INTENT_COLORS: Record<string,string> = {
  propuesta:'#6366f1', seguridad:'#ef4444', economia:'#f59e0b',
  salud:'#10b981', educacion:'#0ea5e9', paz:'#22c55e',
  corrupcion:'#f97316', embajador:'#FCD116', optin:'#22c55e', optout:'#f87171',
}

const INTENTS = ['propuesta','seguridad','economia','salud','educacion','paz','corrupcion','optin','optout']

type ConvItem = {
  id:           number
  phone:        string
  role:         string
  message:      string
  intent:       string | null
  timestamp:    string
  contact_name: string | null
}

export default function ConversacionesPage() {
  const [data,         setData]         = useState<{ total: number; items: ConvItem[] }>({ total:0, items:[] })
  const [search,       setSearch]       = useState('')
  const [intentFilter, setIntentFilter] = useState('')
  const [page,         setPage]         = useState(1)
  const [loading,      setLoading]      = useState(true)
  const [showCleanup,  setShowCleanup]  = useState(false)
  const [cleanupDays,  setCleanupDays]  = useState(30)
  const [cleaning,     setCleaning]     = useState(false)
  const [cleanResult,  setCleanResult]  = useState('')
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const q = intentFilter ? `${search} intent:${intentFilter}` : search
    const d = await getConversations(page, q) as { total: number; items: ConvItem[] }
    setData(d)
    setLoading(false)
  }, [page, search, intentFilter])

  useEffect(() => { load() }, [load])

  function handleSearch(val: string) {
    setSearch(val)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => setPage(1), 400)
  }

  async function handleCleanup() {
    setCleaning(true); setCleanResult('')
    try {
      const token = localStorage.getItem('token')
      const res   = await fetch(`${API}/conversations/cleanup?days=${cleanupDays}`, {
        method:'DELETE', headers: { Authorization:`Bearer ${token}` },
      })
      const d = await res.json() as { deleted: number }
      setCleanResult(`✅ Se eliminaron ${d.deleted} conversaciones anteriores a ${cleanupDays} días`)
      load()
    } catch {
      setCleanResult('❌ Error al limpiar conversaciones')
    }
    setCleaning(false)
  }

  const { items, total } = data

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:960 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>Conversaciones</h1>
            <p style={{ color:'#71717a', fontSize:13 }}>
              {total.toLocaleString()} conversaciones · último mensaje de cada contacto
            </p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={load}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:12, cursor:'pointer' }}>
              <RefreshCw size={13}/>
            </button>
            <button onClick={() => setShowCleanup(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #7f1d1d', background:'transparent', color:'#f87171', fontSize:12, cursor:'pointer' }}>
              <Trash2 size={13}/> Limpiar antiguas
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#52525b' }}/>
            <input value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o mensaje..."
              style={{ width:'100%', padding:'10px 12px 10px 32px', background:'#18181b', border:'1px solid #27272a', borderRadius:9, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }}
                style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', color:'#52525b', cursor:'pointer' }}>
                <X size={13}/>
              </button>
            )}
          </div>
          <select value={intentFilter} onChange={e => { setIntentFilter(e.target.value); setPage(1) }}
            style={{ padding:'10px 12px', background:'#18181b', border:'1px solid #27272a', borderRadius:9, color: intentFilter ? '#fff' : '#52525b', fontSize:13, cursor:'pointer' }}>
            <option value="">Todos los temas</option>
            {INTENTS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          {(search || intentFilter) && (
            <button onClick={() => { setSearch(''); setIntentFilter(''); setPage(1) }}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 12px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#f87171', fontSize:12, cursor:'pointer' }}>
              <X size={12}/> Limpiar
            </button>
          )}
        </div>

        {/* Pills de intención */}
        <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
          {INTENTS.map(i => (
            <button key={i} onClick={() => { setIntentFilter(intentFilter === i ? '' : i); setPage(1) }}
              style={{
                padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer',
                border:`1px solid ${intentFilter === i ? INTENT_COLORS[i] : '#27272a'}`,
                background: intentFilter === i ? INTENT_COLORS[i] + '22' : 'transparent',
                color: intentFilter === i ? INTENT_COLORS[i] : '#52525b',
              }}>
              {i}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {loading ? (
            <p style={{ color:'#52525b', textAlign:'center', padding:48 }}>Cargando...</p>
          ) : items.length === 0 ? (
            <div style={{ textAlign:'center', padding:48, background:'#18181b', borderRadius:14, border:'1px solid #27272a' }}>
              <MessageSquare size={36} style={{ color:'#27272a', margin:'0 auto 12px', display:'block' }}/>
              <p style={{ color:'#52525b', fontSize:14 }}>
                {search || intentFilter ? 'Sin resultados para estos filtros' : 'Sin conversaciones aún'}
              </p>
            </div>
          ) : items.map(conv => {
            const color = INTENT_COLORS[conv.intent ?? ''] ?? '#52525b'
            const isUser = conv.role === 'user'
            return (
              <a key={conv.id} href={`/contactos/${conv.phone}`}
                style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, textDecoration:'none' }}
                onMouseEnter={e => { e.currentTarget.style.background='#1f1f23'; e.currentTarget.style.borderColor='#3f3f46' }}
                onMouseLeave={e => { e.currentTarget.style.background='#18181b'; e.currentTarget.style.borderColor='#27272a' }}>

                <div style={{ width:40, height:40, borderRadius:'50%', flexShrink:0, background:color+'22', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <MessageSquare size={16} style={{ color }}/>
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {conv.contact_name ? (
                        <>
                          <span style={{ color:'#e4e4e7', fontSize:13, fontWeight:600 }}>{conv.contact_name}</span>
                          <span style={{ color:'#52525b', fontSize:11, fontFamily:'monospace' }}>{conv.phone}</span>
                        </>
                      ) : (
                        <span style={{ color:'#a1a1aa', fontSize:13, fontFamily:'monospace' }}>{conv.phone}</span>
                      )}
                    </div>
                    <span style={{ color:'#52525b', fontSize:11, flexShrink:0 }}>
                      {new Date(conv.timestamp).toLocaleDateString('es-CO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                  <p style={{ color:'#71717a', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {isUser ? '👤 ' : '🤖 '}{conv.message}
                  </p>
                </div>

                {conv.intent && (
                  <span style={{ background:color+'22', color, border:`1px solid ${color}44`, borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:600, flexShrink:0 }}>
                    {conv.intent}
                  </span>
                )}
              </a>
            )
          })}
        </div>

        {/* Paginación */}
        {total > 50 && (
          <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'center', marginTop:20 }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              style={{ padding:'7px 14px', background:'#18181b', border:'1px solid #27272a', borderRadius:8, color:'#a1a1aa', cursor:'pointer', fontSize:13 }}>
              ← Anterior
            </button>
            <span style={{ color:'#a1a1aa', fontSize:13 }}>Página {page}</span>
            <button onClick={() => setPage(p => p+1)} disabled={items.length < 50}
              style={{ padding:'7px 14px', background:'#18181b', border:'1px solid #27272a', borderRadius:8, color:'#a1a1aa', cursor:'pointer', fontSize:13 }}>
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Modal limpiar */}
      {showCleanup && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#18181b', border:'1px solid #7f1d1d', borderRadius:16, padding:28, width:420, maxWidth:'95vw' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ color:'#fff', fontSize:16, fontWeight:700 }}>🗑️ Limpiar conversaciones antiguas</h2>
              <button onClick={() => { setShowCleanup(false); setCleanResult('') }}
                style={{ background:'transparent', border:'none', color:'#71717a', cursor:'pointer' }}>
                <X size={18}/>
              </button>
            </div>
            <p style={{ color:'#a1a1aa', fontSize:13, marginBottom:20, lineHeight:1.6 }}>
              Elimina el historial de mensajes antiguos. Los contactos no se borran.
            </p>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:8, textTransform:'uppercase' }}>
                Eliminar anteriores a:
              </label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[7,14,30,60,90].map(d => (
                  <button key={d} onClick={() => setCleanupDays(d)}
                    style={{ padding:'7px 14px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, border:`1px solid ${cleanupDays===d ? '#ef4444' : '#27272a'}`, background:cleanupDays===d ? '#3f1212' : 'transparent', color:cleanupDays===d ? '#f87171' : '#71717a' }}>
                    {d} días
                  </button>
                ))}
              </div>
            </div>
            {cleanResult && (
              <div style={{ background:cleanResult.startsWith('✅') ? '#0c1a0c' : '#3f1212', border:`1px solid ${cleanResult.startsWith('✅') ? '#14532d' : '#7f1d1d'}`, borderRadius:8, padding:'10px 14px', color:cleanResult.startsWith('✅') ? '#86efac' : '#fca5a5', fontSize:13, marginBottom:16 }}>
                {cleanResult}
              </div>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setShowCleanup(false); setCleanResult('') }}
                style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleCleanup} disabled={cleaning}
                style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background:'#7f1d1d', color:'#fca5a5', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                {cleaning ? 'Eliminando...' : `🗑️ Eliminar anteriores a ${cleanupDays} días`}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}