'use client'
// 📄 panel/src/app/analytics/page.tsx
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { getDailyMsgs, getTopIntents, getOptinCurve, getCities } from '@/lib/api'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const tooltip = { contentStyle:{ background:'#1c1c1f', border:'1px solid #27272a', color:'#fff', fontSize:12 } }

export default function AnalyticsPage() {
  const [daily,  setDaily]  = useState<unknown[]>([])
  const [intents,setIntents]= useState<unknown[]>([])
  const [curve,  setCurve]  = useState<unknown[]>([])
  const [cities, setCities] = useState<unknown[]>([])

  useEffect(() => {
    getDailyMsgs(30).then(d => setDaily(d as unknown[])).catch(console.error)
    getTopIntents(30).then(d => setIntents(d as unknown[])).catch(console.error)
    getOptinCurve(30).then(d => setCurve(d as unknown[])).catch(console.error)
    getCities().then(d => setCities(d as unknown[])).catch(console.error)
  }, [])

  const card: React.CSSProperties = {
    background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:22,
  }

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:1200 }}>
        <h1 style={{ color:'#fff', fontSize:22, fontWeight:700, marginBottom:6 }}>Analítica</h1>
        <p style={{ color:'#71717a', fontSize:13, marginBottom:28 }}>Últimos 30 días</p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={card}>
            <p style={{ color:'#fff', fontWeight:600, fontSize:14, marginBottom:18 }}>Mensajes por día</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={daily as object[]}>
                <XAxis dataKey="date" tick={{ fill:'#52525b', fontSize:9 }} tickFormatter={v => v.slice(5)}/>
                <YAxis tick={{ fill:'#52525b', fontSize:10 }}/>
                <Tooltip {...tooltip}/>
                <Area type="monotone" dataKey="total" stroke="#FCD116" fill="#FCD11622" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <p style={{ color:'#fff', fontWeight:600, fontSize:14, marginBottom:18 }}>Curva de opt-in acumulado</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={curve as object[]}>
                <XAxis dataKey="date" tick={{ fill:'#52525b', fontSize:9 }} tickFormatter={v => v.slice(5)}/>
                <YAxis tick={{ fill:'#52525b', fontSize:10 }}/>
                <Tooltip {...tooltip}/>
                <Area type="monotone" dataKey="acumulado" stroke="#22c55e" fill="#22c55e22" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={card}>
            <p style={{ color:'#fff', fontWeight:600, fontSize:14, marginBottom:18 }}>Temas más consultados</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={intents as object[]} layout="vertical">
                <XAxis type="number" tick={{ fill:'#52525b', fontSize:10 }}/>
                <YAxis type="category" dataKey="intent" tick={{ fill:'#a1a1aa', fontSize:11 }} width={90}/>
                <Tooltip {...tooltip}/>
                <Bar dataKey="total" fill="#CE1126" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <p style={{ color:'#fff', fontWeight:600, fontSize:14, marginBottom:18 }}>Opt-in por ciudad (top 10)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(cities as object[]).slice(0,10)} layout="vertical">
                <XAxis type="number" tick={{ fill:'#52525b', fontSize:10 }}/>
                <YAxis type="category" dataKey="city" tick={{ fill:'#a1a1aa', fontSize:11 }} width={90}/>
                <Tooltip {...tooltip}/>
                <Bar dataKey="total" fill="#0D1B3E" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  )
}
