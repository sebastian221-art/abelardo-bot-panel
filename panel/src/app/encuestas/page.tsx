'use client'
// 📄 panel/src/app/encuestas/page.tsx
import { useState } from 'react'
import Layout from '@/components/Layout'
import { createBroadcast, sendBroadcast, previewBroadcast } from '@/lib/api'
import { ClipboardList, Send, Plus, Users } from 'lucide-react'

const SEGMENTS = [
  { value: 'opted_in',    label: 'Solo opt-in',         desc: 'Quienes aceptaron mensajes' },
  { value: 'all',         label: 'Todos los contactos', desc: 'Incluyendo sin opt-in' },
  { value: 'city',        label: 'Por ciudad',          desc: 'Ej: Bogotá, Medellín' },
  { value: 'department',  label: 'Por departamento',    desc: 'Ej: Antioquia, Valle' },
  { value: 'interest',    label: 'Por interés',         desc: 'Ej: seguridad, salud' },
]

const PLANTILLAS = [
  {
    titulo: '¿Cuál es el problema más urgente en tu ciudad?',
    opciones: ['1️⃣ Inseguridad', '2️⃣ Desempleo', '3️⃣ Salud', '4️⃣ Educación'],
  },
  {
    titulo: '¿Por qué apoyarías a Abelardo?',
    opciones: ['1️⃣ Sus propuestas de seguridad', '2️⃣ Su plan económico', '3️⃣ Su lucha contra la corrupción', '4️⃣ Su liderazgo'],
  },
  {
    titulo: '¿Qué propuesta de Abelardo te parece más importante?',
    opciones: ['1️⃣ Plan de choque en salud', '2️⃣ Plan Patriota II', '3️⃣ Empleo y economía', '4️⃣ Lucha contra la corrupción'],
  },
  {
    titulo: '¿Hablarás de Abelardo con tus familiares y amigos?',
    opciones: ['1️⃣ Sí, con muchos', '2️⃣ Con algunos', '3️⃣ Prefiero no hablar de política'],
  },
]

const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: '#09090b',
  border: '1px solid #27272a', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

export default function EncuestasPage() {
  const [pregunta, setPregunta]   = useState('')
  const [opciones, setOpciones]   = useState(['', '', '', ''])
  const [segment,  setSegment]    = useState('opted_in')
  const [segVal,   setSegVal]     = useState('')
  const [preview,  setPreview]    = useState<number | null>(null)
  const [loading,  setLoading]    = useState(false)
  const [success,  setSuccess]    = useState('')
  const [error,    setError]      = useState('')

  function loadTemplate(t: typeof PLANTILLAS[0]) {
    setPregunta(t.titulo)
    setOpciones([...t.opciones, '', ''].slice(0, 4))
  }

  async function handlePreview() {
    const r = await previewBroadcast(segment, segVal) as Record<string, number>
    setPreview(r.total_targets)
  }

  async function handleSend() {
    setError(''); setSuccess('')
    if (!pregunta.trim()) return setError('Escribe la pregunta de la encuesta')
    const optsValidas = opciones.filter(o => o.trim())
    if (optsValidas.length < 2) return setError('Agrega al menos 2 opciones de respuesta')

    setLoading(true)
    try {
      const mensaje =
        `📊 *Encuesta de la campaña* 🇨🇴\n\n` +
        `*${pregunta}*\n\n` +
        optsValidas.join('\n') +
        `\n\n_Responde con el número de tu opción. Tu opinión importa._`

      const b = await createBroadcast({
        title:         `Encuesta: ${pregunta.slice(0, 60)}`,
        message:       mensaje,
        segment,
        segment_value: segVal || undefined,
      }) as Record<string, unknown>

      await sendBroadcast(b.id as number)
      setSuccess(`✅ Encuesta enviada a ${preview ?? '...'} contactos`)
      setPregunta(''); setOpciones(['', '', '', '']); setPreview(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al enviar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div style={{ padding: 32, maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <ClipboardList size={22} style={{ color: '#6366f1' }} />
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Encuestas</h1>
        </div>
        <p style={{ color: '#71717a', fontSize: 13, marginBottom: 28 }}>
          Envía una pregunta a los simpatizantes y mide el pulso de la campaña
        </p>

        {/* Plantillas rápidas */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <p style={{ color: '#a1a1aa', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', marginBottom: 12 }}>
            Plantillas rápidas
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLANTILLAS.map((t, i) => (
              <button key={i} onClick={() => loadTemplate(t)}
                style={{
                  padding: '10px 14px', borderRadius: 9, border: '1px solid #27272a',
                  background: 'transparent', color: '#a1a1aa', fontSize: 13,
                  cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                }}>
                📋 {t.titulo}
              </button>
            ))}
          </div>
        </div>

        {/* Constructor */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: 24 }}>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 20 }}>
            Crear encuesta
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Pregunta */}
            <div>
              <label style={{ display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>
                Pregunta *
              </label>
              <input value={pregunta} onChange={e => setPregunta(e.target.value)}
                placeholder="ej: ¿Cuál es el problema más urgente en tu ciudad?" style={inputSt} />
            </div>

            {/* Opciones */}
            <div>
              <label style={{ display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase' }}>
                Opciones de respuesta (mínimo 2)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {opciones.map((op, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#52525b', fontSize: 13, width: 20, flexShrink: 0 }}>{i + 1}️⃣</span>
                    <input value={op}
                      onChange={e => { const n = [...opciones]; n[i] = e.target.value; setOpciones(n) }}
                      placeholder={`Opción ${i + 1}${i < 2 ? ' *' : ' (opcional)'}`}
                      style={inputSt} />
                  </div>
                ))}
              </div>
            </div>

            {/* Segmento */}
            <div>
              <label style={{ display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase' }}>
                Enviar a
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {SEGMENTS.map(s => (
                  <button key={s.value} type="button" onClick={() => { setSegment(s.value); setSegVal(''); setPreview(null) }}
                    style={{
                      padding: '8px 12px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                      border: `1px solid ${segment === s.value ? '#6366f1' : '#27272a'}`,
                      background: segment === s.value ? '#1e1b4b' : 'transparent',
                    }}>
                    <div style={{ color: segment === s.value ? '#fff' : '#a1a1aa', fontWeight: 600, fontSize: 12 }}>{s.label}</div>
                    <div style={{ color: '#52525b', fontSize: 10 }}>{s.desc}</div>
                  </button>
                ))}
              </div>

              {['city', 'department', 'interest'].includes(segment) && (
                <input value={segVal} onChange={e => { setSegVal(e.target.value); setPreview(null) }}
                  placeholder={segment === 'city' ? 'Nombre de la ciudad' : segment === 'department' ? 'Nombre del departamento' : 'Tema: seguridad, salud, economia...'}
                  style={{ ...inputSt, marginTop: 10 }} />
              )}
            </div>

            {/* Preview */}
            <button onClick={handlePreview}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 8, border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa', fontSize: 13, cursor: 'pointer', width: 'fit-content' }}>
              <Users size={14} /> Ver cuántos la recibirán
            </button>

            {preview !== null && (
              <div style={{ background: '#0c1a0c', border: '1px solid #14532d', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={15} style={{ color: '#22c55e' }} />
                <p style={{ color: '#22c55e', fontSize: 13 }}>
                  <strong>{preview.toLocaleString()}</strong> contactos recibirán esta encuesta
                </p>
              </div>
            )}

            {/* Preview del mensaje */}
            {pregunta && (
              <div style={{ background: '#09090b', borderRadius: 10, padding: 16 }}>
                <p style={{ color: '#52525b', fontSize: 10, textTransform: 'uppercase', marginBottom: 8 }}>Vista previa del mensaje</p>
                <p style={{ color: '#FCD116', fontWeight: 700, fontSize: 13 }}>📊 Encuesta de la campaña 🇨🇴</p>
                <p style={{ color: '#fff', fontSize: 13, marginTop: 6, fontWeight: 600 }}>{pregunta}</p>
                <div style={{ marginTop: 8 }}>
                  {opciones.filter(o => o.trim()).map((op, i) => (
                    <p key={i} style={{ color: '#a1a1aa', fontSize: 12 }}>{op}</p>
                  ))}
                </div>
                <p style={{ color: '#52525b', fontSize: 11, marginTop: 8, fontStyle: 'italic' }}>
                  Responde con el número de tu opción. Tu opinión importa.
                </p>
              </div>
            )}

            {error   && <div style={{ background: '#3f1212', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13 }}>{error}</div>}
            {success && <div style={{ background: '#0c1a0c', border: '1px solid #14532d', borderRadius: 8, padding: '10px 14px', color: '#86efac', fontSize: 13 }}>{success}</div>}

            <button onClick={handleSend} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, border: 'none', background: loading ? '#3f3f46' : '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              <Send size={16} />
              {loading ? 'Enviando encuesta...' : 'Enviar encuesta ahora'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}