'use client'
// 📄 panel/src/app/contactos/page.tsx  ← REEMPLAZA EL ANTERIOR
import { useEffect, useState, useRef, useCallback } from 'react'
import Layout from '@/components/Layout'
import { getContacts, importContacts, getGroups, exportContacts } from '@/lib/api'
import {
  Upload, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  UserPlus, X, Search, Download, Filter, Users
} from 'lucide-react'

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

type Group = { id: number; name: string; color: string; icon: string; count: number }
type ImportResult = {
  created: number; updated: number; errors: number; skipped: number
  details: { phone: string; status: string; reason?: string }[]
}

export default function ContactosPage() {
  const [data,       setData]       = useState<Record<string,unknown>>({ total:0, contacts:[] })
  const [page,       setPage]       = useState(1)
  const [search,     setSearch]     = useState('')
  const [optedIn,    setOptedIn]    = useState('')
  const [groupFilter,setGroupFilter]= useState('')
  const [loading,    setLoading]    = useState(true)
  const [importing,  setImporting]  = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [formError,  setFormError]  = useState('')
  const [groups,     setGroups]     = useState<Group[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [exporting,  setExporting]  = useState(false)

  // Formulario contacto manual
  const [phone,       setPhone]       = useState('')
  const [name,        setName]        = useState('')
  const [city,        setCity]        = useState('')
  const [department,  setDepartment]  = useState('')
  const [optedInNew,  setOptedInNew]  = useState(false)
  const [selectedGroup, setSelectedGroup] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const filters: Record<string,string> = {}
    if (optedIn)     filters.opted_in = optedIn
    if (groupFilter) filters.group    = groupFilter
    if (search)      filters.search   = search
    const d = await getContacts(page, filters)
    setData(d as Record<string,unknown>)
    setLoading(false)
  }, [page, optedIn, groupFilter, search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    getGroups().then(g => setGroups(g as Group[])).catch(() => {})
  }, [])

  // Búsqueda con debounce
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 400)
    return () => clearTimeout(t)
  }, [search])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    setShowImport(true)
    const r = await importContacts(file)
    setImportResult(r as ImportResult)
    setImporting(false)
    load()
  }

  async function handleExport() {
    setExporting(true)
    const filters: Record<string,string> = {}
    if (optedIn)     filters.opted_in = optedIn
    if (groupFilter) filters.group    = groupFilter
    if (search)      filters.search   = search
    const blob = await exportContacts(filters)
    const url  = URL.createObjectURL(blob as Blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `contactos_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  function resetForm() {
    setPhone(''); setName(''); setCity(''); setDepartment('')
    setOptedInNew(false); setSelectedGroup(''); setFormError('')
  }

  async function handleAddContact() {
    setFormError('')
    if (!phone.trim()) return setFormError('El teléfono es obligatorio')
    const cleanPhone = phone.replace(/\s|-/g, '')
    if (!/^3\d{9}$/.test(cleanPhone) && !/^57\d{10}$/.test(cleanPhone))
      return setFormError('Número inválido. Ej: 3001234567')

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/contacts`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ phone: cleanPhone, name, city, department, opted_in: optedInNew }),
      })
      if (res.status === 409) return setFormError('⚠️ Este número ya existe en los contactos')
      if (!res.ok)            return setFormError('Error al crear el contacto')

      // Si eligió grupo, agregar al grupo
      if (selectedGroup) {
        await fetch(`${API}/groups/${selectedGroup}/members`, {
          method:  'POST',
          headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
          body:    JSON.stringify({ phones: [cleanPhone] }),
        })
      }
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
      <div style={{ padding:32, maxWidth:1200 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>Contactos</h1>
            <p style={{ color:'#71717a', fontSize:13 }}>{total.toLocaleString()} contactos totales</p>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={handleExport} disabled={exporting}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>
              <Download size={14}/> {exporting ? 'Exportando...' : 'Exportar CSV'}
            </button>
            <button onClick={() => { resetForm(); setShowModal(true) }}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:8, border:'none', background:'#FCD116', color:'#09090b', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              <UserPlus size={14}/> Agregar contacto
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={importing}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>
              <Upload size={14}/> {importing ? 'Procesando...' : 'Importar CSV'}
            </button>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={handleImport}/>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          {/* Búsqueda */}
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#52525b' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              style={{ ...inputSt, paddingLeft:32 }}/>
          </div>

          {/* Opt-in */}
          <select value={optedIn} onChange={e => { setOptedIn(e.target.value); setPage(1) }}
            style={{ padding:'10px 12px', background:'#09090b', border:'1px solid #27272a', borderRadius:8, color: optedIn ? '#fff' : '#52525b', fontSize:13, cursor:'pointer' }}>
            <option value="">Todos los opt-in</option>
            <option value="true">✅ Con opt-in</option>
            <option value="false">❌ Sin opt-in</option>
          </select>

          {/* Grupos dinámicos */}
          <select value={groupFilter} onChange={e => { setGroupFilter(e.target.value); setPage(1) }}
            style={{ padding:'10px 12px', background:'#09090b', border:'1px solid #27272a', borderRadius:8, color: groupFilter ? '#fff' : '#52525b', fontSize:13, cursor:'pointer' }}>
            <option value="">Todos los grupos</option>
            {groups.map(g => (
              <option key={g.id} value={String(g.id)}>{g.icon} {g.name} ({g.count})</option>
            ))}
          </select>

          {/* Limpiar filtros */}
          {(optedIn || groupFilter || search) && (
            <button onClick={() => { setOptedIn(''); setGroupFilter(''); setSearch(''); setPage(1) }}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#f87171', fontSize:12, cursor:'pointer' }}>
              <X size={12}/> Limpiar
            </button>
          )}
        </div>

        {/* Tabla */}
        <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Nombre','Teléfono','Ciudad','Grupos','Opt-in','Mensajes','Segmento'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'#52525b', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #27272a' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:'#52525b' }}>Cargando...</td></tr>
              ) : contacts.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:'#52525b' }}>
                  {search || optedIn || groupFilter ? 'Sin resultados para estos filtros' : 'Sin contactos. Importa tu CSV o agrega uno manualmente.'}
                </td></tr>
              ) : contacts.map((c: unknown) => {
                const contact = c as Record<string,unknown>
                const contactGroups = (contact.groups as {name:string;color:string;icon:string}[]) || []
                return (
                  <tr key={contact.phone as string}
                    onClick={() => window.location.href = `/contactos/${contact.phone}`}
                    style={{ cursor:'pointer', transition:'background .1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1f1f23')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding:'11px 16px', color:'#e4e4e7', fontSize:13, borderBottom:'1px solid #1a1a1d' }}>
                      {(contact.name as string) || <span style={{ color:'#52525b' }}>—</span>}
                    </td>
                    <td style={{ padding:'11px 16px', color:'#a1a1aa', fontSize:12, fontFamily:'monospace', borderBottom:'1px solid #1a1a1d' }}>
                      {contact.phone as string}
                    </td>
                    <td style={{ padding:'11px 16px', color:'#a1a1aa', fontSize:13, borderBottom:'1px solid #1a1a1d' }}>
                      {(contact.city as string) || <span style={{ color:'#52525b' }}>—</span>}
                    </td>
                    <td style={{ padding:'11px 16px', borderBottom:'1px solid #1a1a1d' }}>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {contactGroups.length > 0
                          ? contactGroups.slice(0,2).map(g => (
                              <span key={g.name} style={{ background: g.color + '22', color: g.color, border:`1px solid ${g.color}44`, borderRadius:5, padding:'1px 6px', fontSize:10, fontWeight:600 }}>
                                {g.icon} {g.name}
                              </span>
                            ))
                          : <span style={{ color:'#3f3f46', fontSize:11 }}>—</span>
                        }
                        {contactGroups.length > 2 && (
                          <span style={{ color:'#52525b', fontSize:10 }}>+{contactGroups.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding:'11px 16px', borderBottom:'1px solid #1a1a1d' }}>
                      {contact.opted_in
                        ? <CheckCircle size={16} style={{ color:'#22c55e' }}/>
                        : <XCircle    size={16} style={{ color:'#3f3f46' }}/>}
                    </td>
                    <td style={{ padding:'11px 16px', color:'#a1a1aa', fontSize:13, borderBottom:'1px solid #1a1a1d' }}>
                      {contact.total_msgs as number}
                    </td>
                    <td style={{ padding:'11px 16px', borderBottom:'1px solid #1a1a1d' }}>
                      <span style={{ background:'#1e293b', color:'#94a3b8', borderRadius:6, padding:'2px 8px', fontSize:11 }}>
                        {contact.segment as string}
                      </span>
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
            <span style={{ color:'#a1a1aa', fontSize:13 }}>Página {page} de {pages} · {total.toLocaleString()} total</span>
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages}
              style={{ padding:'6px 10px', background:'#18181b', border:'1px solid #27272a', borderRadius:7, color:'#a1a1aa', cursor:'pointer' }}>
              <ChevronRight size={14}/>
            </button>
          </div>
        )}
      </div>

      {/* ── Modal agregar contacto ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:16, padding:28, width:460, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <h2 style={{ color:'#fff', fontSize:16, fontWeight:700 }}>Agregar contacto</h2>
              <button onClick={() => setShowModal(false)} style={{ background:'transparent', border:'none', color:'#71717a', cursor:'pointer' }}>
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
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="San Gil" style={inputSt}/>
                </div>
                <div>
                  <label style={labelSt}>Departamento</label>
                  <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="Santander" style={inputSt}/>
                </div>
              </div>

              {/* Asignar a grupo */}
              {groups.length > 0 && (
                <div>
                  <label style={labelSt}>Agregar a grupo (opcional)</label>
                  <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
                    style={{ ...inputSt, cursor:'pointer' }}>
                    <option value="">Sin grupo</option>
                    {groups.map(g => (
                      <option key={g.id} value={String(g.id)}>{g.icon} {g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <input type="checkbox" id="optin" checked={optedInNew}
                  onChange={e => setOptedInNew(e.target.checked)}
                  style={{ width:16, height:16, cursor:'pointer' }}/>
                <label htmlFor="optin" style={{ color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>
                  Ya tiene opt-in
                </label>
              </div>

              {formError && (
                <p style={{ color:'#fca5a5', fontSize:12, background:'#3f1212', padding:'8px 12px', borderRadius:7 }}>{formError}</p>
              )}

              <div style={{ display:'flex', gap:10 }}>
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

      {/* ── Modal resultado importación ── */}
      {showImport && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:16, padding:28, width:500, maxWidth:'95vw', maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ color:'#fff', fontSize:16, fontWeight:700 }}>Resultado de importación</h2>
              <button onClick={() => setShowImport(false)} style={{ background:'transparent', border:'none', color:'#71717a', cursor:'pointer' }}>
                <X size={18}/>
              </button>
            </div>

            {importing ? (
              <div style={{ textAlign:'center', padding:32 }}>
                <div style={{ color:'#FCD116', fontSize:32, marginBottom:12 }}>⏳</div>
                <p style={{ color:'#a1a1aa' }}>Procesando archivo...</p>
                <p style={{ color:'#52525b', fontSize:12, marginTop:6 }}>Limpiando datos y detectando duplicados</p>
              </div>
            ) : importResult && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {/* Stats */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                  {[
                    { label:'✅ Creados',    val: importResult.created,  color:'#22c55e' },
                    { label:'🔄 Actualizados',val: importResult.updated, color:'#0ea5e9' },
                    { label:'⚠️ Omitidos',   val: importResult.skipped,  color:'#f59e0b' },
                    { label:'❌ Errores',    val: importResult.errors,   color:'#ef4444' },
                  ].map(s => (
                    <div key={s.label} style={{ background:'#09090b', borderRadius:10, padding:'12px 10px', textAlign:'center' }}>
                      <p style={{ color: s.color, fontSize:22, fontWeight:700 }}>{s.val}</p>
                      <p style={{ color:'#52525b', fontSize:10, marginTop:3 }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Detalle de problemas */}
                {importResult.details?.filter(d => d.status !== 'created').length > 0 && (
                  <div>
                    <p style={{ color:'#a1a1aa', fontSize:12, fontWeight:600, marginBottom:8 }}>Detalle de omitidos/errores:</p>
                    <div style={{ maxHeight:200, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
                      {importResult.details.filter(d => d.status !== 'created').map((d, i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', background:'#09090b', borderRadius:6, fontSize:12 }}>
                          <span style={{ color:'#a1a1aa', fontFamily:'monospace' }}>{d.phone}</span>
                          <span style={{ color: d.status === 'duplicate' ? '#f59e0b' : '#ef4444' }}>
                            {d.status === 'duplicate' ? '⚠️ Duplicado' : `❌ ${d.reason}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => setShowImport(false)}
                  style={{ padding:'10px', borderRadius:8, border:'none', background:'#22c55e', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  ✅ Listo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}