'use client'
// 📄 panel/src/app/contactos/page.tsx
import { useEffect, useState, useRef } from 'react'
import Layout from '@/components/Layout'
import { getContacts, importContacts } from '@/lib/api'
import { Search, Upload, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react'

export default function ContactosPage() {
  const [data,    setData]    = useState<Record<string,unknown>>({ total:0, contacts:[] })
  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')
  const [optedIn, setOptedIn] = useState('')
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const filters: Record<string,string> = {}
    if (optedIn) filters.opted_in = optedIn
    const d = await getContacts(page, filters)
    setData(d as Record<string,unknown>)
    setLoading(false)
  }

  useEffect(() => { load() }, [page, optedIn])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const r = await importContacts(file)
    alert(`✅ Importados: ${r.created} nuevos, ${r.updated} actualizados`)
    setImporting(false)
    load()
  }

  const contacts = (data.contacts as unknown[]) || []
  const total    = (data.total as number) || 0
  const pages    = Math.ceil(total / 50)

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:1100 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>Contactos</h1>
            <p style={{ color:'#71717a', fontSize:13 }}>{total.toLocaleString()} contactos totales</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <select value={optedIn} onChange={e => { setOptedIn(e.target.value); setPage(1) }}
              style={{ padding:'8px 12px', background:'#18181b', border:'1px solid #27272a', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer' }}>
              <option value="">Todos</option>
              <option value="true">Con opt-in</option>
              <option value="false">Sin opt-in</option>
            </select>
            <button onClick={() => fileRef.current?.click()}
              disabled={importing}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>
              <Upload size={14}/> {importing ? 'Importando...' : 'Importar CSV'}
            </button>
            <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={handleImport} />
          </div>
        </div>

        {/* Tabla */}
        <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Nombre','Teléfono','Ciudad','Opt-in','Mensajes','Segmento'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'#52525b', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #27272a' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:'#52525b' }}>Cargando...</td></tr>
              ) : contacts.length === 0 ? (
                <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:'#52525b' }}>Sin contactos. Importa tu CSV de 2.000 firmantes.</td></tr>
              ) : contacts.map((c: unknown) => {
                const contact = c as Record<string,unknown>
                return (
                  <tr key={contact.phone as string} style={{ cursor:'pointer' }}
                    onClick={() => window.location.href = `/contactos/${contact.phone}`}>
                    <td style={{ padding:'11px 16px', color:'#e4e4e7', fontSize:13, borderBottom:'1px solid #1a1a1d' }}>{(contact.name as string) || '—'}</td>
                    <td style={{ padding:'11px 16px', color:'#a1a1aa', fontSize:12, fontFamily:'monospace', borderBottom:'1px solid #1a1a1d' }}>{contact.phone as string}</td>
                    <td style={{ padding:'11px 16px', color:'#a1a1aa', fontSize:13, borderBottom:'1px solid #1a1a1d' }}>{(contact.city as string) || '—'}</td>
                    <td style={{ padding:'11px 16px', borderBottom:'1px solid #1a1a1d' }}>
                      {contact.opted_in
                        ? <CheckCircle size={16} style={{ color:'#22c55e' }}/>
                        : <XCircle    size={16} style={{ color:'#3f3f46' }}/>}
                    </td>
                    <td style={{ padding:'11px 16px', color:'#a1a1aa', fontSize:13, borderBottom:'1px solid #1a1a1d' }}>{contact.total_msgs as number}</td>
                    <td style={{ padding:'11px 16px', borderBottom:'1px solid #1a1a1d' }}>
                      <span style={{ background:'#1e293b', color:'#94a3b8', borderRadius:6, padding:'2px 8px', fontSize:11 }}>{contact.segment as string}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pages > 1 && (
          <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'center', marginTop:20 }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              style={{ padding:'6px 10px', background:'#18181b', border:'1px solid #27272a', borderRadius:7, color:'#a1a1aa', cursor:'pointer' }}>
              <ChevronLeft size={14}/>
            </button>
            <span style={{ color:'#a1a1aa', fontSize:13 }}>Página {page} de {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages}
              style={{ padding:'6px 10px', background:'#18181b', border:'1px solid #27272a', borderRadius:7, color:'#a1a1aa', cursor:'pointer' }}>
              <ChevronRight size={14}/>
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
