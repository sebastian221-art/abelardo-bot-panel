'use client'
// 📄 panel/src/components/ConversationFeed.tsx

const INTENT_COLORS: Record<string, string> = {
  propuesta: '#6366f1', seguridad: '#ef4444', economia: '#f59e0b',
  salud: '#10b981', educacion: '#0ea5e9', paz: '#22c55e',
  corrupcion: '#f97316', embajador: '#FCD116', optin: '#22c55e',
  optout: '#f87171', saludo: '#a1a1aa',
}

interface Msg {
  id:        number
  phone:     string
  role:      'user' | 'assistant'
  message:   string
  intent?:   string
  timestamp: string
}

interface Props {
  messages: Msg[]
}

export default function ConversationFeed({ messages }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {messages.map(m => {
        const isUser = m.role === 'user'
        return (
          <div key={m.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end' }}>
            <div style={{
              maxWidth: '75%', padding: '9px 14px',
              borderRadius: isUser ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
              background: isUser ? '#1e293b' : '#3f0d0d',
              border: `1px solid ${isUser ? '#27272a' : '#7f1d1d44'}`,
            }}>
              <p style={{ color: isUser ? '#e4e4e7' : '#fca5a5', fontSize: 13, lineHeight: 1.5 }}>
                {m.message}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, gap: 12 }}>
                <span style={{ color: '#3f3f46', fontSize: 10 }}>
                  {new Date(m.timestamp).toLocaleString('es-CO', {
                    hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short',
                  })}
                </span>
                {m.intent && (
                  <span style={{
                    color: INTENT_COLORS[m.intent] || '#52525b', fontSize: 9,
                  }}>{m.intent}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
