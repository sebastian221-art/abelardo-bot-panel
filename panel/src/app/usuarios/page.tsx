'use client'
// 📄 panel/src/app/usuarios/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/api'
import { UserPlus, Pencil, Trash2, X, Check, ArrowLeft, RefreshCw, Eye, EyeOff } from 'lucide-react'

const ROLES = [
  { value:'admin',  label:'Admin',  desc:'Acceso total' },
  { value:'editor', label:'Editor', desc:'Puede crear y enviar' },
  { value:'viewer', label:'Viewer', desc:'Solo lectura' },
]
const ROLE_COLORS: Record<string,string> = { admin:'#6366f1', editor:'#0ea5e9', viewer:'#71717a' }
const BLANK = { username:'', full_name:'', password:'', role:'viewer', is_active:true }

const inputSt: React.CSSProperties = {
  width:'100%', padding:'9px 12px', background:'#09090b',
  border:'1px solid #27272a', borderRadius:8, color:'#fff',
  fontSize:13, outline:'none', boxSizing:'border-box',
}

export default function UsuariosPage() {
  const router   = useRouter()
  const [users,   setUsers]   = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState<'create'|'edit'|null>(null)
  const [editing, setEditing] = useState<Record<string,unknown>|null>(null)
  const [form,    setForm]    = useState<Record<string,unknown>>(BLANK)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [deleting,setDeleting]= useState<Record<string,unknown>|null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const d = await getUsers().catch(() => [])
    setUsers(d as unknown[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function openCreate() { setForm(BLANK); setError(''); setShowPw(false); setEditing(null); setModal('create') }
  function openEdit(u: Record<string,unknown>) {
    setForm({ username:u.username, full_name:u.full_name||'', password:'', role:u.role, is_active:u.is_active })
    setError(''); setShowPw(false); setEditing(u); setModal('edit')
  }

  async function handleSave() {
    setError('')
    if (!form.username) return setError('Usuario obligatorio')
    if (modal === 'create' && !form.password) return setError('Contraseña obligatoria')
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (modal === 'create') await createUser(payload)
      else if (editing) await updateUser(editing.id as number, payload)
      setModal(null); fetchUsers()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleting) return
    await deleteUser(deleting.id as number).catch(console.error)
    setDeleting(null); fetchUsers()
  }

  const overlay: React.CSSProperties = {
    position:'fixed', inset:0, background:'#000000aa', backdropFilter:'blur(4px)',
    display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24,
  }

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:860 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button onClick={() => router.back()}
              style={{ padding:'6px 10px', background:'#18181b', border:'1px solid #27272a', borderRadius:7, color:'#71717a', cursor:'pointer', display:'flex' }}>
              <ArrowLeft size={16}/>
            </button>
            <div>
              <h1 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>Usuarios del panel</h1>
              <p style={{ color:'#71717a', fontSize:13 }}>Gestiona quién accede al panel</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={fetchUsers}
              style={{ padding:'8px 12px', background:'transparent', border:'1px solid #27272a', borderRadius:8, color:'#71717a', cursor:'pointer', display:'flex' }}>
              <RefreshCw size={14}/>
            </button>
            <button onClick={openCreate}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:9, border:'none', background:'#6366f1', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              <UserPlus size={15}/> Nuevo usuario
            </button>
          </div>
        </div>

        <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, overflow:'hidden' }}>
          {loading ? (
            <p style={{ padding:48, textAlign:'center', color:'#52525b' }}>Cargando...</p>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                {['Usuario','Nombre','Rol','Estado',''].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'#52525b', textTransform:'uppercase', borderBottom:'1px solid #27272a' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {users.map((u: unknown) => {
                  const user = u as Record<string,unknown>
                  const c    = ROLE_COLORS[user.role as string] || '#71717a'
                  return (
                    <tr key={user.id as number}>
                      <td style={{ padding:'11px 16px', color:'#e4e4e7', fontSize:13, fontWeight:500, borderBottom:'1px solid #1a1a1d' }}>{user.username as string}</td>
                      <td style={{ padding:'11px 16px', color:'#a1a1aa', fontSize:13, borderBottom:'1px solid #1a1a1d' }}>{(user.full_name as string)||'—'}</td>
                      <td style={{ padding:'11px 16px', borderBottom:'1px solid #1a1a1d' }}>
                        <span style={{ background:c+'22', color:c, border:`1px solid ${c}44`, borderRadius:6, padding:'2px 9px', fontSize:11, fontWeight:600 }}>
                          {user.role as string}
                        </span>
                      </td>
                      <td style={{ padding:'11px 16px', borderBottom:'1px solid #1a1a1d' }}>
                        <span style={{ color: user.is_active ? '#22c55e':'#52525b', fontSize:12 }}>{user.is_active ? 'Activo':'Inactivo'}</span>
                      </td>
                      <td style={{ padding:'11px 16px', borderBottom:'1px solid #1a1a1d', textAlign:'right' }}>
                        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                          <button onClick={() => openEdit(user)}
                            style={{ padding:'5px 8px', background:'transparent', border:'1px solid #27272a', borderRadius:6, color:'#71717a', cursor:'pointer', display:'flex' }}>
                            <Pencil size={12}/>
                          </button>
                          <button onClick={() => setDeleting(user)}
                            style={{ padding:'5px 8px', background:'transparent', border:'1px solid #27272a', borderRadius:6, color:'#f87171', cursor:'pointer', display:'flex' }}>
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal crear/editar */}
        {modal && (
          <div style={overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:16, padding:28, width:'100%', maxWidth:460 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
                <h3 style={{ color:'#fff', fontSize:16, fontWeight:700 }}>{modal==='create'?'Nuevo usuario':`Editar · ${editing?.username}`}</h3>
                <button onClick={() => setModal(null)} style={{ background:'none', border:'none', color:'#71717a', cursor:'pointer', display:'flex' }}><X size={16}/></button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>Usuario *</label>
                    <input value={form.username as string} onChange={e => setForm(f => ({...f,username:e.target.value}))} disabled={modal==='edit'} style={{ ...inputSt, opacity:modal==='edit'?0.5:1 }}/>
                  </div>
                  <div>
                    <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>Nombre</label>
                    <input value={form.full_name as string} onChange={e => setForm(f => ({...f,full_name:e.target.value}))} style={inputSt}/>
                  </div>
                </div>
                <div>
                  <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>
                    {modal==='edit'?'Nueva contraseña (vacío = no cambiar)':'Contraseña *'}
                  </label>
                  <div style={{ position:'relative' }}>
                    <input type={showPw?'text':'password'} value={form.password as string} onChange={e => setForm(f => ({...f,password:e.target.value}))} placeholder="••••••••" style={{ ...inputSt, paddingRight:38 }}/>
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#71717a', cursor:'pointer', display:'flex' }}>
                      {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:8, textTransform:'uppercase' }}>Rol</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {ROLES.map(r => (
                      <button key={r.value} type="button" onClick={() => setForm(f => ({...f,role:r.value}))}
                        style={{ flex:1, padding:'8px', borderRadius:8, cursor:'pointer', border:`1px solid ${form.role===r.value?ROLE_COLORS[r.value]:'#27272a'}`, background:form.role===r.value?ROLE_COLORS[r.value]+'22':'transparent', color:form.role===r.value?ROLE_COLORS[r.value]:'#71717a' }}>
                        <div style={{ fontWeight:600, fontSize:12 }}>{r.label}</div>
                        <div style={{ fontSize:9, opacity:0.7 }}>{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {error && <div style={{ background:'#3f1212', border:'1px solid #7f1d1d', borderRadius:8, padding:'10px 14px', color:'#fca5a5', fontSize:13 }}>{error}</div>}
                <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                  <button onClick={() => setModal(null)} style={{ padding:'9px 18px', borderRadius:9, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>Cancelar</button>
                  <button onClick={handleSave} disabled={saving} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:'none', background:'#6366f1', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    <Check size={14}/>{saving?'Guardando...':modal==='create'?'Crear':'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm delete */}
        {deleting && (
          <div style={overlay} onClick={e => e.target === e.currentTarget && setDeleting(null)}>
            <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:16, padding:28, width:'100%', maxWidth:360, textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
              <h3 style={{ color:'#fff', fontSize:16, fontWeight:700, marginBottom:8 }}>¿Eliminar usuario?</h3>
              <p style={{ color:'#71717a', fontSize:13, marginBottom:22 }}>
                <strong style={{ color:'#a1a1aa' }}>{deleting.username as string}</strong> perderá acceso inmediatamente.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setDeleting(null)} style={{ flex:1, padding:'9px', borderRadius:9, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>Cancelar</button>
                <button onClick={handleDelete} style={{ flex:1, padding:'9px', borderRadius:9, border:'none', background:'#dc2626', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>Eliminar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
