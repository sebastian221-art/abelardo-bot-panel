'use client'
// 📄 panel/src/app/broadcast/page.tsx  ← REEMPLAZA EL ANTERIOR
import { useEffect, useState, useRef } from 'react'
import Layout from '@/components/Layout'
import { getBroadcasts, sendBroadcast, cancelBroadcast, pauseBroadcast, resumeBroadcast, duplicateBroadcast, getBroadcastLogs } from '@/lib/api'
import { Send, Plus, Ban, Loader, Pause, Play, Copy, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

const STATUS_LABEL: Record<string,string> = {
  draft:'Borrador', scheduled:'Programado', sending:'Enviando...',
  sent:'Enviado', cancelled:'Cancelado', failed:'Fallido', paused:'Pausado',
}
const STATUS_COLOR: Record<string,string> = {
  draft:'#71717a', scheduled:'#f59e0b', sending:'#0ea5e9',
  sent:'#22c55e', cancelled:'#52525b', failed:'#ef4444', paused:'#f97316',
}

type BroadcastItem = Record<string, string | number | boolean | null | undefined>
type LogItem = { phone: string; status: string; error?: string; sent_at?: string }

function StatusIcon({ status }: { status: string }) {
  if (status === 'sending') return <Loader size={10} style={{ animation:'spin 1s linear infinite' }}/>
  const icons: Record<string,string> = { sent:'✅', failed:'❌', cancelled:'🚫', paused:'⏸️', draft:'📝', scheduled:'🕐' }
  return <span>{icons[status] || '•'}</span>
}

export default function BroadcastPage() {
  const [items,        setItems]        = useState<BroadcastItem[]>([])
  const [loading,      setLoading]      = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [actionId,     setActionId]     = useState<number | null>(null)
  const [expanded,     setExpanded]     = useState<number | null>(null)
  const [logs,         setLogs]         = useState<Record<number, LogItem[]>>({})
  const [loadingLogs,  setLoadingLogs]  = useState<number | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  async function load() {
    setLoading(true)
    const d = await getBroadcasts(1, statusFilter) as Record<string,unknown>
    setItems((d.items as BroadcastItem[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  useEffect(() => {
    const hasSending = items.some(b => b.status === 'sending')
    if (hasSending) {
      pollRef.current = setInterval(load, 5000)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [items])

  async function handleAction(fn: () => Promise<unknown>, id: number) {
    setActionId(id)
    try { await fn(); await load() }
    finally { setActionId(null) }
  }

  async function handleSend(id: number) {
    if (!confirm('¿Confirmas el envío masivo? Esta acción no se puede deshacer.')) return
    handleAction(() => sendBroadcast(id), id)
  }

  async function handleLoadLogs(id: number) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (logs[id]) return
    setLoadingLogs(id)
    const d = await getBroadcastLogs(id) as Record<string,unknown>
    setLogs(prev => ({ ...prev, [id]: (d.items as LogItem[]) || [] }))
    setLoadingLogs(null)
  }

  function progressPercent(b: BroadcastItem) {
    const total = (b.total_targets as number) || 0
    const done  = ((b.sent_count as number) || 0) + ((b.failed_count as number) || 0)
    if (!total) return 0
    return Math.round((done / total) * 100)
  }

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:1050 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>Broadcasts</h1>
            <p style={{ color:'#71717a', fontSize:13 }}>Envíos masivos a los simpatizantes</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={load}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:12, cursor:'pointer' }}>
              <RefreshCw size={13}/> Actualizar
            </button>
            <a href="/broadcast/nuevo" style={{
              display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
              borderRadius:9, border:'none', background:'#CE1126', color:'#fff',
              fontSize:13, fontWeight:600, textDecoration:'none',
            }}>
              <Plus size={15}/> Nuevo broadcast
            </a>
          </div>
        </div>

        {/* Filtros por estado */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {['', 'draft', 'sending', 'paused', 'sent', 'failed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
                border:`1px solid ${statusFilter === s ? (STATUS_COLOR[s] || '#FCD116') : '#27272a'}`,
                background: statusFilter === s ? (STATUS_COLOR[s] || '#FCD116') + '22' : 'transparent',
                color: statusFilter === s ? (STATUS_COLOR[s] || '#FCD116') : '#71717a',
              }}>
              {s === '' ? 'Todos' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <p style={{ color:'#52525b', textAlign:'center', padding:48 }}>Cargando...</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign:'center', padding:64, background:'#18181b', borderRadius:14, border:'1px solid #27272a' }}>
            <Send size={40} style={{ color:'#27272a', margin:'0 auto 12px', display:'block' }}/>
            <p style={{ color:'#52525b', fontSize:14 }}>
              Sin broadcasts{statusFilter ? ` con estado "${STATUS_LABEL[statusFilter]}"` : ''}.
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {items.map(b => {
              const color     = STATUS_COLOR[b.status as string] || '#71717a'
              const canSend   = b.status === 'draft' || b.status === 'scheduled'
              const isSending = b.status === 'sending'
              const isPaused  = b.status === 'paused'
              const isSent    = b.status === 'sent'
              const pct       = progressPercent(b)
              const isActing  = actionId === (b.id as number)

              return (
                <div key={b.id as number} style={{
                  background:'#18181b',
                  border:`1px solid ${isSending ? '#0ea5e933' : '#27272a'}`,
                  borderRadius:14, overflow:'hidden',
                }}>
                  <div style={{ padding:'18px 20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, flexWrap:'wrap' }}>
                          <h3 style={{ color:'#fff', fontSize:14, fontWeight:600 }}>{b.title as string}</h3>
                          <span style={{
                            background: color + '22', color,
                            border:`1px solid ${color}44`,
                            borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:600,
                            display:'flex', alignItems:'center', gap:4,
                          }}>
                            <StatusIcon status={b.status as string}/> {STATUS_LABEL[b.status as string]}
                          </span>
                          {b.template_name && (
                            <span style={{ background:'#1e1b4b', color:'#818cf8', borderRadius:6, padding:'2px 8px', fontSize:10 }}>
                              📋 {b.template_name as string}
                            </span>
                          )}
                        </div>
                        <p style={{ color:'#71717a', fontSize:12, marginBottom:6 }}>
                          Segmento: <strong style={{ color:'#a1a1aa' }}>{b.segment as string}</strong>
                          {b.segment_value && <> · <strong style={{ color:'#a1a1aa' }}>{b.segment_value as string}</strong></>}
                          {b.created_at && (
                            <> · <span style={{ color:'#3f3f46' }}>
                              {new Date(b.created_at as string).toLocaleDateString('es-CO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                            </span></>
                          )}
                        </p>
                        {(b.message as string) && (
                          <p style={{ color:'#a1a1aa', fontSize:12, lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:500 }}>
                            {b.message as string}
                          </p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div style={{ display:'flex', gap:6, marginLeft:16, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
                        {canSend && (
                          <button onClick={() => handleSend(b.id as number)} disabled={isActing}
                            style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:8, border:'none', background:'#CE1126', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            {isActing ? <Loader size={12} style={{ animation:'spin 1s linear infinite' }}/> : <Send size={12}/>}
                            Enviar
                          </button>
                        )}
                        {isSending && (
                          <button onClick={() => handleAction(() => pauseBroadcast(b.id as number), b.id as number)} disabled={isActing}
                            style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:8, border:'1px solid #f9703344', background:'#f9703311', color:'#f97033', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            <Pause size={12}/> Pausar
                          </button>
                        )}
                        {isPaused && (
                          <button onClick={() => handleAction(() => resumeBroadcast(b.id as number), b.id as number)} disabled={isActing}
                            style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:8, border:'1px solid #22c55e44', background:'#22c55e11', color:'#22c55e', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            <Play size={12}/> Reanudar
                          </button>
                        )}
                        {(isSent || isPaused) && (
                          <button onClick={() => handleAction(() => duplicateBroadcast(b.id as number), b.id as number)} disabled={isActing}
                            style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:12, cursor:'pointer' }}>
                            <Copy size={12}/> Duplicar
                          </button>
                        )}
                        {canSend && (
                          <button onClick={() => handleAction(() => cancelBroadcast(b.id as number), b.id as number)} disabled={isActing}
                            style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 10px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:12, cursor:'pointer' }}>
                            <Ban size={12}/>
                          </button>
                        )}
                        {(isSent || isSending || isPaused) && (
                          <button onClick={() => handleLoadLogs(b.id as number)}
                            style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 10px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:12, cursor:'pointer' }}>
                            {expanded === (b.id as number) ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    {(isSending || isPaused) && (b.total_targets as number) > 0 && (
                      <div style={{ marginTop:12 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ color:'#71717a', fontSize:11 }}>
                            {(b.sent_count as number) + (b.failed_count as number)} de {b.total_targets as number} procesados
                          </span>
                          <span style={{ color: isSending ? '#0ea5e9' : '#f97316', fontSize:11, fontWeight:700 }}>{pct}%</span>
                        </div>
                        <div style={{ background:'#27272a', borderRadius:4, height:6, overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background: isSending ? '#0ea5e9' : '#f97316', borderRadius:4, transition:'width .5s' }}/>
                        </div>
                        <div style={{ display:'flex', gap:16, marginTop:6 }}>
                          <span style={{ color:'#22c55e', fontSize:11 }}>✅ {b.sent_count as number} enviados</span>
                          <span style={{ color:'#ef4444', fontSize:11 }}>❌ {b.failed_count as number} fallidos</span>
                        </div>
                      </div>
                    )}

                    {/* Stats finales */}
                    {isSent && (
                      <div style={{ display:'flex', gap:24, borderTop:'1px solid #27272a', paddingTop:12, marginTop:8 }}>
                        {[
                          { label:'Objetivo',   val: b.total_targets as number, color:'#71717a' },
                          { label:'Enviados',   val: b.sent_count as number,    color:'#22c55e' },
                          { label:'Fallidos',   val: b.failed_count as number,  color:'#ef4444' },
                          { label:'Tasa éxito', val: b.total_targets ? `${Math.round(((b.sent_count as number) / (b.total_targets as number)) * 100)}%` : '—', color:'#0ea5e9' },
                        ].map(s => (
                          <div key={s.label}>
                            <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase', marginBottom:2 }}>{s.label}</p>
                            <p style={{ color: s.color, fontSize:18, fontWeight:700 }}>{s.val}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Logs expandibles */}
                  {expanded === (b.id as number) && (
                    <div style={{ borderTop:'1px solid #27272a', padding:'14px 20px', background:'#111113' }}>
                      {loadingLogs === (b.id as number) ? (
                        <p style={{ color:'#52525b', fontSize:12 }}>Cargando logs...</p>
                      ) : (
                        <>
                          <p style={{ color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:10, textTransform:'uppercase' }}>
                            Detalle de envíos ({(logs[b.id as number] || []).length})
                          </p>
                          <div style={{ maxHeight:200, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
                            {(logs[b.id as number] || []).map((l, i) => (
                              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 10px', background:'#18181b', borderRadius:6, fontSize:11 }}>
                                <span style={{ color:'#a1a1aa', fontFamily:'monospace' }}>{l.phone}</span>
                                <span style={{ color: l.status === 'sent' ? '#22c55e' : '#ef4444', fontWeight:600 }}>
                                  {l.status === 'sent' ? '✅ Enviado' : `❌ ${l.error || 'Fallido'}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </Layout>
  )
}