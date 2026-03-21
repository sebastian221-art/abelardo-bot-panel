'use client'
// 📄 panel/src/components/CityChart.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data:  { city: string; total: number }[]
  limit?: number
}

export default function CityChart({ data, limit = 10 }: Props) {
  const sliced = data.slice(0, limit)
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={sliced} layout="vertical">
        <XAxis type="number" tick={{ fill: '#52525b', fontSize: 10 }} />
        <YAxis type="category" dataKey="city" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={90} />
        <Tooltip
          contentStyle={{ background: '#1c1c1f', border: '1px solid #27272a', color: '#fff', fontSize: 12 }}
        />
        <Bar dataKey="total" fill="#0D1B3E" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
