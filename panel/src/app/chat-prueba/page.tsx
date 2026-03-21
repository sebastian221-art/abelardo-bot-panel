'use client'
// 📄 panel/src/app/chat-prueba/page.tsx
import { useState, useRef, useEffect } from 'react'
import Layout from '@/components/Layout'
import { testChat } from '@/lib/api'
import { Send, Bot, User, RefreshCw, MessageCircle } from 'lucide-react'

interface Msg {
  role:   'user' | 'bot'
  text:   string
  intent?: string
  ts:     Date
}

const INTENT_COLOR: Record<string,string> = {
  propuesta:'#6366f1', seguridad:'#ef4444', economia:'#f59e0b',
  salud:'#10b981', educacion:'#0ea5e9', paz:'#22c55e',
  corrupcion:'#f97316', embajador:'#FCD116', optin:'#22c55e',
  optout:'#f87171', saludo:'#a1a1aa',
}

const TEST_PHONE = 'panel_test_001'

const QUICK = [
  '¿Quién es Abelardo de la Espriella?',
  '¿Cuál es su propuesta de seguridad?',
  '¿Qué hará con el desempleo?',
  '¿Qué piensa del gobierno de Petro?',
  '¿Cuándo son las elecciones?',
  'Quiero recibir información de la campaña',
]

export default function ChatPruebaPage() {
  const [msgs,    setMsgs]    = useState<Msg[]>([])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [msgs])

  // Mensaje de bienvenida
  useEffect(() => {
    setMsgs([{
      role: 'bot',
      text: '¡Hola! Soy el ChatBot de Abelardo de la Espriella 🇨🇴\n\nPuedes preguntarme sobre sus propuestas, plan de gobierno, debates y más. Estoy entrenado con la información oficial de la campaña.\n\n¿En qué te puedo ayudar?',
      ts:   new Date(),
    }])
  }, [])

  async function handleSend(text?: string) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: Msg = { role:'user', text:msg, ts:new Date() }
    setMsgs(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await testChat(TEST_PHONE, msg)
      setMsgs(prev => [...prev, {
        role:   'bot',
        text:   res.reply,
        intent: res.intent,
        ts:     new Date(),
      }])
    } catch {
      setMsgs(prev => [...prev, {
        role: 'bot',
        text: '⚠️ Error al conectar con el backend. Verifica que el servidor esté corriendo en localhost:8000',
        ts:   new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    if (!confirm('¿Resetear la conversación?')) return
    setMsgs([{
      role: 'bot',
      text: 'Conversación reiniciada. ¿En qué te puedo ayudar?',
      ts:   new Date(),
    }])
  }

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:820, height:'100vh', display:'flex', flexDirection:'column', boxSizing:'border-box' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexShrink:0 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:38, height:38, borderRadius:10, flexShrink:0,
                background:'linear-gradient(135deg,#0D1B3E,#CE1126)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
              }}>🇨🇴</div>
              <div>
                <h1 style={{ color:'#fff', fontSize:18, fontWeight:700 }}>Chat de prueba</h1>
                <p style={{ color:'#71717a', fontSize:12 }}>Simula una conversación real con el bot</p>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={handleReset}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:12, cursor:'pointer' }}>
              <RefreshCw size={13}/> Reiniciar
            </button>
          </div>
        </div>

        {/* Aviso */}
        <div style={{ background:'#1c1a08', border:'1px solid #FCD11633', borderRadius:10, padding:'10px 14px', marginBottom:16, flexShrink:0 }}>
          <p style={{ color:'#FCD116', fontSize:12 }}>
            ⚡ Este chat prueba el bot directamente sin WhatsApp. Las respuestas dependen del contenido en <code style={{ background:'#27272a', padding:'1px 5px', borderRadius:4 }}>data/abelardo/</code>.
            Llena esos archivos con el programa real de Abelardo para respuestas precisas.
          </p>
        </div>

        {/* Quick replies */}
        <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:14, flexShrink:0 }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => handleSend(q)} disabled={loading}
              style={{
                padding:'5px 11px', borderRadius:16, border:'1px solid #27272a',
                background:'transparent', color:'#a1a1aa', fontSize:11, cursor:'pointer',
                transition:'all .15s', whiteSpace:'nowrap',
              }}>
              {q}
            </button>
          ))}
        </div>

        {/* Mensajes */}
        <div style={{
          flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12,
          padding:'4px 2px', marginBottom:14,
        }}>
          {msgs.map((m, i) => {
            const isUser = m.role === 'user'
            return (
              <div key={i} style={{ display:'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap:10, alignItems:'flex-end' }}>
                {!isUser && (
                  <div style={{
                    width:30, height:30, borderRadius:'50%', flexShrink:0,
                    background:'linear-gradient(135deg,#0D1B3E,#CE1126)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
                  }}>🇨🇴</div>
                )}

                <div style={{ maxWidth:'72%' }}>
                  <div style={{
                    padding:'11px 15px', borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isUser ? '#CE1126' : '#18181b',
                    border: isUser ? 'none' : '1px solid #27272a',
                  }}>
                    {m.text.split('\n').map((line, j) => (
                      <p key={j} style={{ color: isUser ? '#fff' : '#e4e4e7', fontSize:13, lineHeight:1.6, margin:0 }}>
                        {line || <>&nbsp;</>}
                      </p>
                    ))}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                    <span style={{ color:'#3f3f46', fontSize:10 }}>
                      {m.ts.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })}
                    </span>
                    {m.intent && m.intent !== 'consulta_general' && (
                      <span style={{
                        background: (INTENT_COLOR[m.intent] || '#52525b') + '22',
                        color:       INTENT_COLOR[m.intent] || '#52525b',
                        border:      `1px solid ${(INTENT_COLOR[m.intent] || '#52525b')}44`,
                        borderRadius:5, padding:'1px 7px', fontSize:9, fontWeight:600,
                      }}>{m.intent}</span>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div style={{
                    width:30, height:30, borderRadius:'50%', flexShrink:0, background:'#27272a',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <User size={14} style={{ color:'#a1a1aa' }}/>
                  </div>
                )}
              </div>
            )
          })}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
              <div style={{
                width:30, height:30, borderRadius:'50%', flexShrink:0,
                background:'linear-gradient(135deg,#0D1B3E,#CE1126)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
              }}>🇨🇴</div>
              <div style={{
                padding:'12px 16px', borderRadius:'14px 14px 14px 4px',
                background:'#18181b', border:'1px solid #27272a',
                display:'flex', gap:5, alignItems:'center',
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width:6, height:6, borderRadius:'50%', background:'#52525b',
                    animation:`bounce 1.2s ${i*0.2}s infinite`,
                  }}/>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{
          display:'flex', gap:10, flexShrink:0,
          background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:'10px 14px',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Escribe una pregunta al bot... (Enter para enviar)"
            disabled={loading}
            style={{
              flex:1, background:'transparent', border:'none', color:'#fff',
              fontSize:14, outline:'none',
            }}
          />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()}
            style={{
              width:38, height:38, borderRadius:10, border:'none', flexShrink:0,
              background: loading || !input.trim() ? '#27272a' : '#CE1126',
              color:'#fff', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
            <Send size={15}/>
          </button>
        </div>

        <style>{`
          @keyframes bounce {
            0%,60%,100% { transform:translateY(0) }
            30%          { transform:translateY(-6px) }
          }
        `}</style>
      </div>
    </Layout>
  )
}
