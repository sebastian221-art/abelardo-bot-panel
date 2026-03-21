'use client'
// 📄 panel/src/components/Modal.tsx
import { X } from 'lucide-react'

interface Props {
  open:     boolean
  onClose:  () => void
  title:    string
  children: React.ReactNode
  maxWidth?: number
}

export default function Modal({ open, onClose, title, children, maxWidth = 500 }: Props) {
  if (!open) return null
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: '#000000aa',
        backdropFilter: 'blur(4px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 24,
      }}
    >
      <div style={{
        background: '#18181b', border: '1px solid #27272a',
        borderRadius: 16, padding: 28, width: '100%',
        maxWidth, maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
