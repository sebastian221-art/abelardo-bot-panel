'use client'
// 📄 panel/src/app/heygen/page.tsx  ← REEMPLAZA EL ANTERIOR
import { useState } from 'react'
import Layout from '@/components/Layout'
import { Video, Send, Loader, CheckCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const FONDOS = [
  { value: 'debate',   label: '🎤 Debate',   color: '#1e3a5f' },
  { value: 'campana',  label: '🇨🇴 Campaña', color: '#3f0d0d' },
  { value: 'congreso', label: '🏛️ Congreso', color: '#1a2a1a' },
  { value: 'neutro',   label: '⬛ Neutro',    color: '#1a1a1a' },
]

const EJEMPLOS = [
  '¡Defensores de la Patria! En 30 minutos comienza el debate presidencial. Únete en vivo.',
  'Hoy a las 8PM Abelardo estará en CNN. No te lo pierdas 🇨🇴',
  'Mañana gran concentración en San Gil. ¡Los esperamos a todos!',
  'Nuevo mensaje importante de Abelardo para todos los Defensores de la Patria.',
]

const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: '#09090b',
  border: '1px solid #27272a', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

export default function HeyGenPage() {
  const [texto,       setTexto]       = useState('')
  const [fondo,       setFondo]       = useState('campana')
  const [videoUrl,    setVideoUrl]    = useState('')
  const [generating,  setGenerating]  = useState(false)
  const [videoReady,  setVideoReady]  = useState(false)
  const [sending,     setSending]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [broadcastTo, setBroadcastTo] = useState('todos')

  async function handleGenerate() {
    setError(''); setSuccess(''); setVideoReady(false); setVideoUrl('')
    if (!texto.trim()) return setError('Escribe el texto que dirá el avatar')
    if (texto.length > 500) return setError('Máximo 500 caracteres')

    setGenerating(true)
    try {
      const token = localStorage.getItem('token')
      const res   = await fetch(`${API}/heygen/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ text: texto, background: fondo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error al generar el video')
      pollVideo(data.video_id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al generar')
      setGenerating(false)
    }
  }

  function pollVideo(id: string) {
    const token    = localStorage.getItem('token')
    let attempts   = 0
    const interval = setInterval(async () => {
      attempts++
      if (attempts > 40) {
        clearInterval(interval)
        setError('El video tardó demasiado. Intenta de nuevo.')
        setGenerating(false)
        return
      }
      try {
        const res  = await fetch(`${API}/heygen/status/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.status === 'completed' && data.video_url) {
          clearInterval(interval)
          setVideoUrl(data.video_url)
          setVideoReady(true)
          setGenerating(false)
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setError('El video falló en HeyGen. Intenta de nuevo.')
          setGenerating(false)
        }
      } catch { /* sigue intentando */ }
    }, 6000)
  }

  async function handleSendBroadcast() {
    setError(''); setSuccess('')
    if (!videoUrl) return setError('Primero genera el video')
    setSending(true)
    try {
      const token = localStorage.getItem('token')
      const bRes  = await fetch(`${API}/broadcast/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({
          title:      `Video HeyGen: ${texto.slice(0, 50)}`,
          message:    texto,
          segment:    broadcastTo,
          media_url:  videoUrl,
          media_type: 'video',
        }),
      })
      const b = await bRes.json()
      await fetch(`${API}/broadcast/${b.id as number}/send`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      setSuccess('✅ Video enviado como broadcast masivo')
      setVideoUrl(''); setVideoReady(false); setTexto('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al enviar')
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout>
      <div style={{ padding: 32, maxWidth: 700 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Video size={22} style={{ color: '#a855f7' }} />
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Videos con Avatar</h1>
        </div>
        <p style={{ color: '#71717a', fontSize: 13, marginBottom: 28 }}>
          Genera videos del avatar de la campaña y envíalos como broadcast masivo por WhatsApp
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Texto */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: 24 }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 16 }}>
              1. Escribe lo que dirá el avatar
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {EJEMPLOS.map((ej, i) => (
                <button key={i} onClick={() => setTexto(ej)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #27272a', background: 'transparent', color: '#71717a', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
                  💡 {ej}
                </button>
              ))}
            </div>
            <textarea value={texto} onChange={e => setTexto(e.target.value)}
              placeholder="ej: ¡Defensores! En 30 minutos comienza el debate. ¡Únanse!"
              rows={4}
              style={{ ...inputSt, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
            <p style={{ color: texto.length > 450 ? '#ef4444' : '#52525b', fontSize: 11, marginTop: 4 }}>
              {texto.length}/500 caracteres
            </p>
          </div>

          {/* Fondo */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: 24 }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 16 }}>
              2. Elige el fondo
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {FONDOS.map(f => (
                <button key={f.value} onClick={() => setFondo(f.value)}
                  style={{
                    padding: '14px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${fondo === f.value ? '#a855f7' : '#27272a'}`,
                    background: fondo === f.value ? f.color : '#09090b',
                    color: fondo === f.value ? '#fff' : '#71717a',
                    fontWeight: 600, fontSize: 14,
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botón generar */}
          <button onClick={handleGenerate} disabled={generating || sending}
            style={{
              padding: '13px', borderRadius: 10, border: 'none',
              background: generating ? '#3f3f46' : '#a855f7',
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: generating ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
            {generating
              ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generando video (1-3 minutos)...</>
              : <><Video size={16} /> Generar video con el avatar</>
            }
          </button>

          {/* Video listo */}
          {videoReady && videoUrl && (
            <div style={{ background: '#18181b', border: '1px solid #a855f744', borderRadius: 14, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CheckCircle size={18} style={{ color: '#22c55e' }} />
                <p style={{ color: '#22c55e', fontWeight: 600 }}>¡Video listo!</p>
              </div>

              <video controls style={{ width: '100%', borderRadius: 10, marginBottom: 16 }} src={videoUrl} />

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
                  Enviar a
                </label>
                <select value={broadcastTo} onChange={e => setBroadcastTo(e.target.value)}
                  style={{ ...inputSt, cursor: 'pointer' }}>
                  <option value="todos">Todos los contactos</option>
                  <option value="opted_in">Solo opt-in</option>
                </select>
              </div>

              <button onClick={handleSendBroadcast} disabled={sending}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                  background: sending ? '#3f3f46' : '#CE1126',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                <Send size={15} />
                {sending ? 'Enviando...' : '🚀 Enviar video por WhatsApp masivo'}
              </button>
            </div>
          )}

          {error   && <div style={{ background: '#3f1212', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13 }}>{error}</div>}
          {success && <div style={{ background: '#0c1a0c', border: '1px solid #14532d', borderRadius: 8, padding: '10px 14px', color: '#86efac', fontSize: 13 }}>{success}</div>}

          {/* Info configuración */}
          <div style={{ background: '#09090b', borderRadius: 10, padding: 16, border: '1px solid #27272a' }}>
            <p style={{ color: '#52525b', fontSize: 12, marginBottom: 6 }}>⚙️ Variables requeridas en Render → Environment:</p>
            <code style={{ color: '#a855f7', fontSize: 12, display: 'block', marginBottom: 4 }}>HEYGEN_API_KEY = tu_api_key_de_heygen</code>
            <code style={{ color: '#a855f7', fontSize: 12, display: 'block' }}>HEYGEN_AVATAR_ID = id_del_avatar_del_tigre</code>
            <p style={{ color: '#52525b', fontSize: 11, marginTop: 8 }}>
              API Key en app.heygen.com → Settings → API. Avatar ID en tu librería de avatares.
            </p>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  )
}