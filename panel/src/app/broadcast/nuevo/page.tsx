'use client'
// 📄 panel/src/app/broadcast/nuevo/page.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { createBroadcast, previewBroadcast, getGroups, sendBroadcast } from '@/lib/api'
import { ArrowLeft, Send, Users, AlertCircle, ExternalLink } from 'lucide-react'

const inputSt: React.CSSProperties = {
  width:'100%', padding:'10px 12px', background:'#09090b',
  border:'1px solid #27272a', borderRadius:8, color:'#fff',
  fontSize:13, outline:'none', boxSizing:'border-box',
}
const labelSt: React.CSSProperties = {
  display:'block', color:'#a1a1aa', fontSize:11,
  fontWeight:600, marginBottom:6, textTransform:'uppercase',
}

type Group = { id: number; name: string; color: string; icon: string; count: number }

const TIPO = [
  { value:'template', icon:'📋', label:'Plantilla Meta',  desc:'Para primer contacto — requiere plantilla aprobada' },
  { value:'texto',    icon:'✍️', label:'Solo texto',       desc:'Texto libre para quienes ya escribieron' },
  { value:'imagen',   icon:'🖼️', label:'Texto + imagen',   desc:'Mensaje con foto adjunta (URL pública)' },
  { value:'video',    icon:'🎬', label:'Texto + video',    desc:'Mensaje con video adjunto (URL pública)' },
]

const WA_LIMIT = 1024

const BASE_SEGMENTS = [
  { value:'todos',       label:'Todos los contactos', desc:'Todos los importados',                            color:'#FCD116' },
  { value:'opted_in',   label:'Solo opt-in',          desc:'Quienes aceptaron recibir mensajes',              color:'#22c55e' },
  { value:'city',       label:'Por ciudad',            desc:'Filtra por nombre de ciudad',                    color:'#0ea5e9' },
  { value:'department', label:'Por departamento',      desc:'Filtra por departamento',                        color:'#6366f1' },
  { value:'interest',   label:'Por interés',           desc:'seguridad / economia / salud / educacion / paz', color:'#f59e0b' },
]

export default function NuevoBroadcastPage() {
  const router   = useRouter()

  const [title,        setTitle]        = useState('')
  const [message,      setMessage]      = useState('')
  const [tipo,         setTipo]         = useState('template')
  const [segment,      setSegment]      = useState('todos')
  const [segVal,       setSegVal]       = useState('')
  const [templateName, setTemplateName] = useState('bienvenida_campana')
  const [mediaUrl,     setMediaUrl]     = useState('')
  const [preview,      setPreview]      = useState<number | null>(null)
  const [previewWarn,  setPreviewWarn]  = useState('')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')
  const [groups,       setGroups]       = useState<Group[]>([])
  const [showPreview,  setShowPreview]  = useState(false)

  const GROUP_SEGMENTS = groups.map(g => ({
    value: `group_${g.id}`,
    label: `${g.icon} ${g.name}`,
    desc:  `${g.count} contactos en este grupo`,
    color: g.color,
  }))
  const ALL_SEGMENTS = [...BASE_SEGMENTS, ...GROUP_SEGMENTS]

  useEffect(() => {
    getGroups().then(g => setGroups(g as Group[])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!segment) return
    const realSegment = segment.startsWith('group_') ? 'group' : segment
    const realVal     = segment.startsWith('group_') ? segment.replace('group_', '') : segVal
    previewBroadcast(realSegment, realVal)
      .then((r: unknown) => {
        const total = (r as Record<string,number>).total_targets
        setPreview(total)
        if ((segment === 'city' || segment === 'department') && segVal && total === 0) {
          setPreviewWarn(`No hay contactos con ese ${segment === 'city' ? 'ciudad' : 'departamento'}.`)
        } else {
          setPreviewWarn('')
        }
      })
      .catch(() => setPreview(null))
  }, [segment, segVal])

  const urlIsValid = mediaUrl.trim().startsWith('http://') || mediaUrl.trim().startsWith('https://')

  const mediaIsSet =
    tipo === 'texto'    ? true :
    tipo === 'template' ? urlIsValid :
    tipo === 'imagen'   ? urlIsValid :
    tipo === 'video'    ? urlIsValid :
    true

  const canSend = !saving && preview !== null && preview !== 0 && mediaIsSet

  async function handleCreate(sendNow: boolean) {
    setError('')
    if (!title.trim()) return setError('El título es obligatorio')
    if (tipo === 'template' && !templateName.trim()) return setError('Escribe el nombre de la plantilla')
    if (tipo !== 'template' && !message.trim()) return setError('El mensaje es obligatorio')
    if (tipo === 'template' && !urlIsValid)
      return setError('La plantilla requiere una URL pública de imagen (https://...)')
    if ((tipo === 'imagen' || tipo === 'video') && !urlIsValid)
      return setError('Pega una URL pública válida que empiece con https://')
    if (preview === 0 || preview === null) return setError('No hay contactos que cumplan el segmento seleccionado')
    if (previewWarn) return setError(previewWarn)

    const realSegment = segment.startsWith('group_') ? 'group' : segment
    const realSegVal  = segment.startsWith('group_') ? segment.replace('group_', '') : segVal

    setSaving(true)
    try {
      const payload: Record<string,string> = {
        title,
        message:       tipo === 'template' ? '' : message,
        segment:       realSegment,
        segment_value: realSegVal,
        template_name: tipo === 'template' ? templateName : '',
        media_url:     mediaUrl.trim(),
        media_type:    tipo === 'imagen' ? 'image' : tipo === 'video' ? 'video' : tipo === 'template' ? 'image' : '',
      }
      const b = await createBroadcast(payload) as Record<string,unknown>
      if (sendNow) await sendBroadcast(b.id as number)
      router.push('/broadcast')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear el broadcast')
    } finally {
      setSaving(false)
    }
  }

  const selectedSeg = ALL_SEGMENTS.find(s => s.value === segment)

  // Guía según tipo de media
  const mediaGuide: Record<string, { title: string; steps: string[]; placeholder: string; tip: string }> = {
    imagen: {
      title: '¿Cómo obtener la URL de tu imagen?',
      steps: [
        '1. Ve a imgbb.com (gratis, sin registro)',
        '2. Sube tu imagen',
        '3. Copia el "Direct link" (termina en .jpg o .png)',
        '4. Pégala abajo',
      ],
      placeholder: 'https://i.ibb.co/xxxxxxx/imagen.jpg',
      tip: 'La URL debe terminar en .jpg, .jpeg, .png o .webp',
    },
    video: {
      title: '¿Cómo obtener la URL de tu video?',
      steps: [
        '1. Ve a streamable.com (gratis)',
        '2. Sube tu video MP4 (máx 16 MB)',
        '3. Cuando cargue, haz clic derecho en el video',
        '4. Selecciona "Copiar dirección del video"',
        '5. Pégala abajo — debe terminar en .mp4',
      ],
      placeholder: 'https://streamable.com/e/abc123.mp4',
      tip: 'Solo MP4 — máximo 16 MB. Streamable.com es gratuito.',
    },
    template: {
      title: '¿Cómo obtener la URL de la imagen del encabezado?',
      steps: [
        '1. Ve a imgbb.com',
        '2. Sube la imagen del encabezado de tu plantilla',
        '3. Copia el "Direct link"',
      ],
      placeholder: 'https://i.ibb.co/xxxxxxx/encabezado.jpg',
      tip: 'Debe ser la misma imagen que usaste al crear la plantilla en Meta',
    },
  }

  const guide = mediaGuide[tipo]

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:760, paddingBottom:60 }}>

        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28 }}>
          <button onClick={() => router.back()}
            style={{ padding:'6px 10px', background:'#18181b', border:'1px solid #27272a', borderRadius:7, color:'#71717a', cursor:'pointer', display:'flex' }}>
            <ArrowLeft size={16}/>
          </button>
          <div>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>Nuevo broadcast</h1>
            <p style={{ color:'#71717a', fontSize:13 }}>Envío masivo a simpatizantes</p>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

          {/* Título */}
          <div>
            <label style={labelSt}>Título interno *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="ej: Bienvenida opt-in San Gil" style={inputSt}/>
            <p style={{ color:'#52525b', fontSize:11, marginTop:4 }}>Solo lo ve el equipo</p>
          </div>

          {/* Tipo */}
          <div>
            <label style={labelSt}>Tipo de mensaje *</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {TIPO.map(t => (
                <button key={t.value} type="button"
                  onClick={() => { setTipo(t.value); setMediaUrl('') }}
                  style={{ padding:'12px 14px', borderRadius:9, cursor:'pointer', textAlign:'left', border:`1px solid ${tipo===t.value ? '#CE1126' : '#27272a'}`, background:tipo===t.value ? '#3f0d0d' : '#18181b' }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{t.icon}</div>
                  <div style={{ color:tipo===t.value ? '#fff' : '#a1a1aa', fontWeight:600, fontSize:13 }}>{t.label}</div>
                  <div style={{ color:'#52525b', fontSize:11, marginTop:2 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Nombre de plantilla */}
          {tipo === 'template' && (
            <div>
              <label style={labelSt}>Nombre de la plantilla aprobada *</label>
              <input value={templateName} onChange={e => setTemplateName(e.target.value)}
                placeholder="ej: bienvenida_campana" style={inputSt}/>
              <p style={{ color:'#52525b', fontSize:11, marginTop:4 }}>
                Exactamente como aparece en Meta → WhatsApp Manager → Plantillas
              </p>
            </div>
          )}

          {/* Mensaje */}
          {tipo !== 'template' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <label style={{ ...labelSt, marginBottom:0 }}>Mensaje *</label>
                <span style={{ color:message.length > WA_LIMIT*0.9 ? '#ef4444' : '#52525b', fontSize:11 }}>{message.length}/{WA_LIMIT}</span>
              </div>
              <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, WA_LIMIT))}
                placeholder="Escribe el mensaje..." rows={6}
                style={{ ...inputSt, resize:'vertical', fontFamily:'inherit', lineHeight:1.6 }}/>
              <button onClick={() => setShowPreview(!showPreview)}
                style={{ marginTop:6, padding:'4px 10px', borderRadius:6, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:11, cursor:'pointer' }}>
                {showPreview ? '👁️ Ocultar preview' : '👁️ Ver preview WhatsApp'}
              </button>
              {showPreview && message && (
                <div style={{ marginTop:12, padding:16, background:'#0b141a', borderRadius:12, maxWidth:340 }}>
                  <div style={{ background:'#1f2c34', borderRadius:'0 12px 12px 12px', padding:'10px 14px' }}>
                    <p style={{ color:'#e9edef', fontSize:13, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{message}</p>
                    <p style={{ color:'#8696a0', fontSize:10, textAlign:'right', marginTop:4 }}>
                      {new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* URL de media — para imagen, video y template */}
          {guide && (
            <div>
              <label style={labelSt}>
                {tipo === 'template' ? 'URL imagen encabezado *' : tipo === 'imagen' ? 'URL de la imagen *' : 'URL del video *'}
              </label>

              {/* Guía paso a paso */}
              <div style={{ padding:'12px 14px', background:'#0a1628', border:'1px solid #0ea5e933', borderRadius:8, marginBottom:10 }}>
                <p style={{ color:'#7dd3fc', fontSize:12, fontWeight:600, marginBottom:6 }}>{guide.title}</p>
                {guide.steps.map((s, i) => (
                  <p key={i} style={{ color:'#7dd3fc', fontSize:12, lineHeight:1.7 }}>{s}</p>
                ))}
                {tipo === 'imagen' && (
                  <a href="https://imgbb.com" target="_blank" rel="noreferrer"
                    style={{ color:'#38bdf8', fontSize:12, display:'inline-flex', alignItems:'center', gap:4, marginTop:4 }}>
                    Abrir imgbb.com <ExternalLink size={10}/>
                  </a>
                )}
                {tipo === 'video' && (
                  <a href="https://streamable.com" target="_blank" rel="noreferrer"
                    style={{ color:'#38bdf8', fontSize:12, display:'inline-flex', alignItems:'center', gap:4, marginTop:4 }}>
                    Abrir streamable.com <ExternalLink size={10}/>
                  </a>
                )}
                {tipo === 'template' && (
                  <a href="https://imgbb.com" target="_blank" rel="noreferrer"
                    style={{ color:'#38bdf8', fontSize:12, display:'inline-flex', alignItems:'center', gap:4, marginTop:4 }}>
                    Abrir imgbb.com <ExternalLink size={10}/>
                  </a>
                )}
              </div>

              <input
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
                placeholder={guide.placeholder}
                style={{
                  ...inputSt,
                  borderColor: mediaUrl && !urlIsValid ? '#ef4444' : urlIsValid ? '#22c55e44' : '#27272a'
                }}
              />

              {mediaUrl && !urlIsValid && (
                <p style={{ color:'#fca5a5', fontSize:11, marginTop:5 }}>La URL debe comenzar con https://</p>
              )}
              {urlIsValid && (
                <p style={{ color:'#4ade80', fontSize:11, marginTop:5 }}>✓ URL válida — {guide.tip}</p>
              )}

              {/* Preview de imagen */}
              {urlIsValid && tipo === 'imagen' && (
                <div style={{ marginTop:10, borderRadius:10, overflow:'hidden', border:'1px solid #27272a', maxWidth:280 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl} alt="preview"
                    style={{ width:'100%', display:'block', maxHeight:160, objectFit:'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}/>
                </div>
              )}

              {/* Preview de video */}
              {urlIsValid && tipo === 'video' && (
                <div style={{ marginTop:10, borderRadius:10, overflow:'hidden', border:'1px solid #27272a', maxWidth:400 }}>
                  <video src={mediaUrl} controls
                    style={{ width:'100%', display:'block', maxHeight:220 }}
                    onError={e => { (e.target as HTMLVideoElement).style.display = 'none' }}/>
                </div>
              )}
            </div>
          )}

          {/* Segmento */}
          <div>
            <label style={labelSt}>Segmento objetivo</label>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:GROUP_SEGMENTS.length > 0 ? 10 : 0 }}>
              {BASE_SEGMENTS.map(s => (
                <button key={s.value} type="button" onClick={() => { setSegment(s.value); setSegVal('') }}
                  style={{ padding:'10px 14px', borderRadius:9, cursor:'pointer', textAlign:'left', border:`1px solid ${segment===s.value ? s.color : '#27272a'}`, background:segment===s.value ? s.color+'15' : 'transparent' }}>
                  <span style={{ color:segment===s.value ? s.color : '#a1a1aa', fontWeight:600, fontSize:13 }}>{s.label}</span>
                  <span style={{ color:'#52525b', fontSize:11, marginLeft:8 }}>{s.desc}</span>
                </button>
              ))}
            </div>
            {GROUP_SEGMENTS.length > 0 && (
              <div>
                <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase', marginBottom:6 }}>Grupos creados</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:6 }}>
                  {GROUP_SEGMENTS.map(s => (
                    <button key={s.value} type="button" onClick={() => { setSegment(s.value); setSegVal('') }}
                      style={{ padding:'10px 14px', borderRadius:9, cursor:'pointer', textAlign:'left', border:`1px solid ${segment===s.value ? s.color : '#27272a'}`, background:segment===s.value ? s.color+'15' : 'transparent' }}>
                      <span style={{ color:segment===s.value ? s.color : '#a1a1aa', fontWeight:600, fontSize:13 }}>{s.label}</span>
                      <span style={{ color:'#52525b', fontSize:11, display:'block', marginTop:2 }}>{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {['city','department','interest'].includes(segment) && (
              <input value={segVal} onChange={e => setSegVal(e.target.value)}
                placeholder={segment==='city' ? 'ej: San Gil' : segment==='department' ? 'ej: Santander' : 'ej: seguridad'}
                style={{ ...inputSt, marginTop:10 }}/>
            )}
          </div>

          {/* Contador de contactos */}
          {preview !== null && (
            <div style={{ background:preview===0 ? '#3f1212' : '#0c1a0c', border:`1px solid ${preview===0 ? '#7f1d1d' : '#14532d'}`, borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
              <Users size={16} style={{ color:preview===0 ? '#ef4444' : '#22c55e', flexShrink:0 }}/>
              <div>
                <p style={{ color:preview===0 ? '#fca5a5' : '#22c55e', fontSize:13 }}>
                  <strong>{preview.toLocaleString()}</strong> contactos recibirán este mensaje
                </p>
                {selectedSeg && <p style={{ color:'#52525b', fontSize:11, marginTop:2 }}>Segmento: {selectedSeg.label}</p>}
              </div>
            </div>
          )}

          {previewWarn && (
            <div style={{ background:'#2d1a00', border:'1px solid #f59e0b44', borderRadius:8, padding:'10px 14px', color:'#fbbf24', fontSize:13 }}>
              {previewWarn}
            </div>
          )}

          {error && (
            <div style={{ background:'#3f1212', border:'1px solid #7f1d1d', borderRadius:8, padding:'10px 14px', color:'#fca5a5', fontSize:13, display:'flex', alignItems:'flex-start', gap:8 }}>
              <AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }}/>
              <span>{error}</span>
            </div>
          )}

          {/* Botones */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => handleCreate(false)} disabled={saving}
              style={{ flex:1, padding:'11px', borderRadius:9, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              {saving ? 'Guardando...' : '💾 Guardar borrador'}
            </button>
            <button onClick={() => handleCreate(true)} disabled={!canSend}
              style={{ flex:2, padding:'11px', borderRadius:9, border:'none', background:canSend ? '#CE1126' : '#3f3f46', color:'#fff', fontSize:13, fontWeight:700, cursor:canSend ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <Send size={15}/> {saving ? 'Enviando...' : '🚀 Crear y enviar ahora'}
            </button>
          </div>

          {!mediaIsSet && tipo !== 'texto' && (
            <p style={{ color:'#f87171', fontSize:12, textAlign:'center' }}>
              ↑ Pega la URL pública para poder enviar
            </p>
          )}

        </div>
      </div>
    </Layout>
  )
}