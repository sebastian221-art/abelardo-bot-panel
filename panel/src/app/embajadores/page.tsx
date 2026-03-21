'use client'
// 📄 panel/src/app/embajadores/page.tsx
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { getAmbassadors, sendBroadcast, createBroadcast } from '@/lib/api'
import { Star, Trophy, Send, Users, Gift } from 'lucide-react'

export default function EmbajadoresPage() {
  const [items,   setItems]   = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    getAmbassadors(50)
      .then(d => { setItems(d as unknown[]); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function activarEmbajadores() {
    if (!confirm('¿Enviar mensaje de activación de embajadores a todos los contactos con opt-in?')) return
    setSending(true)
    try {
      const mensaje =
        `⭐ *¡Eres un Defensor de la Patria!* 🇨🇴\n\n` +
        `Llevas tiempo apoyando la campaña de Abelardo. ¡Gracias!\n\n` +
        `¿Quieres ayudar a crecer el movimiento?\n\n` +
        `Comparte esta campaña con tus familiares y amigos. ` +
        `Cada persona que se una por tu recomendación suma al movimiento más grande de Colombia.\n\n` +
        `*¿Qué ganas siendo embajador?*\n` +
        `🏆 Reconocimiento en el ranking nacional\n` +
        `🎯 Posibilidad de conocer a Abelardo personalmente\n` +
        `🎁 Acceso especial a eventos de campaña\n\n` +
        `Responde *EMBAJADOR* para unirte al equipo.`

      const b = await createBroadcast({
        title:   'Activación embajadores',
        message: mensaje,
        segment: 'opted_in',
      }) as Record<string, unknown>

      await sendBroadcast(b.id as number)
      setSuccess('✅ Mensaje de activación enviado a todos los contactos con opt-in')
    } catch (e) {
      setSuccess('❌ Error al enviar')
    } finally {
      setSending(false)
    }
  }

  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <Layout>
      <div style={{ padding: 32, maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Star size={22} style={{ color: '#FCD116' }} />
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Embajadores</h1>
          </div>
          <button onClick={activarEmbajadores} disabled={sending}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', background: sending ? '#3f3f46' : '#FCD116', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Send size={14} />
            {sending ? 'Enviando...' : 'Activar embajadores'}
          </button>
        </div>
        <p style={{ color: '#71717a', fontSize: 13, marginBottom: 24 }}>
          Simpatizantes que más contactos han invitado a la campaña
        </p>

        {/* Explicación */}
        <div style={{ background: '#1c1a08', border: '1px solid #FCD11633', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <p style={{ color: '#FCD116', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>⭐ ¿Cómo funciona el sistema de embajadores?</p>
          <p style={{ color: '#a1a1aa', fontSize: 12, lineHeight: 1.7 }}>
            1. Clic en "Activar embajadores" → envía un mensaje a todos los contactos con opt-in invitándolos a unirse<br />
            2. Quienes respondan <strong style={{ color: '#fff' }}>EMBAJADOR</strong> quedan registrados como embajadores activos<br />
            3. Cada vez que refieren a alguien que se une, suman puntos en el ranking<br />
            4. El Top 10 de cada ciudad puede ganar un encuentro personal con Abelardo
          </p>
        </div>

        {success && (
          <div style={{ background: '#0c1a0c', border: '1px solid #14532d', borderRadius: 8, padding: '10px 14px', color: '#86efac', fontSize: 13, marginBottom: 16 }}>
            {success}
          </div>
        )}

        {/* Stats rápidas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Embajadores activos', val: items.length, icon: Users, color: '#FCD116' },
            { label: 'Total referidos', val: (items as Record<string,number>[]).reduce((a, b) => a + (b.referrals || 0), 0), icon: Star, color: '#22c55e' },
            { label: 'Top ciudad', val: (items[0] as Record<string,string>)?.city || '—', icon: Trophy, color: '#6366f1' },
          ].map(s => (
            <div key={s.label} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: '16px 18px' }}>
              <p style={{ color: '#52525b', fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 22, fontWeight: 700 }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Ranking */}
        {loading ? (
          <p style={{ color: '#52525b', textAlign: 'center', padding: 48 }}>Cargando...</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64 }}>
            <Trophy size={40} style={{ color: '#27272a', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: '#52525b', fontSize: 14 }}>Aún no hay embajadores activos</p>
            <p style={{ color: '#3f3f46', fontSize: 12, marginTop: 6 }}>
              Clic en "Activar embajadores" para enviar el mensaje de reclutamiento
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ color: '#a1a1aa', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Ranking nacional</p>
            {items.map((item: unknown, i) => {
              const e = item as Record<string, unknown>
              const top3 = i < 3
              return (
                <div key={e.phone as string} style={{
                  background: top3 ? '#18181b' : '#111113',
                  border: `1px solid ${top3 ? '#FCD11644' : '#27272a'}`,
                  borderRadius: 12, padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <span style={{ fontSize: top3 ? 24 : 14, color: '#71717a', width: 28, textAlign: 'center', flexShrink: 0 }}>
                    {MEDALS[i] || `#${i + 1}`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#e4e4e7', fontWeight: 600, fontSize: 14 }}>{(e.name as string) || 'Simpatizante'}</p>
                    <p style={{ color: '#52525b', fontSize: 11 }}>{e.phone as string} · {(e.city as string) || 'Sin ciudad'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: top3 ? '#FCD116' : '#a1a1aa', fontSize: 22, fontWeight: 700 }}>{e.referrals as number}</p>
                    <p style={{ color: '#52525b', fontSize: 10 }}>referidos</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}