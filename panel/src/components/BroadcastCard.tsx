'use client'
// 📄 panel/src/components/BroadcastCard.tsx
import { Send, Ban, Loader } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', scheduled: 'Programado', sending: 'Enviando...',
  sent: 'Enviado', cancelled: 'Cancelado', failed: 'Fallido',
}
const STATUS_COLOR: Record<string, string> = {
  draft: '#71717a', scheduled: '#f59e0b', sending: '#0ea5e9',
  sent: '#22c55e', cancelled: '#52525b', failed: '#ef4444',
}

interface Broadcast {
  id:            number
  title:         string
  message:       string
  status:        string
  segment:       string
  segment_value?: string
  total_targets: number
  sent_count:    number
  failed_count:  number
}

interface Props {
  broadcast:  Broadcast
  sending:    boolean
  onSend:     (id: number) => void
  onCancel:   (id: number) => void
}

export default function BroadcastCard({ broadcast: b, sending, onSend, onCancel }: Props) {
  const color    = STATUS_COLOR[b.status] || '#71717a'
  const isSent   = b.status === 'sent'
  const canSend  = b.status === 'draft' || b.status === 'scheduled'

  return (
    <div style={{
      background: '#18181b', border: '1px solid #27272a',
      borderRadius: 14, padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{b.title}</h3>
            <span style={{
              background: color + '22', color, border: `1px solid ${color}44`,
              borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600,
            }}>{STATUS_LABEL[b.status]}</span>
          </div>
          <p style={{ color: '#71717a', fontSize: 12, marginBottom: 8 }}>
            Segmento: <strong style={{ color: '#a1a1aa' }}>{b.segment}</strong>
            {b.segment_value && <> · <strong style={{ color: '#a1a1aa' }}>{b.segment_value}</strong></>}
          </p>
          <p style={{ color: '#a1a1aa', fontSize: 13, lineHeight: 1.5 }}>
            {b.message.slice(0, 120)}{b.message.length > 120 ? '...' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
          {canSend && (
            <button onClick={() => onSend(b.id)} disabled={sending}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: 'none',
                background: '#CE1126', color: '#fff', fontSize: 12,
                fontWeight: 600, cursor: 'pointer',
              }}>
              {sending ? <Loader size={12} /> : <Send size={12} />}
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          )}
          {canSend && (
            <button onClick={() => onCancel(b.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 8,
                border: '1px solid #27272a', background: 'transparent',
                color: '#71717a', fontSize: 12, cursor: 'pointer',
              }}>
              <Ban size={12} /> Cancelar
            </button>
          )}
        </div>
      </div>

      {isSent && (
        <div style={{ display: 'flex', gap: 20, borderTop: '1px solid #27272a', paddingTop: 12 }}>
          {[
            { label: 'Objetivo', val: b.total_targets, color: '#71717a' },
            { label: 'Enviados', val: b.sent_count,    color: '#22c55e' },
            { label: 'Fallidos', val: b.failed_count,  color: '#ef4444' },
          ].map(s => (
            <div key={s.label}>
              <p style={{ color: '#52525b', fontSize: 10, textTransform: 'uppercase' }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 18, fontWeight: 700 }}>{s.val}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
