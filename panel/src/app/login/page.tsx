'use client'
// 📄 panel/src/app/login/page.tsx
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { login } from '@/lib/api'
import { saveSession } from '@/lib/auth'

export default function LoginPage() {
  const router  = useRouter()
  const params  = useSearchParams()
  const [user,  setUser]  = useState('')
  const [pass,  setPass]  = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await login(user.trim(), pass)
      saveSession(data.token, data.user)
      router.push(params.get('from') || '/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#09090b',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{
            width:60, height:60, borderRadius:14, margin:'0 auto 16px',
            background:'linear-gradient(135deg,#0D1B3E,#CE1126)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
          }}>🇨🇴</div>
          <h1 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>Abelardo 2026</h1>
          <p style={{ color:'#71717a', fontSize:13, marginTop:6 }}>Panel de campaña presidencial</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{
          background:'#18181b', border:'1px solid #27272a', borderRadius:16, padding:28,
        }}>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>
              Usuario
            </label>
            <input
              value={user} onChange={e => setUser(e.target.value)}
              placeholder="admin" autoFocus
              style={{
                width:'100%', padding:'10px 12px', background:'#09090b',
                border:'1px solid #27272a', borderRadius:8, color:'#fff',
                fontSize:14, outline:'none', boxSizing:'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>
              Contraseña
            </label>
            <input
              type="password" value={pass} onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              style={{
                width:'100%', padding:'10px 12px', background:'#09090b',
                border:'1px solid #27272a', borderRadius:8, color:'#fff',
                fontSize:14, outline:'none', boxSizing:'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background:'#3f1212', border:'1px solid #7f1d1d', borderRadius:8,
              padding:'10px 14px', color:'#fca5a5', fontSize:13, marginBottom:16,
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width:'100%', padding:'11px', borderRadius:9, border:'none',
            background: loading ? '#3f3f46' : '#CE1126', color:'#fff',
            fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Entrando...' : 'Ingresar al panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
