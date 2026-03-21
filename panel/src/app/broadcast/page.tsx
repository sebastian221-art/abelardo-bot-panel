'use client'
// 📄 panel/src/app/broadcast/page.tsx
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { getBroadcasts, sendBroadcast, cancelBroadcast } from '@/lib/api'
import { Send, Plus, Ban, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react'

const STATUS_LABEL: Record<string,string> = {
  draft:'Borrador', scheduled:'Programado', sending:'Enviando...', sent:'Enviado', cancelled:'Cancelado', failed:'Fallido',
}
const STATUS_COLOR: Record<string,string> = {
  draft:'#71717a', scheduled:'#f59e0b', sending:'#0ea5e9', sent:'#22c55e', cancelled:'#52525b', failed:'#ef4444',
}

export default function BroadcastPage() {
  const [items,   setItems]   = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const d = await getBroadcasts() as Record<string,unknown>
    setItems(d.items as unknown[] || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSend(id: number) {
    if (!confirm('¿Confirmas el envío masivo?')) return
    setSending(id)
    await sendBroadcast(id)
    setSending(null)
    load()
  }

  async function handleCancel(id: number) {
    if (!confirm('¿Cancelar este broadcast?')) return
    await cancelBroadcast(id)
    load()
  }

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:1000 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
          <div>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>Broadcasts</h1>
            <p style={{ color:'#71717a', fontSize:13 }}>Envíos masivos a los simpatizantes</p>
          </div>
          <a href="/broadcast/nuevo" style={{
            display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
            borderRadius:9, border:'none', background:'#CE1126', color:'#fff',
            fontSize:13, fontWeight:600, textDecoration:'none',
          }}>
            <Plus size={15}/> Nuevo broadcast
          </a>
        </div>

        {loading ? (
          <p style={{ color:'#52525b', textAlign:'center', padding:48 }}>Cargando...</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign:'center', padding:64 }}>
            <Send size={40} style={{ color:'#27272a', margin:'0 auto 12px', display:'block' }}/>
            <p style={{ color:'#52525b', fontSize:14 }}>Sin broadcasts. Crea el primero.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {items.map((item: unknown) => {
              const b = item as Record<string, string | number | boolean | null | undefined>
              const color = STATUS_COLOR[b.status as string] || '#71717a'
              const isSent = b.status === 'sent'
              const canSend = b.status === 'draft' || b.status === 'scheduled'
              return (
                <div key={b.id as number} style={{
                  background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:'18px 20px',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                        <h3 style={{ color:'#fff', fontSize:14, fontWeight:600 }}>{b.title as string}</h3>
                        <span style={{
                          background: color + '22', color, border:`1px solid ${color}44`,
                          borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:600,
                        }}>{STATUS_LABEL[b.status as string]}</span>
                      </div>
                      <p style={{ color:'#71717a', fontSize:12, marginBottom:8 }}>
                        Segmento: <strong style={{ color:'#a1a1aa' }}>{b.segment as string}</strong>
                        {b.segment_value && <> · <strong style={{ color:'#a1a1aa' }}>{b.segment_value as string}</strong></>}
                      </p>
                      <p style={{ color:'#a1a1aa', fontSize:13, lineHeight:1.5 }}>
                        {(b.message as string).slice(0, 120)}{(b.message as string).length > 120 ? '...' : ''}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div style={{ display:'flex', gap:8, marginLeft:16, flexShrink:0 }}>
                      {canSend && (
                        <button onClick={() => handleSend(b.id as number)} disabled={sending === b.id}
                          style={{
                            display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                            borderRadius:8, border:'none', background:'#CE1126', color:'#fff',
                            fontSize:12, fontWeight:600, cursor:'pointer',
                          }}>
                          {sending === b.id ? <Loader size={12} style={{ animation:'spin 1s linear infinite' }}/> : <Send size={12}/>}
                          {sending === b.id ? 'Enviando...' : 'Enviar ahora'}
                        </button>
                      )}
                      {canSend && (
                        <button onClick={() => handleCancel(b.id as number)}
                          style={{
                            display:'flex', alignItems:'center', gap:6, padding:'7px 12px',
                            borderRadius:8, border:'1px solid #27272a', background:'transparent',
                            color:'#71717a', fontSize:12, cursor:'pointer',
                          }}>
                          <Ban size={12}/> Cancelar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  {isSent && (
                    <div style={{ display:'flex', gap:20, borderTop:'1px solid #27272a', paddingTop:12, marginTop:4 }}>
                      {[
                        { label:'Objetivo',   val: b.total_targets as number, color:'#71717a' },
                        { label:'Enviados',   val: b.sent_count as number,    color:'#22c55e' },
                        { label:'Fallidos',   val: b.failed_count as number,  color:'#ef4444' },
                      ].map(s => (
                        <div key={s.label}>
                          <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase' }}>{s.label}</p>
                          <p style={{ color: s.color, fontSize:18, fontWeight:700 }}>{s.val as number}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}