'use client'
// 📄 panel/src/app/broadcast/nuevo/page.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { createBroadcast, previewBroadcast } from '@/lib/api'
import { ArrowLeft, Send, Users, Eye } from 'lucide-react'

const SEGMENTS = [
  { value:'opted_in',   label:'Solo opt-in',        desc:'Quienes aceptaron recibir mensajes' },
  { value:'all',        label:'Todos los contactos', desc:'Todos los importados (incluso sin opt-in)' },
  { value:'city',       label:'Por ciudad',          desc:'Filtra por nombre de ciudad' },
  { value:'department', label:'Por departamento',    desc:'Filtra por departamento' },
  { value:'interest',   label:'Por interés',         desc:'seguridad / economia / salud / educacion / paz' },
]

const inputSt: React.CSSProperties = {
  width:'100%', padding:'10px 12px', background:'#09090b',
  border:'1px solid #27272a', borderRadius:8, color:'#fff',
  fontSize:13, outline:'none', boxSizing:'border-box',
}

export default function NuevoBroadcastPage() {
  const router  = useRouter()
  const [title,   setTitle]   = useState('')
  const [message, setMessage] = useState('')
  const [segment, setSegment] = useState('opted_in')
  const [segVal,  setSegVal]  = useState('')
  const [preview, setPreview] = useState<number | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    previewBroadcast(segment, segVal)
      .then((r: unknown) => setPreview((r as Record<string,number>).total_targets))
      .catch(() => setPreview(null))
  }, [segment, segVal])

  async function handleCreate(send: boolean) {
    setError('')
    if (!title.trim()) return setError('El título es obligatorio')
    if (!message.trim()) return setError('El mensaje es obligatorio')
    setSaving(true)
    try {
      const b = await createBroadcast({ title, message, segment, segment_value: segVal }) as Record<string,unknown>
      if (send) {
        const { sendBroadcast } = await import('@/lib/api')
        await sendBroadcast(b.id as number)
      }
      router.push('/broadcast')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear')
    } finally { setSaving(false) }
  }

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:680 }}>
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

        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {/* Título */}
          <div>
            <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>Título interno *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="ej: Mensaje previo al debate del 15 de abril" style={inputSt}/>
            <p style={{ color:'#52525b', fontSize:11, marginTop:4 }}>Solo lo ve el equipo de campaña, no el ciudadano</p>
          </div>

          {/* Mensaje */}
          <div>
            <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>Mensaje *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Escribe el mensaje que recibirán los simpatizantes por WhatsApp..."
              rows={6}
              style={{ ...inputSt, resize:'vertical', fontFamily:'inherit', lineHeight:1.6 }}/>
            <p style={{ color:'#52525b', fontSize:11, marginTop:4 }}>{message.length} caracteres · Recomendado: menos de 500</p>
          </div>

          {/* Segmento */}
          <div>
            <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:10, textTransform:'uppercase' }}>Segmento objetivo</label>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {SEGMENTS.map(s => (
                <button key={s.value} type="button" onClick={() => { setSegment(s.value); setSegVal('') }}
                  style={{
                    padding:'10px 14px', borderRadius:9, cursor:'pointer', textAlign:'left',
                    border: `1px solid ${segment === s.value ? '#CE1126' : '#27272a'}`,
                    background: segment === s.value ? '#3f0d0d' : 'transparent',
                  }}>
                  <span style={{ color: segment === s.value ? '#fff' : '#a1a1aa', fontWeight:600, fontSize:13 }}>{s.label}</span>
                  <span style={{ color:'#52525b', fontSize:11, marginLeft:8 }}>{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Valor del segmento */}
          {['city','department','interest'].includes(segment) && (
            <div>
              <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>
                {segment === 'city' ? 'Ciudad' : segment === 'department' ? 'Departamento' : 'Interés'}
              </label>
              <input value={segVal} onChange={e => setSegVal(e.target.value)}
                placeholder={segment === 'city' ? 'ej: Bogotá' : segment === 'department' ? 'ej: Cundinamarca' : 'ej: seguridad'}
                style={inputSt}/>
            </div>
          )}

          {/* Preview */}
          {preview !== null && (
            <div style={{ background:'#0c1a0c', border:'1px solid #14532d', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
              <Users size={16} style={{ color:'#22c55e', flexShrink:0 }}/>
              <p style={{ color:'#22c55e', fontSize:13 }}>
                <strong>{preview.toLocaleString()}</strong> contactos recibirán este mensaje
              </p>
            </div>
          )}

          {error && (
            <div style={{ background:'#3f1212', border:'1px solid #7f1d1d', borderRadius:8, padding:'10px 14px', color:'#fca5a5', fontSize:13 }}>{error}</div>
          )}

          {/* Botones */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => handleCreate(false)} disabled={saving}
              style={{ flex:1, padding:'11px', borderRadius:9, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              {saving ? 'Guardando...' : 'Guardar borrador'}
            </button>
            <button onClick={() => handleCreate(true)} disabled={saving}
              style={{ flex:2, padding:'11px', borderRadius:9, border:'none', background:'#CE1126', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <Send size={15}/> {saving ? 'Enviando...' : 'Crear y enviar ahora'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
