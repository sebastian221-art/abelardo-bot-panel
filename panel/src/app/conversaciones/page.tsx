'use client'
// 📄 panel/src/app/conversaciones/page.tsx
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { getConversations } from '@/lib/api'
import { Search, MessageSquare } from 'lucide-react'

export default function ConversacionesPage() {
  const [data,    setData]    = useState<Record<string,unknown>>({ total:0, items:[] })
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const d = await getConversations(page, search)
    setData(d as Record<string,unknown>)
    setLoading(false)
  }

  useEffect(() => { load() }, [page])

  const items = (data.items as unknown[]) || []

  const INTENT_COLORS: Record<string,string> = {
    propuesta:'#6366f1', seguridad:'#ef4444', economia:'#f59e0b',
    salud:'#10b981', educacion:'#0ea5e9', paz:'#22c55e',
    corrupcion:'#f97316', embajador:'#FCD116', optin:'#22c55e', optout:'#f87171',
  }

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:900 }}>
        <h1 style={{ color:'#fff', fontSize:22, fontWeight:700, marginBottom:6 }}>Conversaciones</h1>
        <p style={{ color:'#71717a', fontSize:13, marginBottom:24 }}>Último mensaje de cada contacto</p>

        {/* Buscar */}
        <div style={{ position:'relative', marginBottom:20 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#52525b' }}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="Buscar por teléfono o mensaje... (Enter)"
            style={{
              width:'100%', padding:'10px 12px 10px 36px',
              background:'#18181b', border:'1px solid #27272a', borderRadius:9,
              color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box',
            }}
          />
        </div>

        {/* Lista */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {loading ? (
            <p style={{ color:'#52525b', textAlign:'center', padding:40 }}>Cargando...</p>
          ) : items.length === 0 ? (
            <p style={{ color:'#52525b', textAlign:'center', padding:40 }}>Sin conversaciones aún</p>
          ) : items.map((item: unknown) => {
            const conv  = item as Record<string,unknown>
            const color = INTENT_COLORS[conv.intent as string] || '#52525b'
            return (
              <a key={conv.id as number} href={`/contactos/${conv.phone}`}
                style={{
                  background:'#18181b', border:'1px solid #27272a', borderRadius:12,
                  padding:'14px 16px', display:'flex', alignItems:'center', gap:14,
                  textDecoration:'none', transition:'border-color .15s',
                }}>
                <div style={{
                  width:38, height:38, borderRadius:'50%', flexShrink:0,
                  background: color + '22',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <MessageSquare size={16} style={{ color }}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ color:'#e4e4e7', fontSize:13, fontWeight:600 }}>{conv.phone as string}</span>
                    <span style={{ color:'#52525b', fontSize:11 }}>{new Date(conv.timestamp as string).toLocaleDateString('es-CO')}</span>
                  </div>
                  <p style={{ color:'#71717a', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {conv.role === 'user' ? '👤 ' : '🤖 '}{conv.message as string}
                  </p>
                </div>
                {conv.intent && (
                  <span style={{
                    background: color + '22', color, border:`1px solid ${color}44`,
                    borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:600, flexShrink:0,
                  }}>{conv.intent as string}</span>
                )}
              </a>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
