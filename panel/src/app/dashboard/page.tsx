'use client'
// 📄 panel/src/app/dashboard/page.tsx  ← REEMPLAZA EL ANTERIOR
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import { getStats, getDailyMsgs, getTopIntents } from '@/lib/api'
import { Users, MessageSquare, TrendingUp, UserCheck, Radio } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

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
          <StatCard label="Total contactos"    value={String(stats.total_contacts   || 0)} icon={Users}         color="#6366f1" />
          <StatCard label="Con opt-in"          value={String(stats.opted_in         || 0)} icon={UserCheck}     color="#10b981" sub={`${stats.optin_rate || 0}% del total`} />
          <StatCard label="Mensajes hoy"        value={String(stats.msgs_today       || 0)} icon={MessageSquare} color="#0ea5e9" />
          <StatCard label="Activos hoy"         value={String(stats.active_today     || 0)} icon={TrendingUp}    color="#f59e0b" />
          <StatCard label="Opt-in hoy"          value={String(stats.opted_in_today   || 0)} icon={UserCheck}     color="#22c55e" />
          <StatCard label="Broadcasts enviados" value={String(stats.total_broadcasts || 0)} icon={Radio}         color="#CE1126" />
        </div>

        {/* Gráficas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: 22 }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 18 }}>Mensajes por día (14 días)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={daily as object[]}>
                <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
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