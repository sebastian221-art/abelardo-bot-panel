'use client'
// 📄 panel/src/app/contactos/page.tsx  ← REEMPLAZA EL ANTERIOR
import { useEffect, useState, useRef } from 'react'
import Layout from '@/components/Layout'
import { getContacts, importContacts } from '@/lib/api'
import { Search, Upload, ChevronLeft, ChevronRight, CheckCircle, XCircle, UserPlus, X } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const inputSt: React.CSSProperties = {
  width:'100%', padding:'10px 12px', background:'#09090b',
  border:'1px solid #27272a', borderRadius:8, color:'#fff',
  fontSize:13, outline:'none', boxSizing:'border-box',
}
const labelSt: React.CSSProperties = {
  display:'block', color:'#a1a1aa', fontSize:11,
  fontWeight:600, marginBottom:6, textTransform:'uppercase',
}

export default function ContactosPage() {
  const [data,      setData]      = useState<Record<string,unknown>>({ total:0, contacts:[] })
  const [page,      setPage]      = useState(1)
  const [optedIn,   setOptedIn]   = useState('')
  const [loading,   setLoading]   = useState(true)
  const [importing, setImporting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState('')

  // Formulario contacto manual
  const [phone,      setPhone]      = useState('')
  const [name,       setName]       = useState('')
  const [city,       setCity]       = useState('')
  const [department, setDepartment] = useState('')
  const [optedInNew, setOptedInNew] = useState(false)

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
    alert(`✅ Importados: ${(r as Record<string,number>).created} nuevos, ${(r as Record<string,number>).updated} actualizados`)
    setImporting(false)
    load()
  }

  function resetForm() {
    setPhone(''); setName(''); setCity(''); setDepartment(''); setOptedInNew(false); setFormError('')
  }

  async function handleAddContact() {
    setFormError('')
    if (!phone.trim()) return setFormError('El teléfono es obligatorio')

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/contacts`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ phone, name, city, department, opted_in: optedInNew }),
      })
      if (res.status === 409) return setFormError('Este número ya existe en los contactos')
      if (!res.ok) return setFormError('Error al crear el contacto')
      setShowModal(false)
      resetForm()
      load()
    } catch {
      setFormError('Error de conexión')
    } finally {
      setSaving(false)
    }
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

            {/* Agregar contacto manual */}
            <button onClick={() => { resetForm(); setShowModal(true) }}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:8, border:'none', background:'#FCD116', color:'#09090b', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              <UserPlus size={14}/> Agregar contacto
            </button>

            {/* Importar CSV */}
            <button onClick={() => fileRef.current?.click()} disabled={importing}
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
                <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:'#52525b' }}>Sin contactos. Importa tu CSV o agrega uno manualmente.</td></tr>
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

      {/* Modal agregar contacto */}
      {showModal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
        }}>
          <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:16, padding:28, width:420, maxWidth:'95vw' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <h2 style={{ color:'#fff', fontSize:16, fontWeight:700 }}>Agregar contacto</h2>
              <button onClick={() => setShowModal(false)}
                style={{ background:'transparent', border:'none', color:'#71717a', cursor:'pointer' }}>
                <X size={18}/>
              </button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={labelSt}>Teléfono * <span style={{ color:'#52525b', fontWeight:400, textTransform:'none' }}>(sin +57)</span></label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="3001234567" style={inputSt}/>
              </div>
              <div>
                <label style={labelSt}>Nombre</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Juan Pérez" style={inputSt}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={labelSt}>Ciudad</label>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    placeholder="San Gil" style={inputSt}/>
                </div>
                <div>
                  <label style={labelSt}>Departamento</label>
                  <input value={department} onChange={e => setDepartment(e.target.value)}
                    placeholder="Santander" style={inputSt}/>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <input type="checkbox" id="optin" checked={optedInNew}
                  onChange={e => setOptedInNew(e.target.checked)}
                  style={{ width:16, height:16, cursor:'pointer' }}/>
                <label htmlFor="optin" style={{ color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>
                  Ya tiene opt-in (aceptó recibir mensajes)
                </label>
              </div>

              {formError && (
                <p style={{ color:'#fca5a5', fontSize:12, background:'#3f1212', padding:'8px 12px', borderRadius:7 }}>
                  {formError}
                </p>
              )}

              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button onClick={() => setShowModal(false)}
                  style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleAddContact} disabled={saving}
                  style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background:'#FCD116', color:'#09090b', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  {saving ? 'Guardando...' : '✅ Agregar contacto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}