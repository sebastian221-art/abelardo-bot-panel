'use client'
// 📄 panel/src/app/analytics/page.tsx  ← REEMPLAZA EL ANTERIOR
import { useEffect, useState, useCallback } from 'react'
import Layout from '@/components/Layout'
import { getDailyMsgs, getTopIntents, getOptinCurve, getCities, getStats } from '@/lib/api'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Download, RefreshCw, TrendingUp, Users, MessageSquare, UserCheck } from 'lucide-react'

const TOOLTIP_STYLE = {
  contentStyle: { background:'#1c1c1f', border:'1px solid #27272a', color:'#fff', fontSize:12, borderRadius:8 },
}
const COLORS = ['#6366f1','#CE1126','#22c55e','#f59e0b','#0ea5e9','#a855f7','#f97316','#10b981']

const RANGOS = [
  { label:'7 días',  days:7  },
  { label:'14 días', days:14 },
  { label:'30 días', days:30 },
  { label:'60 días', days:60 },
  { label:'90 días', days:90 },
]

export default function AnalyticsPage() {
  const [rango,   setRango]   = useState(30)
  const [daily,   setDaily]   = useState<unknown[]>([])
  const [intents, setIntents] = useState<unknown[]>([])
  const [curve,   setCurve]   = useState<unknown[]>([])
  const [cities,  setCities]  = useState<unknown[]>([])
  const [stats,   setStats]   = useState<Record<string,unknown>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      getDailyMsgs(rango).then(d => setDaily(d as unknown[])),
      getTopIntents(rango).then(d => setIntents(d as unknown[])),
      getOptinCurve(rango).then(d => setCurve(d as unknown[])),
      getCities().then(d => setCities(d as unknown[])),
      getStats().then(d => setStats(d as Record<string,unknown>)),
    ]).catch(console.error)
    setLoading(false)
  }, [rango])

  useEffect(() => { load() }, [load])

  function exportCSV(data: unknown[], filename: string, headers: string[]) {
    const rows = (data as Record<string,unknown>[]).map(r =>
      headers.map(h => String(r[h] ?? '')).join(',')
    )
    const csv  = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const card: React.CSSProperties = {
    background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:22,
  }

  // Calcular totales del período
  const totalMsgs    = (daily as Record<string,number>[]).reduce((a, d) => a + (d.total || 0), 0)
  const peakDay      = (daily as Record<string,unknown>[]).reduce((a, d) => (d.total as number) > (a.total as number || 0) ? d : a, {} as Record<string,unknown>)
  const topIntent    = (intents as Record<string,unknown>[])[0]
  const topCity      = (cities  as Record<string,unknown>[])[0]

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:1300 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>Analítica</h1>
            <p style={{ color:'#71717a', fontSize:13 }}>Métricas detalladas de la campaña</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={load}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:12, cursor:'pointer' }}>
              <RefreshCw size={13}/> {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Selector de rango */}
        <div style={{ display:'flex', gap:8, marginBottom:24 }}>
          {RANGOS.map(r => (
            <button key={r.days} onClick={() => setRango(r.days)}
              style={{
                padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
                border:`1px solid ${rango === r.days ? '#FCD116' : '#27272a'}`,
                background: rango === r.days ? '#2a2200' : 'transparent',
                color: rango === r.days ? '#FCD116' : '#71717a',
              }}>
              {r.label}
            </button>
          ))}
        </div>

        {/* KPIs del período */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:24 }}>
          {[
            { label:`Mensajes (${rango}d)`,  val: totalMsgs.toLocaleString(),                     color:'#0ea5e9', icon: MessageSquare },
            { label:'Total contactos',        val: String(stats.total_contacts  || 0),             color:'#6366f1', icon: Users },
            { label:'Con opt-in',             val: String(stats.opted_in        || 0),             color:'#22c55e', icon: UserCheck },
            { label:'Tasa opt-in',            val: `${stats.optin_rate          || 0}%`,           color:'#f59e0b', icon: TrendingUp },
            { label:'Día pico',               val: peakDay.date ? String(peakDay.date).slice(5) : '—', color:'#CE1126', icon: TrendingUp },
            { label:'Tema top',               val: topIntent ? (topIntent.intent as string) : '—',color:'#a855f7', icon: MessageSquare },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding:'16px 18px' }}>
              <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase', marginBottom:6 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize:22, fontWeight:700 }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Gráficas fila 1 */}
        <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16, marginBottom:16 }}>

          {/* Mensajes por día */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <p style={{ color:'#fff', fontWeight:600, fontSize:14 }}>Mensajes por día</p>
              <button onClick={() => exportCSV(daily, 'mensajes_diarios.csv', ['date','total','user','assistant'])}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:6, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:11, cursor:'pointer' }}>
                <Download size={11}/> CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={daily as object[]}>
                <XAxis dataKey="date" tick={{ fill:'#52525b', fontSize:9 }} tickFormatter={v => (v as string).slice(5)}/>
                <YAxis tick={{ fill:'#52525b', fontSize:10 }}/>
                <Tooltip {...TOOLTIP_STYLE}/>
                <Area type="monotone" dataKey="total" stroke="#FCD116" fill="#FCD11615" strokeWidth={2} name="Total"/>
                <Area type="monotone" dataKey="user"  stroke="#0ea5e9" fill="#0ea5e910" strokeWidth={1.5} name="Usuarios"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Temas top */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <p style={{ color:'#fff', fontWeight:600, fontSize:14 }}>Temas consultados</p>
              <button onClick={() => exportCSV(intents, 'temas.csv', ['intent','total'])}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:6, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:11, cursor:'pointer' }}>
                <Download size={11}/> CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(intents as object[]).slice(0,7)} layout="vertical">
                <XAxis type="number" tick={{ fill:'#52525b', fontSize:10 }}/>
                <YAxis type="category" dataKey="intent" tick={{ fill:'#a1a1aa', fontSize:11 }} width={85}/>
                <Tooltip {...TOOLTIP_STYLE}/>
                <Bar dataKey="total" radius={[0,4,4,0]}>
                  {(intents as object[]).slice(0,7).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Gráficas fila 2 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

          {/* Curva opt-in */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <p style={{ color:'#fff', fontWeight:600, fontSize:14 }}>Crecimiento opt-in acumulado</p>
              <button onClick={() => exportCSV(curve, 'optin_curva.csv', ['date','acumulado','nuevos'])}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:6, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:11, cursor:'pointer' }}>
                <Download size={11}/> CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={curve as object[]}>
                <XAxis dataKey="date" tick={{ fill:'#52525b', fontSize:9 }} tickFormatter={v => (v as string).slice(5)}/>
                <YAxis tick={{ fill:'#52525b', fontSize:10 }}/>
                <Tooltip {...TOOLTIP_STYLE}/>
                <Area type="monotone" dataKey="acumulado" stroke="#22c55e" fill="#22c55e15" strokeWidth={2} name="Acumulado"/>
                <Area type="monotone" dataKey="nuevos"    stroke="#0ea5e9" fill="#0ea5e910" strokeWidth={1.5} name="Nuevos/día"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top ciudades */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <p style={{ color:'#fff', fontWeight:600, fontSize:14 }}>Contactos por ciudad (top 10)</p>
              <button onClick={() => exportCSV(cities, 'ciudades.csv', ['city','total'])}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:6, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:11, cursor:'pointer' }}>
                <Download size={11}/> CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(cities as object[]).slice(0,10)} layout="vertical">
                <XAxis type="number" tick={{ fill:'#52525b', fontSize:10 }}/>
                <YAxis type="category" dataKey="city" tick={{ fill:'#a1a1aa', fontSize:11 }} width={85}/>
                <Tooltip {...TOOLTIP_STYLE}/>
                <Bar dataKey="total" fill="#0D1B3E" radius={[0,4,4,0]}>
                  {(cities as object[]).slice(0,10).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Pie chart temas + tabla ciudades */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16 }}>

          {/* Pie temas */}
          {intents.length > 0 && (
            <div style={card}>
              <p style={{ color:'#fff', fontWeight:600, fontSize:14, marginBottom:18 }}>Distribución de temas</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={intents as object[]} dataKey="total" nameKey="intent" cx="50%" cy="50%" outerRadius={80} label={({ intent }) => intent}>
                    {(intents as object[]).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabla ciudades completa */}
          <div style={card}>
            <p style={{ color:'#fff', fontWeight:600, fontSize:14, marginBottom:16 }}>Todas las ciudades</p>
            <div style={{ maxHeight:240, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['#','Ciudad','Contactos','%'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:10, color:'#52525b', textTransform:'uppercase', borderBottom:'1px solid #27272a' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(cities as Record<string,unknown>[]).map((c, i) => {
                    const cityTotal = stats.total_contacts as number || 1
                    const pct = Math.round(((c.total as number) / cityTotal) * 100)
                    return (
                      <tr key={String(c.city)}>
                        <td style={{ padding:'8px 12px', color:'#52525b', fontSize:12 }}>{i+1}</td>
                        <td style={{ padding:'8px 12px', color:'#e4e4e7', fontSize:13, fontWeight: i < 3 ? 600 : 400 }}>
                          {i < 3 ? ['🥇','🥈','🥉'][i] : ''} {c.city as string || 'Sin ciudad'}
                        </td>
                        <td style={{ padding:'8px 12px', color: COLORS[i % COLORS.length], fontSize:13, fontWeight:700 }}>
                          {(c.total as number).toLocaleString()}
                        </td>
                        <td style={{ padding:'8px 12px', color:'#52525b', fontSize:12 }}>{pct}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  )
}