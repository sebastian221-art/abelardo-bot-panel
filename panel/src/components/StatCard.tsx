'use client'
// 📄 panel/src/components/StatCard.tsx
import { LucideIcon } from 'lucide-react'

interface Props {
  label:    string
  value:    string | number
  icon:     LucideIcon
  color?:   string
  sub?:     string
}

export default function StatCard({ label, value, icon: Icon, color = '#6366f1', sub }: Props) {
  return (
    <div style={{
      background:'#18181b', border:'1px solid #27272a', borderRadius:14,
      padding:'20px 22px', display:'flex', alignItems:'flex-start', gap:14,
    }}>
      <div style={{
        width:42, height:42, borderRadius:10, flexShrink:0,
        background: color + '22',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p style={{ color:'#71717a', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</p>
        <p style={{ color:'#fff', fontSize:26, fontWeight:700, lineHeight:1.2, marginTop:2 }}>{value}</p>
        {sub && <p style={{ color:'#52525b', fontSize:11, marginTop:4 }}>{sub}</p>}
      </div>
    </div>
  )
}
