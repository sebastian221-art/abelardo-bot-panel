'use client'
// 📄 panel/src/app/embajadores/page.tsx  ← REEMPLAZA EL ANTERIOR (ahora es la página de Links)
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { getGroups } from '@/lib/api'
import { Link, Copy, Check, Plus, X, Users, TrendingUp, RefreshCw, ExternalLink } from 'lucide-react'

const API     = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WA_NUM  = '573154559242' // ← cambia por el número real de la campaña

type Group    = { id: number; name: string; color: string; icon: string; count: number }
type LinkStat = { ref: string; label: string; color: string; clicks: number; last_click?: string; wa_link: string }

const BASE_LINKS = [
  { ref:'general',    label:'🌐 General',                color:'#6366f1', msg:'Hola! Quiero información sobre la campaña de Abelardo de la Espriella 2026 🇨🇴' },
  { ref:'defensores', label:'🦁 Defensores de la Patria', color:'#FCD116', msg:'Hola! Vengo desde el sitio de Defensores de la Patria y quiero información de la campaña 🇨🇴' },
  { ref:'firma',      label:'✍️ Firmantes',               color:'#22c55e', msg:'Hola! Firmé en apoyo a Abelardo y quiero recibir información de la campaña 🇨🇴' },
  { ref:'evento',     label:'🎤 Eventos',                 color:'#0ea5e9', msg:'Hola! Los conocí en un evento y quiero información de la campaña de Abelardo 🇨🇴' },
  { ref:'redes',      label:'📱 Redes sociales',          color:'#f59e0b', msg:'Hola! Los encontré en redes y quiero saber más sobre la campaña de Abelardo 🇨🇴' },
]

function buildWaLink(msg: string): string {
  return `https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handleCopy}
      style={{
        display:'flex', alignItems:'center', gap:5,
        padding:'6px 12px', borderRadius:7, border:'none', flexShrink:0,
        background: copied ? '#14532d' : '#27272a',
        color: copied ? '#86efac' : '#a1a1aa',
        fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .15s',
      }}>
      {copied ? <><Check size={12}/> Copiado</> : <><Copy size={12}/> Copiar</>}
    </button>
  )
}

export default function LinksPage() {
  const [groups,      setGroups]      = useState<Group[]>([])
  const [stats,       setStats]       = useState<Record<string, number>>({})
  const [loading,     setLoading]     = useState(true)
  const [showCustom,  setShowCustom]  = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [customRef,   setCustomRef]   = useState('')
  const [customMsg,   setCustomMsg]   = useState('')
  const [customLinks, setCustomLinks] = useState<typeof BASE_LINKS>([])
  const [error,       setError]       = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const gs = await getGroups()
      setGroups(gs as Group[])
      // Intentar cargar stats de clicks
      const token = localStorage.getItem('token')
      const res   = await fetch(`${API}/links/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json() as Record<string, number>
        setStats(data)
      }
    } catch { /* stats opcionales */ }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // Links de grupos automáticos
  const groupLinks = groups.map(g => ({
    ref:   `grupo_${g.id}`,
    label: `${g.icon} ${g.name}`,
    color: g.color,
    msg:   `Hola! Me dijeron que soy parte del grupo ${g.name} de la campaña de Abelardo 🇨🇴`,
  }))

  const allLinks = [...BASE_LINKS, ...groupLinks, ...customLinks]

  function handleAddCustom() {
    setError('')
    if (!customLabel.trim()) return setError('El nombre es obligatorio')
    if (!customRef.trim())   return setError('La clave URL es obligatoria (sin espacios)')
    if (!customMsg.trim())   return setError('El mensaje es obligatorio')
    if (/\s/.test(customRef)) return setError('La clave no puede tener espacios. Usa guiones.')

    setCustomLinks(prev => [...prev, {
      ref:   customRef.toLowerCase(),
      label: customLabel,
      color: '#a855f7',
      msg:   customMsg,
    }])
    setCustomLabel(''); setCustomRef(''); setCustomMsg('')
    setShowCustom(false)
  }

  const totalClicks = Object.values(stats).reduce((a, b) => a + b, 0)

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:900 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Link size={22} style={{ color:'#FCD116' }}/>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>Links del chat</h1>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={loadData}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:12, cursor:'pointer' }}>
              <RefreshCw size={12}/> Actualizar
            </button>
            <button onClick={() => setShowCustom(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background:'#a855f7', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <Plus size={13}/> Link personalizado
            </button>
          </div>
        </div>
        <p style={{ color:'#71717a', fontSize:13, marginBottom:28 }}>
          Copia y comparte estos links. Quien los abra irá directo al chat de WhatsApp de la campaña.
          Los grupos crean links automáticamente.
        </p>

        {/* Stats globales */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'Total links',   val: allLinks.length,  color:'#6366f1' },
            { label:'Clicks totales',val: totalClicks,      color:'#FCD116' },
            { label:'Links de grupos',val: groupLinks.length,color:'#22c55e' },
          ].map(s => (
            <div key={s.label} style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:12, padding:'16px 18px' }}>
              <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase', marginBottom:6 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize:24, fontWeight:700 }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Links base */}
        <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:20, marginBottom:16 }}>
          <p style={{ color:'#a1a1aa', fontSize:11, fontWeight:600, textTransform:'uppercase', marginBottom:14 }}>
            Links de la campaña
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {BASE_LINKS.map(l => {
              const waLink = buildWaLink(l.msg)
              const clicks = stats[l.ref] || 0
              return (
                <div key={l.ref} style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'12px 14px', background:'#09090b',
                  borderRadius:10, border:`1px solid ${l.color}22`,
                }}>
                  <span style={{ color: l.color, fontWeight:700, fontSize:13, minWidth:200, flexShrink:0 }}>
                    {l.label}
                  </span>
                  <span style={{ color:'#3f3f46', fontSize:11, fontFamily:'monospace', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {waLink}
                  </span>
                  {clicks > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                      <TrendingUp size={12} style={{ color:'#22c55e' }}/>
                      <span style={{ color:'#22c55e', fontSize:12, fontWeight:700 }}>{clicks}</span>
                    </div>
                  )}
                  <a href={waLink} target="_blank" rel="noreferrer"
                    style={{ color:'#52525b', cursor:'pointer', flexShrink:0 }}>
                    <ExternalLink size={13}/>
                  </a>
                  <CopyBtn text={waLink}/>
                </div>
              )
            })}
          </div>
        </div>

        {/* Links de grupos */}
        {groupLinks.length > 0 && (
          <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:20, marginBottom:16 }}>
            <p style={{ color:'#a1a1aa', fontSize:11, fontWeight:600, textTransform:'uppercase', marginBottom:14 }}>
              Links por grupo (generados automáticamente)
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {groupLinks.map(l => {
                const waLink = buildWaLink(l.msg)
                const clicks = stats[l.ref] || 0
                return (
                  <div key={l.ref} style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'12px 14px', background:'#09090b',
                    borderRadius:10, border:`1px solid ${l.color}22`,
                  }}>
                    <span style={{ color: l.color, fontWeight:700, fontSize:13, minWidth:200, flexShrink:0 }}>
                      {l.label}
                    </span>
                    <span style={{ color:'#3f3f46', fontSize:11, fontFamily:'monospace', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {waLink}
                    </span>
                    {clicks > 0 && (
                      <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                        <TrendingUp size={12} style={{ color:'#22c55e' }}/>
                        <span style={{ color:'#22c55e', fontSize:12, fontWeight:700 }}>{clicks}</span>
                      </div>
                    )}
                    <a href={waLink} target="_blank" rel="noreferrer"
                      style={{ color:'#52525b', cursor:'pointer', flexShrink:0 }}>
                      <ExternalLink size={13}/>
                    </a>
                    <CopyBtn text={waLink}/>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Links personalizados */}
        {customLinks.length > 0 && (
          <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:20, marginBottom:16 }}>
            <p style={{ color:'#a1a1aa', fontSize:11, fontWeight:600, textTransform:'uppercase', marginBottom:14 }}>
              Links personalizados
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {customLinks.map((l, i) => {
                const waLink = buildWaLink(l.msg)
                return (
                  <div key={l.ref} style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'12px 14px', background:'#09090b',
                    borderRadius:10, border:'1px solid #a855f722',
                  }}>
                    <span style={{ color:'#a855f7', fontWeight:700, fontSize:13, minWidth:200, flexShrink:0 }}>
                      {l.label}
                    </span>
                    <span style={{ color:'#3f3f46', fontSize:11, fontFamily:'monospace', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {waLink}
                    </span>
                    <button onClick={() => setCustomLinks(prev => prev.filter((_, j) => j !== i))}
                      style={{ background:'transparent', border:'none', color:'#52525b', cursor:'pointer', flexShrink:0 }}>
                      <X size={13}/>
                    </button>
                    <CopyBtn text={waLink}/>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tip */}
        <div style={{ background:'#09090b', borderRadius:10, padding:16, border:'1px solid #27272a' }}>
          <p style={{ color:'#52525b', fontSize:12, lineHeight:1.7 }}>
            💡 <strong style={{ color:'#a1a1aa' }}>Cómo usar los links:</strong><br/>
            Copia cualquier link y compártelo por WhatsApp, Instagram, Facebook o SMS.<br/>
            Cuando alguien lo abre en el celular, va directo al chat de la campaña con el mensaje prellenado.<br/>
            Cada link tiene un mensaje diferente según de dónde viene la persona.
          </p>
        </div>

      </div>

      {/* Modal link personalizado */}
      {showCustom && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:16, padding:28, width:460, maxWidth:'95vw' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ color:'#fff', fontSize:16, fontWeight:700 }}>Crear link personalizado</h2>
              <button onClick={() => setShowCustom(false)} style={{ background:'transparent', border:'none', color:'#71717a', cursor:'pointer' }}>
                <X size={18}/>
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>Nombre del link *</label>
                <input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                  placeholder="ej: 🏘️ Barrio Centro"
                  style={{ width:'100%', padding:'10px 12px', background:'#09090b', border:'1px solid #27272a', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box' as const }}/>
              </div>
              <div>
                <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>Clave URL * <span style={{ color:'#52525b', fontWeight:400, textTransform:'none' }}>(sin espacios)</span></label>
                <input value={customRef} onChange={e => setCustomRef(e.target.value.replace(/\s/g,''))}
                  placeholder="ej: barrio-centro"
                  style={{ width:'100%', padding:'10px 12px', background:'#09090b', border:'1px solid #27272a', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box' as const }}/>
                {customRef && (
                  <p style={{ color:'#52525b', fontSize:11, marginTop:4, fontFamily:'monospace' }}>
                    ...?text=...&ref={customRef}
                  </p>
                )}
              </div>
              <div>
                <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>Mensaje prellenado *</label>
                <textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)}
                  placeholder="ej: Hola! Vengo del Barrio Centro y quiero información de la campaña 🇨🇴"
                  rows={3}
                  style={{ width:'100%', padding:'10px 12px', background:'#09090b', border:'1px solid #27272a', borderRadius:8, color:'#fff', fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' as const }}/>
              </div>
              {error && <p style={{ color:'#fca5a5', fontSize:12, background:'#3f1212', padding:'8px 12px', borderRadius:7 }}>{error}</p>}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowCustom(false)}
                  style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleAddCustom}
                  style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background:'#a855f7', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  ✅ Crear link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}