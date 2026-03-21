'use client'
// 📄 panel/src/app/contactos/[phone]/page.tsx
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { getContact, getContactConversations } from '@/lib/api'
import { ArrowLeft, CheckCircle, XCircle, MessageSquare } from 'lucide-react'

export default function ContactoPage() {
  const { phone } = useParams<{ phone: string }>()
  const router    = useRouter()
  const [contact, setContact] = useState<Record<string,unknown> | null>(null)
  const [convs,   setConvs]   = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!phone) return
    Promise.all([
      getContact(phone).then(d => setContact(d as Record<string,unknown>)),
      getContactConversations(phone).then(d => setConvs(d as unknown[])),
    ]).finally(() => setLoading(false))
  }, [phone])

  const INTENT_COLORS: Record<string,string> = {
    propuesta:'#6366f1', seguridad:'#ef4444', economia:'#f59e0b',
    salud:'#10b981', educacion:'#0ea5e9', paz:'#22c55e',
    optin:'#22c55e', optout:'#f87171', embajador:'#FCD116',
  }

  if (loading) return <Layout><p style={{ padding:48, color:'#52525b', textAlign:'center' }}>Cargando...</p></Layout>
  if (!contact) return <Layout><p style={{ padding:48, color:'#52525b', textAlign:'center' }}>Contacto no encontrado</p></Layout>

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:760 }}>
        {/* Volver */}
        <button onClick={() => router.back()}
          style={{ display:'flex', alignItems:'center', gap:7, marginBottom:22, padding:'6px 12px', background:'transparent', border:'1px solid #27272a', borderRadius:8, color:'#71717a', cursor:'pointer', fontSize:13 }}>
          <ArrowLeft size={14}/> Volver
        </button>

        {/* Info contacto */}
        <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <h1 style={{ color:'#fff', fontSize:20, fontWeight:700 }}>{(contact.name as string) || 'Sin nombre'}</h1>
              <p style={{ color:'#71717a', fontSize:13, fontFamily:'monospace' }}>{contact.phone as string}</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {contact.opted_in
                ? <><CheckCircle size={16} style={{ color:'#22c55e' }}/><span style={{ color:'#22c55e', fontSize:13, fontWeight:600 }}>Con opt-in</span></>
                : <><XCircle    size={16} style={{ color:'#71717a' }}/><span style={{ color:'#71717a', fontSize:13 }}>Sin opt-in</span></>
              }
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {[
              { label:'Ciudad',      val: (contact.city as string) || '—' },
              { label:'Departamento',val: (contact.department as string) || '—' },
              { label:'Segmento',    val: contact.segment as string },
              { label:'Mensajes',    val: String(contact.total_msgs) },
              { label:'Referidos',   val: String(contact.referrals) },
              { label:'Fuente',      val: contact.source as string },
            ].map(f => (
              <div key={f.label} style={{ background:'#09090b', borderRadius:8, padding:'10px 14px' }}>
                <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase', marginBottom:4 }}>{f.label}</p>
                <p style={{ color:'#e4e4e7', fontSize:14, fontWeight:600 }}>{f.val}</p>
              </div>
            ))}
          </div>

          {(contact.interests as string[])?.length > 0 && (
            <div style={{ marginTop:14 }}>
              <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase', marginBottom:8 }}>Intereses detectados</p>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {(contact.interests as string[]).map(i => (
                  <span key={i} style={{
                    background: (INTENT_COLORS[i] || '#6366f1') + '22',
                    color: INTENT_COLORS[i] || '#6366f1',
                    border: `1px solid ${(INTENT_COLORS[i] || '#6366f1')}44`,
                    borderRadius:6, padding:'2px 9px', fontSize:11, fontWeight:600,
                  }}>{i}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conversación */}
        <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:22 }}>
          <p style={{ color:'#fff', fontWeight:600, fontSize:14, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
            <MessageSquare size={16} style={{ color:'#FCD116' }}/> Historial de conversación ({convs.length})
          </p>
          {convs.length === 0 ? (
            <p style={{ color:'#52525b', textAlign:'center', padding:24 }}>Sin mensajes aún</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:500, overflowY:'auto' }}>
              {convs.map((c: unknown) => {
                const msg = c as Record<string,unknown>
                const isUser = msg.role === 'user'
                return (
                  <div key={msg.id as number} style={{ display:'flex', justifyContent: isUser ? 'flex-start' : 'flex-end' }}>
                    <div style={{
                      maxWidth:'75%', padding:'9px 13px', borderRadius:12,
                      background: isUser ? '#1e293b' : '#3f0d0d',
                      border: `1px solid ${isUser ? '#27272a' : '#7f1d1d44'}`,
                    }}>
                      <p style={{ color: isUser ? '#e4e4e7' : '#fca5a5', fontSize:13, lineHeight:1.5 }}>{msg.message as string}</p>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4, gap:12 }}>
                        <p style={{ color:'#52525b', fontSize:10 }}>
                          {new Date(msg.timestamp as string).toLocaleString('es-CO', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' })}
                        </p>
                        {msg.intent && (
                          <span style={{ color: INTENT_COLORS[msg.intent as string] || '#52525b', fontSize:9 }}>{msg.intent as string}</span>
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
