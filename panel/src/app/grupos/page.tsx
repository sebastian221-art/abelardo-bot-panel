'use client'
// 📄 panel/src/app/grupos/page.tsx  ← ARCHIVO NUEVO
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { UsersRound, Plus, Trash2, UserPlus, X, Users } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: '#09090b',
  border: '1px solid #27272a', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

const COLORES = [
  '#6366f1', '#CE1126', '#FCD116', '#22c55e',
  '#0ea5e9', '#f59e0b', '#a855f7', '#ec4899',
]

const ICONOS = ['👥', '🦁', '💪', '🎯', '🌟', '🇨🇴', '📢', '🏆']

type Group = {
  id: number
  name: string
  description: string
  color: string
  icon: string
  count: number
}

export default function GruposPage() {
  const [groups,      setGroups]      = useState<Group[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showCreate,  setShowCreate]  = useState(false)
  const [showAddMem,  setShowAddMem]  = useState<number | null>(null)
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
      const res  = await fetch(`${API}/groups/`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body:    JSON.stringify({ name, description, color, icon }),
      })
      if (res.status === 409) return setError('Ya existe un grupo con ese nombre')
      if (!res.ok) return setError('Error al crear el grupo')
      setShowCreate(false)
      setName(''); setDescription(''); setColor('#6366f1'); setIcon('👥')
      loadGroups()
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number, groupName: string) {
    if (!confirm(`¿Eliminar el grupo "${groupName}"?`)) return
    await fetch(`${API}/groups/${id}`, {
      method:  'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` },
    })
    loadGroups()
  }

  async function handleAddMembers() {
    if (!phones.trim() || showAddMem === null) return
    setSaving(true)
    setError(''); setSuccess('')
    try {
      const phoneList = phones.split(/[\n,;]/).map(p => p.trim()).filter(Boolean)
      const res = await fetch(`${API}/groups/${showAddMem}/members`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body:    JSON.stringify({ phones: phoneList }),
      })
      const data = await res.json() as { added: number; not_found: string[] }
      setSuccess(`✅ ${data.added} contactos agregados al grupo`)
      setPhones('')
      setShowAddMem(null)
      loadGroups()
    } catch { setError('Error al agregar contactos') }
    finally { setSaving(false) }
  }

  return (
    <Layout>
      <div style={{ padding: 32, maxWidth: 900 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <UsersRound size={22} style={{ color: '#6366f1' }} />
              <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Grupos</h1>
            </div>
            <p style={{ color: '#71717a', fontSize: 13 }}>
              Crea segmentos personalizados como "Defensoras", "Jóvenes", "Líderes" y envíales broadcasts específicos
            </p>
          </div>
          <button onClick={() => { setShowCreate(true); setError('') }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={15} /> Nuevo grupo
          </button>
        </div>

        {/* Lista de grupos */}
        {loading ? (
          <p style={{ color: '#52525b', textAlign: 'center', padding: 48 }}>Cargando...</p>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64, background: '#18181b', borderRadius: 14, border: '1px solid #27272a' }}>
            <UsersRound size={40} style={{ color: '#27272a', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: '#52525b', fontSize: 14 }}>Sin grupos. Crea el primero.</p>
            <p style={{ color: '#3f3f46', fontSize: 12, marginTop: 6 }}>
              Ej: Defensoras, Jóvenes, Líderes comunitarios, San Gil norte...
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {groups.map(g => (
              <div key={g.id} style={{ background: '#18181b', border: `1px solid ${g.color}33`, borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: g.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {g.icon}
                    </div>
                    <div>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{g.name}</p>
                      <p style={{ color: '#52525b', fontSize: 11 }}>{g.description || 'Sin descripción'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(g.id, g.name)}
                    style={{ background: 'transparent', border: 'none', color: '#52525b', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={13} style={{ color: g.color }} />
                    <span style={{ color: g.color, fontSize: 13, fontWeight: 700 }}>{g.count}</span>
                    <span style={{ color: '#52525b', fontSize: 12 }}>contactos</span>
                  </div>
                  <button onClick={() => { setShowAddMem(g.id); setPhones(''); setError(''); setSuccess('') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: `1px solid ${g.color}44`, background: g.color + '11', color: g.color, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    <UserPlus size={12} /> Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {success && <div style={{ background: '#0c1a0c', border: '1px solid #14532d', borderRadius: 8, padding: '10px 14px', color: '#86efac', fontSize: 13, marginTop: 16 }}>{success}</div>}

        {/* ── Modal crear grupo ── */}
        {showCreate && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 16, padding: 28, width: 440, maxWidth: '95vw' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Crear grupo</h2>
                <button onClick={() => setShowCreate(false)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Nombre *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="ej: Defensoras, Jóvenes, Líderes..." style={inputSt} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Descripción</label>
                  <input value={description} onChange={e => setDescription(e.target.value)} placeholder="ej: Mujeres líderes del sur de Santander" style={inputSt} />
                </div>

                {/* Icono */}
                <div>
                  <label style={{ display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Icono</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ICONOS.map(i => (
                      <button key={i} onClick={() => setIcon(i)}
                        style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${icon === i ? color : '#27272a'}`, background: icon === i ? color + '22' : 'transparent', fontSize: 18, cursor: 'pointer' }}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label style={{ display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Color</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {COLORES.map(c => (
                      <button key={c} onClick={() => setColor(c)}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `3px solid ${color === c ? '#fff' : 'transparent'}`, cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>

                {error && <p style={{ color: '#fca5a5', fontSize: 12, background: '#3f1212', padding: '8px 12px', borderRadius: 7 }}>{error}</p>}

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={() => setShowCreate(false)}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa', fontSize: 13, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={handleCreate} disabled={saving}
                    style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {saving ? 'Creando...' : `${icon} Crear grupo`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal agregar miembros ── */}
        {showAddMem !== null && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 16, padding: 28, width: 440, maxWidth: '95vw' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Agregar contactos al grupo</h2>
                <button onClick={() => setShowAddMem(null)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>
                    Números de teléfono (uno por línea o separados por coma)
                  </label>
                  <textarea value={phones} onChange={e => setPhones(e.target.value)}
                    placeholder={'3001234567\n3009876543\n3151234567'}
                    rows={5}
                    style={{ ...inputSt, resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6 }} />
                  <p style={{ color: '#52525b', fontSize: 11, marginTop: 4 }}>Sin +57 — el sistema lo agrega automáticamente</p>
                </div>

                {error && <p style={{ color: '#fca5a5', fontSize: 12, background: '#3f1212', padding: '8px 12px', borderRadius: 7 }}>{error}</p>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowAddMem(null)}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa', fontSize: 13, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={handleAddMembers} disabled={saving}
                    style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {saving ? 'Agregando...' : '✅ Agregar al grupo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}