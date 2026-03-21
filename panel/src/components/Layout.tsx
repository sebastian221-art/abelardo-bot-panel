'use client'
// 📄 panel/src/components/Layout.tsx
import Sidebar from './Sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto', minHeight:'100vh', background:'#09090b' }}>
        {children}
      </main>
    </div>
  )
}
