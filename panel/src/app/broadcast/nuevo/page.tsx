'use client'
// 📄 panel/src/app/broadcast/nuevo/page.tsx  ← REEMPLAZA EL ANTERIOR
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { createBroadcast, previewBroadcast } from '@/lib/api'
import { ArrowLeft, Send, Users, Image, FileText, Layers } from 'lucide-react'

const SEGMENTS = [
  { value:'todos',       label:'Todos los contactos', desc:'Todos los importados' },
  { value:'opted_in',   label:'Solo opt-in',          desc:'Quienes aceptaron recibir mensajes' },
  { value:'city',       label:'Por ciudad',            desc:'Filtra por nombre de ciudad' },
  { value:'department', label:'Por departamento',      desc:'Filtra por departamento' },
  { value:'interest',   label:'Por interés',           desc:'seguridad / economia / salud / educacion / paz' },
]

const TIPO = [
  { value:'template', label:'Plantilla Meta',   icon:'📋', desc:'Usa una plantilla aprobada (para primer contacto)' },
  { value:'texto',    label:'Solo texto',        icon:'✍️', desc:'Texto libre (solo para quienes ya escribieron)' },
  { value:'imagen',   label:'Texto + imagen',    icon:'🖼️', desc:'Mensaje con foto adjunta' },
]

const inputSt: React.CSSProperties = {
  width:'100%', padding:'10px 12px', background:'#09090b',
  border:'1px solid #27272a', borderRadius:8, color:'#fff',
  fontSize:13, outline:'none', boxSizing:'border-box',
}

const labelSt: React.CSSProperties = {
  display:'block', color:'#a1a1aa', fontSize:11,
  fontWeight:600, marginBottom:6, textTransform:'uppercase',
}

export default function NuevoBroadcastPage() {
  const router   = useRouter()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [title,        setTitle]        = useState('')
  const [message,      setMessage]      = useState('')
  const [tipo,         setTipo]         = useState('template')
  const [segment,      setSegment]      = useState('todos')
  const [segVal,       setSegVal]       = useState('')
  const [templateName, setTemplateName] = useState('bienvenida_campana')
  const [imageUrl,     setImageUrl]     = useState('')
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [preview,      setPreview]      = useState<number | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  useEffect(() => {
    previewBroadcast(segment, segVal)
      .then((r: unknown) => setPreview((r as Record<string,number>).total_targets))
      .catch(() => setPreview(null))
  }, [segment, segVal])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleCreate(sendNow: boolean) {
    setError('')

    if (!title.trim()) return setError('El título es obligatorio')

    if (tipo === 'template' && !templateName.trim())
      return setError('Escribe el nombre de la plantilla')

    if (tipo !== 'template' && !message.trim())
      return setError('El mensaje es obligatorio')

    if (tipo === 'imagen' && !imageUrl.trim() && !imageFile)
      return setError('Agrega una URL de imagen o sube una foto')

    setSaving(true)
    try {
      // Si subió archivo, usar preview local como URL (en producción subirías a un CDN)
      const finalImageUrl = imageFile
        ? imagePreview   // base64 — funciona para demos; en prod subir a S3/Cloudinary
        : imageUrl

      const payload: Record<string,string> = {
        title,
        message:       tipo === 'template' ? '' : message,
        segment,
        segment_value: segVal,
        template_name: tipo === 'template' ? templateName : '',
        media_url:     tipo === 'imagen' ? finalImageUrl : (tipo === 'template' ? finalImageUrl : ''),
        media_type:    tipo === 'imagen' ? 'image' : '',
      }

      const b = await createBroadcast(payload) as Record<string,unknown>

      if (sendNow) {
        const { sendBroadcast } = await import('@/lib/api')
        await sendBroadcast(b.id as number)
      }

      router.push('/broadcast')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear el broadcast')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:700 }}>

        {/* Header */}
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

        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Título interno */}
          <div>
            <label style={labelSt}>Título interno *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="ej: Bienvenida opt-in San Gil"
              style={inputSt}/>
            <p style={{ color:'#52525b', fontSize:11, marginTop:4 }}>Solo lo ve el equipo, no el simpatizante</p>
          </div>

          {/* Tipo de mensaje */}
          <div>
            <label style={labelSt}>Tipo de mensaje *</label>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {TIPO.map(t => (
                <button key={t.value} type="button" onClick={() => setTipo(t.value)}
                  style={{
                    padding:'11px 14px', borderRadius:9, cursor:'pointer', textAlign:'left',
                    border:`1px solid ${tipo === t.value ? '#CE1126' : '#27272a'}`,
                    background: tipo === t.value ? '#3f0d0d' : '#18181b',
                    display:'flex', alignItems:'center', gap:10,
                  }}>
                  <span style={{ fontSize:18 }}>{t.icon}</span>
                  <div>
                    <span style={{ color: tipo === t.value ? '#fff' : '#a1a1aa', fontWeight:600, fontSize:13 }}>{t.label}</span>
                    <span style={{ color:'#52525b', fontSize:11, marginLeft:8 }}>{t.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Nombre de plantilla */}
          {tipo === 'template' && (
            <div>
              <label style={labelSt}>Nombre de la plantilla aprobada *</label>
              <input value={templateName} onChange={e => setTemplateName(e.target.value)}
                placeholder="ej: bienvenida_campana"
                style={inputSt}/>
              <p style={{ color:'#52525b', fontSize:11, marginTop:4 }}>
                Exactamente como aparece en Meta → WhatsApp Manager → Plantillas
              </p>
            </div>
          )}

          {/* Mensaje de texto */}
          {tipo !== 'template' && (
            <div>
              <label style={labelSt}>Mensaje *</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Escribe el mensaje que recibirán por WhatsApp..."
                rows={6}
                style={{ ...inputSt, resize:'vertical', fontFamily:'inherit', lineHeight:1.6 }}/>
              <p style={{ color:'#52525b', fontSize:11, marginTop:4 }}>{message.length} caracteres</p>
            </div>
          )}

          {/* Imagen */}
          {(tipo === 'imagen' || tipo === 'template') && (
            <div>
              <label style={labelSt}>
                {tipo === 'template' ? 'Imagen del encabezado (opcional)' : 'Imagen adjunta *'}
              </label>

              {/* Subir archivo */}
              <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:8, border:'1px solid #27272a', background:'#18181b', color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>
                  <Image size={14}/> Subir foto
                </button>
                <span style={{ color:'#52525b', fontSize:12, alignSelf:'center' }}>o pega una URL pública:</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileChange}/>

              {/* URL manual */}
              <input value={imageUrl} onChange={e => { setImageUrl(e.target.value); setImagePreview('') }}
                placeholder="https://ejemplo.com/foto-abelardo.jpg"
                style={inputSt}/>

              {/* Preview de imagen */}
              {(imagePreview || imageUrl) && (
                <div style={{ marginTop:10, borderRadius:10, overflow:'hidden', border:'1px solid #27272a', maxWidth:280 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview || imageUrl}
                    alt="preview"
                    style={{ width:'100%', display:'block', maxHeight:160, objectFit:'cover' }}
                  />
                </div>
              )}

              {imageFile && (
                <p style={{ color:'#22c55e', fontSize:11, marginTop:6 }}>✓ {imageFile.name} cargada</p>
              )}

              {tipo === 'template' && (
                <p style={{ color:'#52525b', fontSize:11, marginTop:6 }}>
                  La imagen debe ser la misma que usaste al crear la plantilla en Meta
                </p>
              )}
            </div>
          )}

          {/* Segmento */}
          <div>
            <label style={labelSt}>Segmento objetivo</label>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {SEGMENTS.map(s => (
                <button key={s.value} type="button" onClick={() => { setSegment(s.value); setSegVal('') }}
                  style={{
                    padding:'10px 14px', borderRadius:9, cursor:'pointer', textAlign:'left',
                    border:`1px solid ${segment === s.value ? '#FCD116' : '#27272a'}`,
                    background: segment === s.value ? '#2a2200' : 'transparent',
                  }}>
                  <span style={{ color: segment === s.value ? '#FCD116' : '#a1a1aa', fontWeight:600, fontSize:13 }}>{s.label}</span>
                  <span style={{ color:'#52525b', fontSize:11, marginLeft:8 }}>{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Valor del segmento */}
          {['city','department','interest'].includes(segment) && (
            <div>
              <label style={labelSt}>
                {segment === 'city' ? 'Ciudad' : segment === 'department' ? 'Departamento' : 'Interés'}
              </label>
              <input value={segVal} onChange={e => setSegVal(e.target.value)}
                placeholder={segment === 'city' ? 'ej: San Gil' : segment === 'department' ? 'ej: Santander' : 'ej: seguridad'}
                style={inputSt}/>
            </div>
          )}

          {/* Preview contador */}
          {preview !== null && (
            <div style={{ background:'#0c1a0c', border:'1px solid #14532d', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
              <Users size={16} style={{ color:'#22c55e', flexShrink:0 }}/>
              <p style={{ color:'#22c55e', fontSize:13 }}>
                <strong>{preview.toLocaleString()}</strong> contactos recibirán este mensaje
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background:'#3f1212', border:'1px solid #7f1d1d', borderRadius:8, padding:'10px 14px', color:'#fca5a5', fontSize:13 }}>
              {error}
            </div>
          )}

          {/* Botones de acción */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => handleCreate(false)} disabled={saving}
              style={{ flex:1, padding:'11px', borderRadius:9, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              {saving ? 'Guardando...' : '💾 Guardar borrador'}
            </button>
            <button onClick={() => handleCreate(true)} disabled={saving}
              style={{ flex:2, padding:'11px', borderRadius:9, border:'none', background:'#CE1126', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <Send size={15}/> {saving ? 'Enviando...' : '🚀 Crear y enviar ahora'}
            </button>
          </div>

        </div>
      </div>
    </Layout>
  )
}