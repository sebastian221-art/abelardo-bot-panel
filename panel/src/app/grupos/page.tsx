'use client'
// 📄 panel/src/app/grupos/page.tsx  ← REEMPLAZA EL ANTERIOR
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { UsersRound, Plus, Trash2, UserPlus, X, Users, RefreshCw, Eye } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: '#09090b',
  border: '1px solid #27272a', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

const COLORES = ['#6366f1','#CE1126','#FCD116','#22c55e','#0ea5e9','#f59e0b','#a855f7','#ec4899']
const ICONOS  = ['👥','🦁','💪','🎯','🌟','🇨🇴','📢','🏆','👩','🤝','🏘️','⚡']

type Group = { id: number; name: string; description: string; color: string; icon: string; count: number }
type Member = { phone: string; name: string | null; city: string | null; opted_in: boolean }

export default function GruposPage() {
  const [groups,      setGroups]      = useState<Group[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showCreate,  setShowCreate]  = useState(false)
  const [showAddMem,  setShowAddMem]  = useState<number | null>(null)
  const [showMembers, setShowMembers] = useState<number | null>(null)
  const [members,     setMembers]     = useState<Member[]>([])
  const [loadingMem,  setLoadingMem]  = useState(false)
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [color,       setColor]       = useState('#6366f1')
  const [icon,        setIcon]        = useState('👥')
  const [phones,      setPhones]      = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')

  function getToken() { return localStorage.getItem('token') }

  async function loadGroups() {
    setLoading(true)
    try {
      const res  = await fetch(`${API}/groups/`, { headers: { Authorization: `Bearer ${getToken()}` } })
      const data = await res.json()
      setGroups(data as Group[])
    } catch { setError('Error cargando grupos') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadGroups() }, [])

  async function handleCreate() {
    setError(''); setSuccess('')
    if (!name.trim()) return setError('El nombre es obligatorio')
    setSaving(true)
    try {
      const res = await fetch(`${API}/groups/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ name, description, color, icon }),
      })
      if (res.status === 409) return setError('Ya existe un grupo con ese nombre')
      if (!res.ok)            return setError('Error al crear el grupo')
      setShowCreate(false)
      setName(''); setDescription(''); setColor('#6366f1'); setIcon('👥')
      loadGroups()
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number, groupName: string) {
    if (!confirm(`¿Eliminar el grupo "${groupName}"? Los contactos no se eliminan.`)) return
    await fetch(`${API}/groups/${id}`, { method:'DELETE', headers: { Authorization:`Bearer ${getToken()}` } })
    loadGroups()
  }

  async function handleAddMembers() {
    if (!phones.trim() || showAddMem === null) return
    setSaving(true); setError(''); setSuccess('')
    try {
      const phoneList = phones.split(/[\n,;]/).map(p => p.trim()).filter(Boolean)
      const res  = await fetch(`${API}/groups/${showAddMem}/members`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` },
        body:    JSON.stringify({ phones: phoneList }),
      })
      const data = await res.json() as { added: number; not_found: string[] }
      const notFoundMsg = data.not_found?.length
        ? ` (${data.not_found.length} no encontrados: ${data.not_found.slice(0,3).join(', ')}${data.not_found.length > 3 ? '...' : ''})`
        : ''
      setSuccess(`✅ ${data.added} contactos agregados${notFoundMsg}`)
      setPhones(''); setShowAddMem(null)
      loadGroups()
    } catch { setError('Error al agregar contactos') }
    finally { setSaving(false) }
  }

  async function handleViewMembers(id: number) {
    setShowMembers(id); setLoadingMem(true); setMembers([])
    try {
      const res  = await fetch(`${API}/groups/${id}/members`, { headers: { Authorization:`Bearer ${getToken()}` } })
      const data = await res.json()
      setMembers(data as Member[])
    } catch { /* noop */ }
    setLoadingMem(false)
  }

  async function handleRemoveMember(groupId: number, phone: string) {
    await fetch(`${API}/groups/${groupId}/members/${phone}`, {
      method:'DELETE', headers: { Authorization:`Bearer ${getToken()}` },
    })
    handleViewMembers(groupId)
    loadGroups()
  }

  const totalContacts = groups.reduce((a, g) => a + g.count, 0)

  return (
    <Layout>
      <div style={{ padding: 32, maxWidth: 1000 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <UsersRound size={22} style={{ color:'#6366f1' }}/>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>Grupos</h1>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={loadGroups}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:12, cursor:'pointer' }}>
              <RefreshCw size={13}/>
            </button>
            <button onClick={() => { setShowCreate(true); setError('') }}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:'none', background:'#6366f1', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              <Plus size={15}/> Nuevo grupo
            </button>
          </div>
        </div>
        <p style={{ color:'#71717a', fontSize:13, marginBottom:24 }}>
          Segmenta contactos en grupos para enviarles broadcasts específicos. Los grupos aparecen automáticamente en broadcasts y encuestas.
        </p>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'Grupos creados',       val: groups.length,  color:'#6366f1' },
            { label:'Contactos en grupos',  val: totalContacts,  color:'#22c55e' },
            { label:'Promedio por grupo',   val: groups.length ? Math.round(totalContacts/groups.length) : 0, color:'#FCD116' },
          ].map(s => (
            <div key={s.label} style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:12, padding:'14px 18px' }}>
              <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase', marginBottom:6 }}>{s.label}</p>
              <p style={{ color:s.color, fontSize:22, fontWeight:700 }}>{s.val}</p>
            </div>
          ))}
        </div>

        {success && <div style={{ background:'#0c1a0c', border:'1px solid #14532d', borderRadius:8, padding:'10px 14px', color:'#86efac', fontSize:13, marginBottom:16 }}>{success}</div>}

        {/* Lista */}
        {loading ? (
          <p style={{ color:'#52525b', textAlign:'center', padding:48 }}>Cargando...</p>
        ) : groups.length === 0 ? (
          <div style={{ textAlign:'center', padding:64, background:'#18181b', borderRadius:14, border:'1px solid #27272a' }}>
            <UsersRound size={40} style={{ color:'#27272a', margin:'0 auto 12px', display:'block' }}/>
            <p style={{ color:'#52525b', fontSize:14 }}>Sin grupos. Crea el primero.</p>
            <p style={{ color:'#3f3f46', fontSize:12, marginTop:6 }}>Ej: Defensoras, Jóvenes, Líderes, San Gil norte...</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
            {groups.map(g => (
              <div key={g.id} style={{ background:'#18181b', border:`1px solid ${g.color}33`, borderRadius:14, padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:42, height:42, borderRadius:10, background:g.color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                      {g.icon}
                    </div>
                    <div>
                      <p style={{ color:'#fff', fontWeight:700, fontSize:14 }}>{g.name}</p>
                      <p style={{ color:'#52525b', fontSize:11 }}>{g.description || 'Sin descripción'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(g.id, g.name)}
                    style={{ background:'transparent', border:'none', color:'#52525b', cursor:'pointer', padding:4 }}>
                    <Trash2 size={14}/>
                  </button>
                </div>

                {/* Barra de contactos */}
                <div style={{ background:g.color+'22', borderRadius:8, padding:'8px 12px', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <Users size={14} style={{ color:g.color }}/>
                      <span style={{ color:g.color, fontSize:16, fontWeight:700 }}>{g.count}</span>
                      <span style={{ color:'#71717a', fontSize:12 }}>contactos</span>
                    </div>
                    <button onClick={() => handleViewMembers(g.id)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:6, border:`1px solid ${g.color}44`, background:'transparent', color:g.color, fontSize:11, cursor:'pointer' }}>
                      <Eye size={11}/> Ver
                    </button>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => { setShowAddMem(g.id); setPhones(''); setError(''); setSuccess('') }}
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px', borderRadius:8, border:`1px solid ${g.color}44`, background:g.color+'11', color:g.color, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    <UserPlus size={13}/> Agregar contactos
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Modal crear grupo ── */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:16, padding:28, width:460, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <h2 style={{ color:'#fff', fontSize:16, fontWeight:700 }}>Crear grupo</h2>
              <button onClick={() => setShowCreate(false)} style={{ background:'transparent', border:'none', color:'#71717a', cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>Nombre *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="ej: Defensoras, Jóvenes, Líderes..." style={inputSt}/>
              </div>
              <div>
                <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>Descripción</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="ej: Mujeres líderes del sur de Santander" style={inputSt}/>
              </div>
              <div>
                <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:8, textTransform:'uppercase' }}>Icono</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {ICONOS.map(i => (
                    <button key={i} onClick={() => setIcon(i)}
                      style={{ width:36, height:36, borderRadius:8, border:`2px solid ${icon===i ? color : '#27272a'}`, background:icon===i ? color+'22' : 'transparent', fontSize:18, cursor:'pointer' }}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:8, textTransform:'uppercase' }}>Color</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {COLORES.map(c => (
                    <button key={c} onClick={() => setColor(c)}
                      style={{ width:30, height:30, borderRadius:'50%', background:c, border:`3px solid ${color===c ? '#fff' : 'transparent'}`, cursor:'pointer' }}/>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:color+'11', borderRadius:10, border:`1px solid ${color}33` }}>
                <div style={{ width:36, height:36, borderRadius:8, background:color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{icon}</div>
                <div>
                  <p style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{name || 'Nombre del grupo'}</p>
                  <p style={{ color:'#52525b', fontSize:11 }}>{description || 'Descripción'}</p>
                </div>
              </div>

              {error && <p style={{ color:'#fca5a5', fontSize:12, background:'#3f1212', padding:'8px 12px', borderRadius:7 }}>{error}</p>}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowCreate(false)}
                  style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleCreate} disabled={saving}
                  style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background:color, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  {saving ? 'Creando...' : `${icon} Crear grupo`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal agregar miembros ── */}
      {showAddMem !== null && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:16, padding:28, width:460, maxWidth:'95vw' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <h2 style={{ color:'#fff', fontSize:16, fontWeight:700 }}>Agregar contactos al grupo</h2>
              <button onClick={() => setShowAddMem(null)} style={{ background:'transparent', border:'none', color:'#71717a', cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>
                  Números de teléfono (uno por línea, coma o punto y coma)
                </label>
                <textarea value={phones} onChange={e => setPhones(e.target.value)}
                  placeholder={'3001234567\n3009876543\n3151234567'}
                  rows={6}
                  style={{ ...inputSt, resize:'vertical', fontFamily:'monospace', lineHeight:1.6 }}/>
                <p style={{ color:'#52525b', fontSize:11, marginTop:4 }}>
                  Sin +57 — el sistema lo agrega automáticamente. Si el contacto no existe en la BD, se omite.
                </p>
              </div>
              {error && <p style={{ color:'#fca5a5', fontSize:12, background:'#3f1212', padding:'8px 12px', borderRadius:7 }}>{error}</p>}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowAddMem(null)}
                  style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleAddMembers} disabled={saving}
                  style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background:'#6366f1', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  {saving ? 'Agregando...' : '✅ Agregar al grupo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ver miembros ── */}
      {showMembers !== null && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:16, padding:28, width:520, maxWidth:'95vw', maxHeight:'85vh', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ color:'#fff', fontSize:16, fontWeight:700 }}>
                Miembros del grupo ({members.length})
              </h2>
              <button onClick={() => setShowMembers(null)} style={{ background:'transparent', border:'none', color:'#71717a', cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ overflowY:'auto', flex:1 }}>
              {loadingMem ? (
                <p style={{ color:'#52525b', textAlign:'center', padding:24 }}>Cargando...</p>
              ) : members.length === 0 ? (
                <p style={{ color:'#52525b', textAlign:'center', padding:24 }}>Sin miembros aún</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {members.map(m => (
                    <div key={m.phone} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'#09090b', borderRadius:8 }}>
                      <div>
                        <p style={{ color:'#e4e4e7', fontSize:13, fontWeight: m.name ? 600 : 400 }}>
                          {m.name || <span style={{ color:'#52525b' }}>Sin nombre</span>}
                        </p>
                        <p style={{ color:'#52525b', fontSize:11, fontFamily:'monospace' }}>{m.phone}</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {m.city && <span style={{ color:'#3f3f46', fontSize:11 }}>{m.city}</span>}
                        <span style={{ color: m.opted_in ? '#22c55e' : '#3f3f46', fontSize:11 }}>
                          {m.opted_in ? '✅' : '○'}
                        </span>
                        <button onClick={() => handleRemoveMember(showMembers, m.phone)}
                          style={{ background:'transparent', border:'none', color:'#f87171', cursor:'pointer', fontSize:11, padding:'2px 6px', borderRadius:5 }}>
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </Layout>
  )
}