'use client'
// 📄 panel/src/app/encuestas/page.tsx  ← REEMPLAZA EL ANTERIOR
import { useState, useEffect, useRef } from 'react'
import Layout from '@/components/Layout'
import { createBroadcast, sendBroadcast, previewBroadcast, getBroadcasts, getGroups } from '@/lib/api'
import { ClipboardList, Send, Users, ChevronDown, ChevronUp, Image as ImageIcon, Link, BarChart2, RefreshCw } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
const COLORS  = ['#6366f1', '#CE1126', '#22c55e', '#f59e0b', '#0ea5e9']

const PLANTILLAS = [
  { titulo:'¿Cuál es el problema más urgente en tu ciudad?', opciones:['Inseguridad','Desempleo','Salud','Educación'] },
  { titulo:'¿Por qué apoyarías a Abelardo?', opciones:['Sus propuestas de seguridad','Su plan económico','Su lucha contra la corrupción','Su liderazgo'] },
  { titulo:'¿Qué propuesta de Abelardo te parece más importante?', opciones:['Plan de choque en salud','Plan Patriota II','Empleo y economía','Lucha contra la corrupción'] },
  { titulo:'¿Hablarás de Abelardo con tus familiares y amigos?', opciones:['Sí, con muchos','Con algunos','Prefiero no hablar de política'] },
  { titulo:'¿Cuál es tu mayor preocupación para las elecciones 2026?', opciones:['La corrupción','La inseguridad','El desempleo','El futuro de la educación'] },
]

const MEDIA_TIPOS = [
  { value:'none',  icon:'✍️', label:'Solo texto' },
  { value:'image', icon:'🖼️', label:'Con imagen' },
  { value:'link',  icon:'🔗', label:'Con link' },
]

type Group = { id: number; name: string; color: string; icon: string; count: number }
type SurveyResult = { option: string; count: number; percent: number }
type HistoryItem  = Record<string, unknown>

const inputSt: React.CSSProperties = {
  width:'100%', padding:'10px 12px', background:'#09090b',
  border:'1px solid #27272a', borderRadius:8, color:'#fff',
  fontSize:13, outline:'none', boxSizing:'border-box',
}
const labelSt: React.CSSProperties = {
  display:'block', color:'#a1a1aa', fontSize:11,
  fontWeight:600, marginBottom:6, textTransform:'uppercase',
}

const BASE_SEGMENTS = [
  { value:'todos',      label:'Todos',           desc:'Todos los contactos',              color:'#FCD116' },
  { value:'opted_in',  label:'Solo opt-in',      desc:'Quienes aceptaron mensajes',       color:'#22c55e' },
  { value:'city',      label:'Por ciudad',       desc:'Filtra por ciudad',                color:'#0ea5e9' },
  { value:'department',label:'Por departamento', desc:'Filtra por departamento',          color:'#6366f1' },
  { value:'interest',  label:'Por interés',      desc:'seguridad / economia / salud...',  color:'#f59e0b' },
]

export default function EncuestasPage() {
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Formulario ────────────────────────────────────────────────
  const [pregunta,  setPregunta]  = useState('')
  const [opciones,  setOpciones]  = useState(['','','','',''])
  const [segment,   setSegment]   = useState('todos')
  const [segVal,    setSegVal]    = useState('')
  const [mediaType, setMediaType] = useState('none')
  const [mediaUrl,  setMediaUrl]  = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview,setMediaPreview] = useState('')
  const [linkUrl,   setLinkUrl]   = useState('')
  const [preview,   setPreview]   = useState<number | null>(null)
  const [previewWarn,setPreviewWarn] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState('')
  const [error,     setError]     = useState('')
  const [showMsgPreview, setShowMsgPreview] = useState(false)

  // ── Historial ─────────────────────────────────────────────────
  const [history,      setHistory]      = useState<HistoryItem[]>([])
  const [loadingHist,  setLoadingHist]  = useState(true)
  const [expandedHist, setExpandedHist] = useState<number | null>(null)
  const [results,      setResults]      = useState<Record<number, SurveyResult[]>>({})
  const [loadingRes,   setLoadingRes]   = useState<number | null>(null)

  // ── Grupos ────────────────────────────────────────────────────
  const [groups, setGroups] = useState<Group[]>([])

  const GROUP_SEGMENTS = groups.map(g => ({
    value: `group_${g.id}`, label: `${g.icon} ${g.name}`,
    desc: `${g.count} contactos`, color: g.color,
  }))
  const ALL_SEGMENTS = [...BASE_SEGMENTS, ...GROUP_SEGMENTS]

  useEffect(() => {
    getGroups().then(g => setGroups(g as Group[])).catch(() => {})
    loadHistory()
  }, [])

  useEffect(() => {
    const realSeg = segment.startsWith('group_') ? 'group' : segment
    const realVal = segment.startsWith('group_') ? segment.replace('group_', '') : segVal
    previewBroadcast(realSeg, realVal)
      .then((r: unknown) => {
        const total = (r as Record<string,number>).total_targets
        setPreview(total)
        if ((segment === 'city' || segment === 'department') && segVal && total === 0) {
          setPreviewWarn(`⚠️ No hay contactos con ese ${segment === 'city' ? 'ciudad' : 'departamento'}. Verifica los datos.`)
        } else {
          setPreviewWarn('')
        }
      })
      .catch(() => setPreview(null))
  }, [segment, segVal])

  async function loadHistory() {
    setLoadingHist(true)
    try {
      // Traer broadcasts que empiecen con "Encuesta:"
      const d = await getBroadcasts(1, 'sent') as Record<string,unknown>
      const all = (d.items as HistoryItem[]) || []
      setHistory(all.filter(b => (b.title as string)?.startsWith('Encuesta:')))
    } catch { /* noop */ }
    setLoadingHist(false)
  }

  async function loadResults(broadcastId: number) {
    if (results[broadcastId]) return
    setLoadingRes(broadcastId)
    try {
      const token = localStorage.getItem('token')
      const res   = await fetch(`${API}/broadcast/${broadcastId}/survey-results`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setResults(prev => ({ ...prev, [broadcastId]: data as SurveyResult[] }))
      }
    } catch { /* noop */ }
    setLoadingRes(null)
  }

  function loadTemplate(t: typeof PLANTILLAS[0]) {
    setPregunta(t.titulo)
    const n = ['','','','','']
    t.opciones.forEach((o, i) => { n[i] = o })
    setOpciones(n)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    const reader = new FileReader()
    reader.onload = ev => setMediaPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function buildMessage(optsValidas: string[]): string {
    const lineas = optsValidas.map((op, i) => `${EMOJIS[i]} ${op}`).join('\n')
    let msg = `📊 *Encuesta de la campaña* 🇨🇴\n\n*${pregunta}*\n\n${lineas}\n\n_Responde con el número de tu opción (1, 2, 3...). Tu opinión importa._`
    if (mediaType === 'link' && linkUrl) msg += `\n\n🔗 ${linkUrl}`
    return msg
  }

  async function handleSend() {
    setError(''); setSuccess('')
    if (!pregunta.trim()) return setError('Escribe la pregunta de la encuesta')
    const optsValidas = opciones.filter(o => o.trim())
    if (optsValidas.length < 2) return setError('Agrega al menos 2 opciones')
    if (preview === 0) return setError('No hay contactos en el segmento seleccionado')
    if (previewWarn) return setError(previewWarn)
    if (mediaType === 'image' && !mediaUrl && !mediaFile) return setError('Agrega una imagen o URL')
    if (mediaType === 'link' && !linkUrl.trim()) return setError('Agrega el link')

    setLoading(true)
    try {
      const finalMediaUrl = mediaFile ? mediaPreview : mediaUrl
      const realSeg = segment.startsWith('group_') ? 'group' : segment
      const realVal = segment.startsWith('group_') ? segment.replace('group_', '') : segVal

      const b = await createBroadcast({
        title:         `Encuesta: ${pregunta.slice(0, 60)}`,
        message:       buildMessage(optsValidas),
        segment:       realSeg,
        segment_value: realVal,
        media_url:     mediaType === 'image' ? finalMediaUrl : '',
        media_type:    mediaType === 'image' ? 'image' : '',
      }) as Record<string, unknown>

      await sendBroadcast(b.id as number)
      setSuccess(`✅ Encuesta enviada a ${preview?.toLocaleString() ?? '...'} contactos`)
      setPregunta(''); setOpciones(['','','','','']); setPreview(null)
      setMediaUrl(''); setMediaFile(null); setMediaPreview(''); setLinkUrl('')
      setMediaType('none')
      loadHistory()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al enviar')
    } finally {
      setLoading(false)
    }
  }

  const optsValidas = opciones.filter(o => o.trim())

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:800 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <ClipboardList size={22} style={{ color:'#6366f1' }}/>
          <h1 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>Encuestas</h1>
        </div>
        <p style={{ color:'#71717a', fontSize:13, marginBottom:28 }}>
          Envía preguntas a los simpatizantes y mide el pulso de la campaña
        </p>

        {/* ── PLANTILLAS RÁPIDAS ── */}
        <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:20, marginBottom:20 }}>
          <p style={{ color:'#a1a1aa', fontSize:12, fontWeight:600, textTransform:'uppercase', marginBottom:12 }}>
            Plantillas rápidas
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {PLANTILLAS.map((t, i) => (
              <button key={i} onClick={() => loadTemplate(t)}
                style={{ padding:'9px 14px', borderRadius:9, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, cursor:'pointer', textAlign:'left', transition:'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.color='#fff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#27272a'; e.currentTarget.style.color='#a1a1aa' }}>
                📋 {t.titulo}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONSTRUCTOR ── */}
        <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:24 }}>
          <p style={{ color:'#fff', fontWeight:600, fontSize:15, marginBottom:20 }}>Crear encuesta</p>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Pregunta */}
            <div>
              <label style={labelSt}>Pregunta *</label>
              <input value={pregunta} onChange={e => setPregunta(e.target.value)}
                placeholder="ej: ¿Cuál es el problema más urgente en tu ciudad?" style={inputSt}/>
            </div>

            {/* Opciones */}
            <div>
              <label style={labelSt}>Opciones de respuesta (mínimo 2, máximo 5)</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {opciones.map((op, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ color: op.trim() ? COLORS[i] : '#52525b', fontSize:16, width:28, flexShrink:0 }}>
                      {EMOJIS[i]}
                    </span>
                    <input value={op}
                      onChange={e => { const n=[...opciones]; n[i]=e.target.value; setOpciones(n) }}
                      placeholder={i < 2 ? `Opción ${i+1} *` : `Opción ${i+1} (opcional)`}
                      style={{ ...inputSt, borderColor: op.trim() ? COLORS[i]+'66' : '#27272a' }}/>
                  </div>
                ))}
              </div>
              <p style={{ color:'#52525b', fontSize:11, marginTop:6 }}>{optsValidas.length} opción(es) configurada(s)</p>
            </div>

            {/* Media */}
            <div>
              <label style={labelSt}>Contenido adicional</label>
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                {MEDIA_TIPOS.map(m => (
                  <button key={m.value} onClick={() => { setMediaType(m.value); setMediaUrl(''); setMediaFile(null); setMediaPreview(''); setLinkUrl('') }}
                    style={{
                      padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600,
                      border:`1px solid ${mediaType === m.value ? '#6366f1' : '#27272a'}`,
                      background: mediaType === m.value ? '#1e1b4b' : 'transparent',
                      color: mediaType === m.value ? '#818cf8' : '#71717a',
                    }}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>

              {mediaType === 'image' && (
                <div>
                  <div style={{ display:'flex', gap:10, marginBottom:8 }}>
                    <button onClick={() => fileRef.current?.click()}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:7, border:'1px solid #27272a', background:'#18181b', color:'#a1a1aa', fontSize:12, cursor:'pointer' }}>
                      <ImageIcon size={13}/> Subir imagen
                    </button>
                    <span style={{ color:'#52525b', fontSize:12, alignSelf:'center' }}>o URL:</span>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileChange}/>
                  <input value={mediaUrl} onChange={e => { setMediaUrl(e.target.value); setMediaFile(null); setMediaPreview('') }}
                    placeholder="https://i.ibb.co/ejemplo.jpg" style={inputSt}/>
                  {(mediaPreview || mediaUrl) && (
                    <div style={{ marginTop:8, borderRadius:8, overflow:'hidden', border:'1px solid #27272a', maxWidth:240 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaPreview || mediaUrl} alt="preview" style={{ width:'100%', display:'block', maxHeight:120, objectFit:'cover' }}/>
                    </div>
                  )}
                </div>
              )}

              {mediaType === 'link' && (
                <div>
                  <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                    placeholder="https://defensoresdelapatria.com/propuestas" style={inputSt}/>
                  <p style={{ color:'#52525b', fontSize:11, marginTop:4 }}>El link se incluirá al final del mensaje</p>
                </div>
              )}
            </div>

            {/* Segmento */}
            <div>
              <label style={labelSt}>Enviar a</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {BASE_SEGMENTS.map(s => (
                  <button key={s.value} type="button" onClick={() => { setSegment(s.value); setSegVal(''); setPreview(null) }}
                    style={{
                      padding:'9px 14px', borderRadius:9, cursor:'pointer', textAlign:'left',
                      border:`1px solid ${segment === s.value ? s.color : '#27272a'}`,
                      background: segment === s.value ? s.color+'15' : 'transparent',
                    }}>
                    <span style={{ color: segment === s.value ? s.color : '#a1a1aa', fontWeight:600, fontSize:13 }}>{s.label}</span>
                    <span style={{ color:'#52525b', fontSize:11, marginLeft:8 }}>{s.desc}</span>
                  </button>
                ))}

                {GROUP_SEGMENTS.length > 0 && (
                  <>
                    <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase', marginTop:4, marginBottom:2 }}>Grupos</p>
                    {GROUP_SEGMENTS.map(s => (
                      <button key={s.value} type="button" onClick={() => { setSegment(s.value); setSegVal(''); setPreview(null) }}
                        style={{
                          padding:'9px 14px', borderRadius:9, cursor:'pointer', textAlign:'left',
                          border:`1px solid ${segment === s.value ? s.color : '#27272a'}`,
                          background: segment === s.value ? s.color+'15' : 'transparent',
                        }}>
                        <span style={{ color: segment === s.value ? s.color : '#a1a1aa', fontWeight:600, fontSize:13 }}>{s.label}</span>
                        <span style={{ color:'#52525b', fontSize:11, marginLeft:8 }}>{s.desc}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>

              {['city','department','interest'].includes(segment) && (
                <input value={segVal} onChange={e => { setSegVal(e.target.value); setPreview(null) }}
                  placeholder={segment==='city' ? 'ej: San Gil' : segment==='department' ? 'ej: Santander' : 'ej: seguridad'}
                  style={{ ...inputSt, marginTop:10 }}/>
              )}
            </div>

            {/* Preview contador */}
            {preview !== null && (
              <div style={{
                background: preview === 0 ? '#3f1212' : '#0c1a0c',
                border:`1px solid ${preview === 0 ? '#7f1d1d' : '#14532d'}`,
                borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:10,
              }}>
                <Users size={15} style={{ color: preview === 0 ? '#ef4444' : '#22c55e', flexShrink:0 }}/>
                <p style={{ color: preview === 0 ? '#fca5a5' : '#22c55e', fontSize:13 }}>
                  <strong>{preview.toLocaleString()}</strong> contactos recibirán esta encuesta
                </p>
              </div>
            )}

            {previewWarn && (
              <div style={{ background:'#2d1a00', border:'1px solid #f59e0b44', borderRadius:8, padding:'9px 14px', color:'#fbbf24', fontSize:12 }}>
                {previewWarn}
              </div>
            )}

            {/* Vista previa WhatsApp */}
            {pregunta && optsValidas.length >= 2 && (
              <div>
                <button onClick={() => setShowMsgPreview(!showMsgPreview)}
                  style={{ padding:'5px 12px', borderRadius:7, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:11, cursor:'pointer', marginBottom:8 }}>
                  {showMsgPreview ? '👁️ Ocultar preview' : '👁️ Ver como WhatsApp'}
                </button>
                {showMsgPreview && (
                  <div style={{ padding:16, background:'#0b141a', borderRadius:12, maxWidth:340 }}>
                    <p style={{ color:'#71717a', fontSize:10, marginBottom:8, textTransform:'uppercase' }}>Vista previa WhatsApp</p>
                    {(mediaPreview || mediaUrl) && mediaType === 'image' && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaPreview || mediaUrl} alt="" style={{ width:'100%', borderRadius:8, marginBottom:8, maxHeight:120, objectFit:'cover' }}/>
                    )}
                    <div style={{ background:'#1f2c34', borderRadius:'0 12px 12px 12px', padding:'10px 14px' }}>
                      <p style={{ color:'#FCD116', fontWeight:700, fontSize:12, marginBottom:6 }}>📊 Encuesta de la campaña 🇨🇴</p>
                      <p style={{ color:'#e9edef', fontSize:13, fontWeight:600, marginBottom:8 }}>{pregunta}</p>
                      {optsValidas.map((op, i) => (
                        <p key={i} style={{ color:'#a8c0c8', fontSize:12, marginBottom:3 }}>{EMOJIS[i]} {op}</p>
                      ))}
                      {linkUrl && <p style={{ color:'#53bdeb', fontSize:12, marginTop:6 }}>🔗 {linkUrl}</p>}
                      <p style={{ color:'#8696a0', fontSize:10, fontStyle:'italic', marginTop:8 }}>
                        Responde con el número de tu opción. Tu opinión importa.
                      </p>
                      <p style={{ color:'#8696a0', fontSize:10, textAlign:'right', marginTop:4 }}>
                        {new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error   && <div style={{ background:'#3f1212', border:'1px solid #7f1d1d', borderRadius:8, padding:'10px 14px', color:'#fca5a5', fontSize:13 }}>{error}</div>}
            {success && <div style={{ background:'#0c1a0c', border:'1px solid #14532d', borderRadius:8, padding:'10px 14px', color:'#86efac', fontSize:13 }}>{success}</div>}

            <button onClick={handleSend} disabled={loading || preview === 0}
              style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'12px', borderRadius:10, border:'none',
                background: loading || preview === 0 ? '#3f3f46' : '#6366f1',
                color:'#fff', fontSize:14, fontWeight:700,
                cursor: loading || preview === 0 ? 'not-allowed' : 'pointer',
              }}>
              <Send size={16}/>
              {loading ? 'Enviando...' : `Enviar encuesta (${optsValidas.length} opciones)`}
            </button>
          </div>
        </div>

        {/* ── HISTORIAL DE ENCUESTAS ── */}
        <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <BarChart2 size={18} style={{ color:'#6366f1' }}/>
              <p style={{ color:'#fff', fontWeight:600, fontSize:15 }}>Historial de encuestas</p>
            </div>
            <button onClick={loadHistory}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:11, cursor:'pointer' }}>
              <RefreshCw size={11}/> Actualizar
            </button>
          </div>

          {loadingHist ? (
            <p style={{ color:'#52525b', textAlign:'center', padding:24 }}>Cargando historial...</p>
          ) : history.length === 0 ? (
            <p style={{ color:'#52525b', textAlign:'center', padding:24 }}>
              Aún no hay encuestas enviadas. Crea y envía la primera arriba.
            </p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {history.map(b => {
                const id      = b.id as number
                const isOpen  = expandedHist === id
                const bResults = results[id] || []

                return (
                  <div key={id} style={{ background:'#09090b', border:'1px solid #27272a', borderRadius:12, overflow:'hidden' }}>
                    <div style={{ padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ color:'#e4e4e7', fontWeight:600, fontSize:13, marginBottom:3 }}>
                          {(b.title as string).replace('Encuesta: ', '')}
                        </p>
                        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                          <span style={{ color:'#52525b', fontSize:11 }}>
                            📅 {new Date(b.created_at as string).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}
                          </span>
                          <span style={{ color:'#22c55e', fontSize:11 }}>✅ {b.sent_count as number} enviados</span>
                          {(b.failed_count as number) > 0 && (
                            <span style={{ color:'#ef4444', fontSize:11 }}>❌ {b.failed_count as number} fallidos</span>
                          )}
                          <span style={{ color:'#52525b', fontSize:11 }}>Segmento: {b.segment as string}</span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (isOpen) { setExpandedHist(null); return }
                          setExpandedHist(id)
                          await loadResults(id)
                        }}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:'1px solid #27272a', background:'transparent', color:'#6366f1', fontSize:12, cursor:'pointer', flexShrink:0, marginLeft:12 }}>
                        <BarChart2 size={13}/>
                        {isOpen ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                      </button>
                    </div>

                    {/* Resultados expandibles */}
                    {isOpen && (
                      <div style={{ borderTop:'1px solid #27272a', padding:'16px', background:'#111113' }}>
                        {loadingRes === id ? (
                          <p style={{ color:'#52525b', fontSize:12, textAlign:'center' }}>Cargando resultados...</p>
                        ) : bResults.length === 0 ? (
                          <p style={{ color:'#52525b', fontSize:12, textAlign:'center' }}>
                            Sin respuestas registradas aún. Los resultados aparecen cuando los contactos responden al bot.
                          </p>
                        ) : (
                          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                            <p style={{ color:'#a1a1aa', fontSize:11, fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>
                              Resultados — {bResults.reduce((a, r) => a + r.count, 0)} respuestas
                            </p>
                            {bResults.map((r, i) => (
                              <div key={i}>
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                                  <span style={{ color:'#e4e4e7', fontSize:13 }}>{EMOJIS[i]} {r.option}</span>
                                  <span style={{ color: COLORS[i], fontWeight:700, fontSize:13 }}>
                                    {r.count} ({r.percent}%)
                                  </span>
                                </div>
                                <div style={{ background:'#27272a', borderRadius:4, height:8, overflow:'hidden' }}>
                                  <div style={{
                                    width:`${r.percent}%`, height:'100%',
                                    background: COLORS[i], borderRadius:4,
                                    transition:'width .5s',
                                  }}/>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}