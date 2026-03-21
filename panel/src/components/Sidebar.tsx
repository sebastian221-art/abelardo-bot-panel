'use client'
// 📄 panel/src/components/Sidebar.tsx  ← REEMPLAZA EL ANTERIOR
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { logout } from '@/lib/auth'
import {
  LayoutDashboard, Users, MessageSquare, Send, BarChart2,
  ClipboardList, Star, Settings, LogOut, MessageCircle, BookOpen,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard'           },
  { href: '/contactos',      icon: Users,           label: 'Contactos'           },
  { href: '/conversaciones', icon: MessageSquare,   label: 'Conversaciones'      },
  { href: '/broadcast',      icon: Send,            label: 'Broadcasts'          },
  { href: '/encuestas',      icon: ClipboardList,   label: 'Encuestas'           },
  { href: '/embajadores',    icon: Star,            label: 'Embajadores'         },
  { href: '/analytics',      icon: BarChart2,       label: 'Analítica'           },
  { href: '/conocimiento',   icon: BookOpen,        label: 'Base de Conocimiento'},
  { href: '/chat-prueba',    icon: MessageCircle,   label: 'Chat de prueba'      },
  { href: '/usuarios',       icon: Settings,        label: 'Usuarios'            },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [user, setUser] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    try {
      const u = localStorage.getItem('ab_user')
      if (u) setUser(JSON.parse(u))
    } catch { /* noop */ }
  }, [])

  function handleLogout() {
    if (confirm('¿Cerrar sesión?')) { logout(); router.push('/login') }
  }

  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: '#18181b',
      borderRight: '1px solid #27272a', display: 'flex',
      flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #27272a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg,#0D1B3E,#CE1126)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>🇨🇴</div>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>Abelardo</p>
            <p style={{ color: '#71717a', fontSize: 10 }}>Panel 2026</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <a key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none',
              background: active ? '#1e293b' : 'transparent',
              color:       active ? '#fff'    : '#71717a',
              fontSize: 13, fontWeight: active ? 600 : 400,
            }}>
              <Icon size={16} style={{ color: active ? '#FCD116' : '#52525b', flexShrink: 0 }} />
              {label}
            </a>
          )
        })}
      </nav>

      {/* Usuario + logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid #27272a' }}>
        {user && (
          <div style={{ marginBottom: 8, padding: '6px 8px' }}>
            <p style={{ color: '#e4e4e7', fontSize: 12, fontWeight: 600 }}>{user.full_name || user.username}</p>
            <p style={{ color: '#52525b', fontSize: 10 }}>{user.role}</p>
          </div>
        )}
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '8px 10px', borderRadius: 8, border: 'none',
          background: 'transparent', color: '#f87171', cursor: 'pointer',
          fontSize: 12, fontWeight: 500,
        }}>
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}