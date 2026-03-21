'use client'
// 📄 panel/src/components/TopicsCloud.tsx

const COLORS: Record<string, string> = {
  propuesta: '#6366f1', seguridad: '#ef4444', economia: '#f59e0b',
  salud: '#10b981', educacion: '#0ea5e9', paz: '#22c55e',
  corrupcion: '#f97316', embajador: '#FCD116',
}

interface Topic { intent: string; total: number }

export default function TopicsCloud({ topics }: { topics: Topic[] }) {
  if (!topics.length) return <p style={{ color: '#52525b', fontSize: 13 }}>Sin datos</p>

  const max = Math.max(...topics.map(t => t.total))

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {topics.map(t => {
        const ratio = t.total / max
        const size  = 11 + ratio * 12
        const color = COLORS[t.intent] || '#71717a'
        return (
          <span key={t.intent} style={{
            background: color + '22',
            color,
            border: `1px solid ${color}44`,
            borderRadius: 20,
            padding: `${4 + ratio * 4}px ${10 + ratio * 6}px`,
            fontSize: size,
            fontWeight: ratio > 0.5 ? 700 : 500,
            cursor: 'default',
          }}>
            {t.intent} <span style={{ opacity: 0.6, fontSize: size - 2 }}>({t.total})</span>
          </span>
        )
      })}
    </div>
  )
}
