'use client'
// 📄 panel/src/components/ContactRow.tsx
import { CheckCircle, XCircle } from 'lucide-react'

interface Contact {
  phone:      string
  name?:      string
  city?:      string
  opted_in:   boolean
  total_msgs: number
  segment:    string
}

interface Props {
  contact:  Contact
  onClick?: () => void
}

export default function ContactRow({ contact, onClick }: Props) {
  return (
    <tr onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <td style={td}>{contact.name || '—'}</td>
      <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: '#a1a1aa' }}>{contact.phone}</td>
      <td style={td}>{contact.city || '—'}</td>
      <td style={td}>
        {contact.opted_in
          ? <CheckCircle size={16} style={{ color: '#22c55e' }} />
          : <XCircle    size={16} style={{ color: '#3f3f46' }} />}
      </td>
      <td style={td}>{contact.total_msgs}</td>
      <td style={td}>
        <span style={{ background: '#1e293b', color: '#94a3b8', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>
          {contact.segment}
        </span>
      </td>
    </tr>
  )
}

const td: React.CSSProperties = {
  padding: '11px 16px',
  color: '#e4e4e7',
  fontSize: 13,
  borderBottom: '1px solid #1a1a1d',
}
