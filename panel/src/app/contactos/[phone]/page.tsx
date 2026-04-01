'use client'
// 📄 panel/src/app/contactos/[phone]/page.tsx  ← REEMPLAZA EL ANTERIOR
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { getContact, getContactConversations, updateContact, getGroups, addGroupMembers, removeGroupMember } from '@/lib/api'
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Edit2, Save, X, UserPlus } from 'lucide-react'

const inputSt: React.CSSProperties = {
  padding:'7px 10px', background:'#09090b', border:'1px solid #27272a',
  borderRadius:7, color:'#fff', fontSize:13, outline:'none',
}

const INTENT_COLORS: Record<string,string> = {
  propuesta:'#6366f1', seguridad:'#ef4444', economia:'#f59e0b',
  salud:'#10b981', educacion:'#0ea5e9', paz:'#22c55e',
  optin:'#22c55e', optout:'#f87171', embajador:'#FCD116', corrupcion:'#f97316',
}

type Group = { id: number; name: string; color: string; icon: string }
type Contact = {
  phone:       string
  name:        string | null
  city:        string | null
  department:  string | null
  segment:     string
  total_msgs:  number
  source:      string
  referrals:   number
  opted_in:    boolean
  interests:   string[]
  groups:      Group[]
}
type Message = {
  id:        number
  role:      string
  message:   string
  intent:    string | null
  timestamp: string
}

export default function ContactoPage() {
  const { phone } = useParams<{ phone: string }>()
  const router    = useRouter()

  const [contact,      setContact]      = useState<Contact | null>(null)
  const [convs,        setConvs]        = useState<Message[]>([])
  const [loading,      setLoading]      = useState(true)
  const [editing,      setEditing]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [allGroups,    setAllGroups]    = useState<Group[]>([])
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [editName,     setEditName]     = useState('')
  const [editCity,     setEditCity]     = useState('')
  const [editDept,     setEditDept]     = useState('')

  async function loadAll() {
    if (!phone) return
    const [c, cv, gs] = await Promise.all([
      getContact(phone),
      getContactConversations(phone),
      getGroups(),
    ])
    const contact = c as Contact
    setContact(contact)
    setConvs(cv as Message[])
    setAllGroups(gs as Group[])
    setEditName(contact.name ?? '')
    setEditCity(contact.city ?? '')
    setEditDept(contact.department ?? '')
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [phone])

  async function handleSave() {
    if (!phone) return
    setSaving(true)
    await updateContact(phone, { name: editName, city: editCity, department: editDept })
    setEditing(false); setSaving(false); loadAll()
  }

  async function handleToggleOptIn() {
    if (!phone || !contact) return
    await updateContact(phone, { opted_in: !contact.opted_in })
    loadAll()
  }

  async function handleAddToGroup(groupId: number) {
    if (!phone) return
    await addGroupMembers(groupId, [phone])
    setShowAddGroup(false); loadAll()
  }

  async function handleRemoveFromGroup(groupId: number) {
    if (!phone) return
    if (!confirm('¿Quitar este contacto del grupo?')) return
    await removeGroupMember(groupId, phone); loadAll()
  }

  if (loading) return <Layout><p style={{ padding:48, color:'#52525b', textAlign:'center' }}>Cargando...</p></Layout>
  if (!contact) return <Layout><p style={{ padding:48, color:'#52525b', textAlign:'center' }}>Contacto no encontrado</p></Layout>

  const contactGroups   = contact.groups ?? []
  const availableGroups = allGroups.filter(g => !contactGroups.find(cg => cg.id === g.id))

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:800 }}>

        {/* Volver */}
        <button onClick={() => router.back()}
          style={{ display:'flex', alignItems:'center', gap:7, marginBottom:22, padding:'6px 12px', background:'transparent', border:'1px solid #27272a', borderRadius:8, color:'#71717a', cursor:'pointer', fontSize:13 }}>
          <ArrowLeft size={14}/> Volver
        </button>

        {/* Info contacto */}
        <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              {editing ? (
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  placeholder="Nombre del contacto"
                  style={{ ...inputSt, fontSize:18, fontWeight:700, marginBottom:6, width:240 }}/>
              ) : (
                <h1 style={{ color:'#fff', fontSize:20, fontWeight:700, marginBottom:4 }}>
                  {contact.name ?? 'Sin nombre'}
                </h1>
              )}
              <p style={{ color:'#71717a', fontSize:13, fontFamily:'monospace' }}>{contact.phone}</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={handleToggleOptIn}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:`1px solid ${contact.opted_in ? '#22c55e44' : '#3f3f46'}`, background:contact.opted_in ? '#0c1a0c' : 'transparent', cursor:'pointer', fontSize:12, fontWeight:600, color:contact.opted_in ? '#22c55e' : '#71717a' }}>
                {contact.opted_in ? <><CheckCircle size={14}/> Con opt-in</> : <><XCircle size={14}/> Sin opt-in</>}
              </button>
              {editing ? (
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={handleSave} disabled={saving}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:'none', background:'#22c55e', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    <Save size={13}/> {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditing(false)}
                    style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#71717a', cursor:'pointer' }}>
                    <X size={13}/>
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:12, cursor:'pointer' }}>
                  <Edit2 size={13}/> Editar
                </button>
              )}
            </div>
          </div>

          {/* Datos */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
            <div style={{ background:'#09090b', borderRadius:8, padding:'10px 14px' }}>
              <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase', marginBottom:6 }}>Ciudad</p>
              {editing
                ? <input value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="Ciudad" style={{ ...inputSt, width:'100%' }}/>
                : <p style={{ color:'#e4e4e7', fontSize:14, fontWeight:600 }}>{contact.city ?? '—'}</p>}
            </div>
            <div style={{ background:'#09090b', borderRadius:8, padding:'10px 14px' }}>
              <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase', marginBottom:6 }}>Departamento</p>
              {editing
                ? <input value={editDept} onChange={e => setEditDept(e.target.value)} placeholder="Departamento" style={{ ...inputSt, width:'100%' }}/>
                : <p style={{ color:'#e4e4e7', fontSize:14, fontWeight:600 }}>{contact.department ?? '—'}</p>}
            </div>
            {([
              { label:'Segmento', val: contact.segment },
              { label:'Mensajes', val: String(contact.total_msgs) },
              { label:'Fuente',   val: contact.source },
              { label:'Referidos',val: String(contact.referrals) },
            ] as { label: string; val: string }[]).map(f => (
              <div key={f.label} style={{ background:'#09090b', borderRadius:8, padding:'10px 14px' }}>
                <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase', marginBottom:4 }}>{f.label}</p>
                <p style={{ color:'#e4e4e7', fontSize:14, fontWeight:600 }}>{f.val}</p>
              </div>
            ))}
          </div>

          {/* Grupos */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase' }}>Grupos</p>
              {availableGroups.length > 0 && (
                <button onClick={() => setShowAddGroup(!showAddGroup)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:6, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:11, cursor:'pointer' }}>
                  <UserPlus size={11}/> Agregar a grupo
                </button>
              )}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: showAddGroup ? 10 : 0 }}>
              {contactGroups.length === 0
                ? <span style={{ color:'#3f3f46', fontSize:12 }}>Sin grupos asignados</span>
                : contactGroups.map(g => (
                    <span key={g.id} style={{ display:'flex', alignItems:'center', gap:5, background:g.color+'22', color:g.color, border:`1px solid ${g.color}44`, borderRadius:7, padding:'3px 10px', fontSize:12, fontWeight:600 }}>
                      {g.icon} {g.name}
                      <button onClick={() => handleRemoveFromGroup(g.id)}
                        style={{ background:'transparent', border:'none', cursor:'pointer', color:g.color, padding:0, display:'flex' }}>
                        <X size={10}/>
                      </button>
                    </span>
                  ))
              }
            </div>
            {showAddGroup && availableGroups.length > 0 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
                {availableGroups.map(g => (
                  <button key={g.id} onClick={() => handleAddToGroup(g.id)}
                    style={{ display:'flex', alignItems:'center', gap:5, background:'#09090b', color:'#a1a1aa', border:'1px solid #27272a', borderRadius:7, padding:'4px 10px', fontSize:12, cursor:'pointer' }}>
                    {g.icon} {g.name} <span style={{ color:'#22c55e', fontSize:10 }}>+ Agregar</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Intereses */}
          {contact.interests?.length > 0 && (
            <div style={{ marginTop:14 }}>
              <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase', marginBottom:8 }}>Intereses detectados</p>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {contact.interests.map(i => (
                  <span key={i} style={{ background:(INTENT_COLORS[i]??'#6366f1')+'22', color:INTENT_COLORS[i]??'#6366f1', border:`1px solid ${(INTENT_COLORS[i]??'#6366f1')}44`, borderRadius:6, padding:'2px 9px', fontSize:11, fontWeight:600 }}>
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Historial */}
        <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:22 }}>
          <p style={{ color:'#fff', fontWeight:600, fontSize:14, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
            <MessageSquare size={16} style={{ color:'#FCD116' }}/> Historial de conversación ({convs.length})
          </p>
          {convs.length === 0 ? (
            <p style={{ color:'#52525b', textAlign:'center', padding:24 }}>Sin mensajes aún</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:500, overflowY:'auto' }}>
              {convs.map(msg => {
                const isUser = msg.role === 'user'
                return (
                  <div key={msg.id} style={{ display:'flex', justifyContent: isUser ? 'flex-start' : 'flex-end' }}>
                    <div style={{ maxWidth:'75%', padding:'9px 13px', borderRadius:12, background:isUser ? '#1e293b' : '#3f0d0d', border:`1px solid ${isUser ? '#27272a' : '#7f1d1d44'}` }}>
                      <p style={{ color:isUser ? '#e4e4e7' : '#fca5a5', fontSize:13, lineHeight:1.5 }}>
                        {msg.message}
                      </p>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4, gap:12 }}>
                        <p style={{ color:'#52525b', fontSize:10 }}>
                          {new Date(msg.timestamp).toLocaleString('es-CO', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' })}
                        </p>
                        {msg.intent && (
                          <span style={{ color:INTENT_COLORS[msg.intent]??'#52525b', fontSize:9 }}>
                            {msg.intent}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}