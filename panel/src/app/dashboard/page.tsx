'use client'
// 📄 panel/src/app/dashboard/page.tsx  ← REEMPLAZA EL ANTERIOR
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import { getStats, getDailyMsgs, getTopIntents } from '@/lib/api'
import { Users, MessageSquare, Send, TrendingUp, UserCheck, Radio, Link, Copy, Check } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

// ── Número de WhatsApp de la campaña ─────────────────────────────
// Cambia este número por el real de la campaña
const WA_NUMBER = '573155263833'

const CHAT_LINKS = [
  {
    label:   '🌐 General',
    ref:     '',
    color:   '#6366f1',
    mensaje: 'Hola! Quiero recibir información sobre la campaña de Abelardo de la Espriella 2026 🇨🇴',
  },
  {
    label:   '🦁 Defensores de la Patria',
    ref:     'defensores',
    color:   '#FCD116',
    mensaje: 'Hola! Vengo desde el sitio de Defensores de la Patria y quiero recibir información de la campaña de Abelardo 🇨🇴',
  },
  {
    label:   '✍️ Firmantes',
    ref:     'firma',
    color:   '#22c55e',
    mensaje: 'Hola! Firmé en apoyo a Abelardo y quiero recibir información de la campaña 🇨🇴',
  },
  {
    label:   '🎤 Eventos',
    ref:     'evento',
    color:   '#0ea5e9',
    mensaje: 'Hola! Los conocí en un evento y quiero recibir información de la campaña de Abelardo 🇨🇴',
  },
  {
    label:   '📱 Redes sociales',
    ref:     'redes',
    color:   '#f59e0b',
    mensaje: 'Hola! Los encontré en redes y quiero saber más sobre la campaña de Abelardo 🇨🇴',
  },
]

function buildWaLink(mensaje: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(mensaje)}`
}

function LinkRow({ label, mensaje, color }: { label: string; mensaje: string; color: string }) {
  const [copied, setCopied] = useState(false)
  const link = buildWaLink(mensaje)

  function handleCopy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      background: '#09090b',
      borderRadius: 10,
      border: '1px solid #27272a',
    }}>
      {/* Label */}
      <span style={{
        color, fontWeight: 700, fontSize: 13,
        minWidth: 190, flexShrink: 0,
      }}>
        {label}
      </span>

      {/* URL preview */}
      <span style={{
        color: '#52525b', fontSize: 11, fontFamily: 'monospace',
        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {link}
      </span>

      {/* Botón copiar */}
      <button onClick={handleCopy}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 7, border: 'none', flexShrink: 0,
          background: copied ? '#14532d' : '#27272a',
          color: copied ? '#86efac' : '#a1a1aa',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          transition: 'all .15s',
        }}>
        {copied
          ? <><Check size={13}/> Copiado</>
          : <><Copy size={13}/> Copiar</>
        }
      </button>
    </div>
  )
}

export default function Dashboard() {
  const [stats,   setStats]   = useState<Record<string, unknown>>({})
  const [daily,   setDaily]   = useState<unknown[]>([])
  const [intents, setIntents] = useState<unknown[]>([])

  useEffect(() => {
    getStats().then(setStats).catch(console.error)
    getDailyMsgs(14).then(d => setDaily(d as unknown[])).catch(console.error)
    getTopIntents(7).then(d => setIntents(d as unknown[])).catch(console.error)
  }, [])

  return (
    <Layout>
      <div style={{ padding: 32, maxWidth: 1200 }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Dashboard</h1>
        <p style={{ color: '#71717a', fontSize: 13, marginBottom: 28 }}>Resumen general de la campaña</p>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard label="Total contactos"    value={String(stats.total_contacts   || 0)} icon={Users}        color="#6366f1" />
          <StatCard label="Con opt-in"          value={String(stats.opted_in         || 0)} icon={UserCheck}    color="#10b981" sub={`${stats.optin_rate || 0}% del total`} />
          <StatCard label="Mensajes hoy"        value={String(stats.msgs_today       || 0)} icon={MessageSquare} color="#0ea5e9" />
          <StatCard label="Activos hoy"         value={String(stats.active_today     || 0)} icon={TrendingUp}   color="#f59e0b" />
          <StatCard label="Opt-in hoy"          value={String(stats.opted_in_today   || 0)} icon={UserCheck}    color="#22c55e" />
          <StatCard label="Broadcasts enviados" value={String(stats.total_broadcasts || 0)} icon={Radio}        color="#CE1126" />
        </div>

        {/* Links del chat */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Link size={18} style={{ color: '#FCD116' }} />
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Links del chat</p>
          </div>
          <p style={{ color: '#71717a', fontSize: 12, marginBottom: 18 }}>
            Copia el link y compártelo por WhatsApp, Instagram o redes. Quien lo abra irá directo al chat de la campaña.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CHAT_LINKS.map(l => (
              <LinkRow key={l.ref} label={l.label} mensaje={l.mensaje} color={l.color} />
            ))}
          </div>
        </div>

        {/* Gráficas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: 22 }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 18 }}>Mensajes por día (14 días)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={daily as object[]}>
                <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} tickFormatter={v => (v as string).slice(5)} />
                <YAxis tick={{ fill: '#52525b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1c1c1f', border: '1px solid #27272a', color: '#fff', fontSize: 12 }} />
                <Line type="monotone" dataKey="total" stroke="#FCD116" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: 22 }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 18 }}>Temas más consultados (7 días)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={intents as object[]} layout="vertical">
                <XAxis type="number" tick={{ fill: '#52525b', fontSize: 10 }} />
                <YAxis type="category" dataKey="intent" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={90} />
                <Tooltip contentStyle={{ background: '#1c1c1f', border: '1px solid #27272a', color: '#fff', fontSize: 12 }} />
                <Bar dataKey="total" fill="#CE1126" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </Layout>
  )
}