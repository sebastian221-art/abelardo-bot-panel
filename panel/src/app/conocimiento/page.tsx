'use client'
// 📄 panel/src/app/conocimiento/page.tsx
import { useEffect, useState, useCallback } from 'react'
import Layout from '@/components/Layout'
import { getToken } from '@/lib/auth'
import {
  Plus, Pencil, Trash2, X, Check, BookOpen,
  ToggleLeft, ToggleRight, RefreshCw, Search, ChevronDown,
} from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function req(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) },
  })
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || 'Error') }
  return r.json()
}

const CATEGORIES = [
  'quién es abelardo', 'seguridad', 'economía', 'salud', 'educación',
  'campo', 'energía', 'corrupción', 'familia y valores',
  'propuestas generales', 'frases y discursos', 'preguntas frecuentes',
  'contexto colombia', 'campaña',
]

const CAT_COLORS: Record<string, string> = {
  'quién es abelardo': '#6366f1', 'seguridad': '#ef4444', 'economía': '#f59e0b',
  'salud': '#10b981', 'educación': '#0ea5e9', 'campo': '#22c55e',
  'energía': '#f97316', 'corrupción': '#a855f7', 'familia y valores': '#ec4899',
  'propuestas generales': '#0D1B3E', 'frases y discursos': '#FCD116',
  'preguntas frecuentes': '#14b8a6', 'contexto colombia': '#CE1126', 'campaña': '#8b5cf6',
}

const BLANK = { title: '', category: 'quién es abelardo', content: '', active: true }

const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: '#09090b',
  border: '1px solid #27272a', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

// Documentos de ejemplo para pre-cargar
const DOCS_EJEMPLO = [
  {
    title: '¿Quién es Abelardo de la Espriella?',
    category: 'quién es abelardo',
    content: `Abelardo De La Espriella es un destacado abogado penalista colombiano, nacido en Barranquilla. Es candidato presidencial para las elecciones de 2026 por el movimiento ciudadano "Defensores de la Patria". Su fórmula vicepresidencial es José Manuel Restrepo, exministro y exrector de la Universidad del Rosario. Su propuesta de gobierno se llama "Colombia, Patria Milagro". Tiene el aval del movimiento Creemos, del alcalde de Medellín Federico Gutiérrez.`,
  },
  {
    title: 'Plan Patriota II — Propuesta de Seguridad',
    category: 'seguridad',
    content: `El Plan Patriota II es la propuesta de seguridad de Abelardo. En los primeros 90 días: retomar territorios con la fuerza pública, captura de cabecillas en cada región, Puestos de Mando Unificado en todos los departamentos, erradicación de cultivos ilícitos con bioherbicidas y drones. Alianza con Estados Unidos y con Israel para drones e inteligencia avanzada. Rechaza la Paz Total. Mano de hierro contra los criminales.`,
  },
  {
    title: 'Plan de Choque en Salud — 10 Billones',
    category: 'salud',
    content: `Abelardo propone un plan de choque de 10 billones de pesos para estabilizar el sistema de salud en los primeros 90 días. Garantiza atención médica, entrega de medicamentos, pago a EPS que cumplen y salarios a médicos. Los recursos vendrían de la ADRES o emisión de bonos. También propone auditorías a las EPS y fortalecer la infraestructura hospitalaria.`,
  },
  {
    title: 'Propuesta Económica — Reducción del Estado',
    category: 'economía',
    content: `Abelardo propone reducir el gasto estatal en 40%, eliminar el 4x1000, quitar impuestos a la gasolina, no hacer más reformas tributarias. Reactivar exploración de petróleo con fracking supervisado. Régimen especial para pequeños empresarios y emprendedores digitales. Créditos a tasa cero para equipos tecnológicos. Meta: crear 3 millones de empleos en cuatro años.`,
  },
  {
    title: 'Metas del Gobierno de Abelardo',
    category: 'propuestas generales',
    content: `En cuatro años Abelardo se compromete a: crear 3 millones de empleos, reducir la pobreza en 20%, disminuir la violencia en 50%, convertir 1 millón de familias en propietarias de vivienda, recuperar territorios tomados por grupos armados, estabilizar el sistema de salud en 90 días, reducir el gasto del Estado en 40%.`,
  },
  {
    title: 'Frases clave de Abelardo',
    category: 'frases y discursos',
    content: `"Yo me los voy a traer hasta acá con resultados, cumpliendo lo que ni siquiera Petro les cumplió. Es la única manera, porque con discursos no se puede." — "Colombia debe salir de las manos del comunismo y el populismo." — "Los que se han robado el país tienen que pagar sus culpas." — "Un país que no tiene justicia no tiene futuro." — "Mano de hierro contra los criminales."`,
  },
  {
    title: '¿Cuándo son las elecciones?',
    category: 'preguntas frecuentes',
    content: `La primera vuelta presidencial es el 31 de mayo de 2026. Si ningún candidato obtiene más del 50% de los votos, hay segunda vuelta el 21 de junio de 2026. La fórmula vicepresidencial de Abelardo es José Manuel Restrepo.`,
  },
]

export default function ConocimientoPage() {
  const [docs,     setDocs]     = useState<unknown[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [catFilter,setCatFilter]= useState('')
  const [modal,    setModal]    = useState<'create'|'edit'|null>(null)
  const [editing,  setEditing]  = useState<Record<string,unknown>|null>(null)
  const [form,     setForm]     = useState<typeof BLANK>(BLANK)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [deleting, setDeleting] = useState<Record<string,unknown>|null>(null)
  const [preloading, setPreloading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const q = catFilter ? `?category=${encodeURIComponent(catFilter)}` : ''
    const d = await req(`/knowledge/${q}`).catch(() => [])
    setDocs(d as unknown[])
    setLoading(false)
  }, [catFilter])

  useEffect(() => { load() }, [load])

  // Filtro local por búsqueda
  const filtered = (docs as Record<string,unknown>[]).filter(d =>
    !search || (d.title as string).toLowerCase().includes(search.toLowerCase()) ||
    (d.content as string).toLowerCase().includes(search.toLowerCase())
  )

  // Agrupar por categoría
  const grouped: Record<string, Record<string,unknown>[]> = {}
  filtered.forEach(d => {
    const cat = d.category as string
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(d)
  })

  function openCreate() {
    setForm(BLANK); setError(''); setEditing(null); setModal('create')
  }
  function openEdit(d: Record<string,unknown>) {
    setForm({ title: d.title as string, category: d.category as string, content: d.content as string, active: d.active as boolean })
    setError(''); setEditing(d); setModal('edit')
  }

  async function handleSave() {
    setError('')
    if (!form.title.trim()) return setError('El título es obligatorio')
    if (!form.content.trim()) return setError('El contenido es obligatorio')
    setSaving(true)
    try {
      if (modal === 'create') await req('/knowledge/', { method: 'POST', body: JSON.stringify(form) })
      else if (editing) await req(`/knowledge/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) })
      setModal(null); load()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function handleToggle(id: number) {
    await req(`/knowledge/${id}/toggle`, { method: 'PATCH' }).catch(console.error)
    load()
  }

  async function handleDelete() {
    if (!deleting) return
    await req(`/knowledge/${deleting.id}`, { method: 'DELETE' }).catch(console.error)
    setDeleting(null); load()
  }

  async function handlePreload() {
    if (!confirm(`¿Cargar ${DOCS_EJEMPLO.length} documentos de ejemplo con información real de Abelardo?`)) return
    setPreloading(true)
    for (const doc of DOCS_EJEMPLO) {
      await req('/knowledge/', { method: 'POST', body: JSON.stringify({ ...doc, active: true }) }).catch(() => {})
    }
    setPreloading(false)
    load()
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: '#000000bb', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24,
  }
  const card: React.CSSProperties = {
    background: '#18181b', border: '1px solid #27272a', borderRadius: 16,
    padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto',
  }

  return (
    <Layout>
      <div style={{ padding: 32, maxWidth: 1100 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <BookOpen size={22} style={{ color: '#FCD116' }} />
              <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Base de Conocimiento</h1>
            </div>
            <p style={{ color: '#71717a', fontSize: 13 }}>
              Todo lo que el bot sabe sobre Abelardo. Agrega, edita o elimina información aquí.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={load}
              style={{ padding: '8px 12px', background: 'transparent', border: '1px solid #27272a', borderRadius: 8, color: '#71717a', cursor: 'pointer', display: 'flex' }}>
              <RefreshCw size={14} />
            </button>
            {docs.length === 0 && (
              <button onClick={handlePreload} disabled={preloading}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, border: '1px solid #FCD11644', background: '#1c1a08', color: '#FCD116', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                ⚡ {preloading ? 'Cargando...' : 'Cargar datos de Abelardo'}
              </button>
            )}
            <button onClick={openCreate}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', background: '#CE1126', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={15} /> Agregar información
            </button>
          </div>
        </div>

        {/* Aviso si está vacío */}
        {!loading && docs.length === 0 && (
          <div style={{ background: '#1c1a08', border: '1px solid #FCD11633', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
            <p style={{ color: '#FCD116', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>⚡ El bot no tiene información todavía</p>
            <p style={{ color: '#a1a1aa', fontSize: 13 }}>
              Clic en <strong style={{ color: '#FCD116' }}>"Cargar datos de Abelardo"</strong> para agregar información básica automáticamente,
              o clic en <strong style={{ color: '#fff' }}>"Agregar información"</strong> para crear documentos uno por uno.
            </p>
          </div>
        )}

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar en el conocimiento..."
              style={{ ...inputSt, paddingLeft: 34 }} />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            style={{ ...inputSt, width: 200 }}>
            <option value="">Todas las categorías</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total documentos', val: docs.length },
            { label: 'Activos', val: (docs as Record<string,unknown>[]).filter(d => d.active).length },
            { label: 'Categorías', val: Object.keys(grouped).length },
          ].map(s => (
            <div key={s.label} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: '10px 18px' }}>
              <p style={{ color: '#52525b', fontSize: 10, textTransform: 'uppercase' }}>{s.label}</p>
              <p style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Documentos agrupados */}
        {loading ? (
          <p style={{ color: '#52525b', textAlign: 'center', padding: 48 }}>Cargando...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#52525b', textAlign: 'center', padding: 48 }}>Sin documentos que coincidan</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(grouped).map(([cat, catDocs]) => {
              const color = CAT_COLORS[cat] || '#71717a'
              return (
                <div key={cat}>
                  {/* Cabecera categoría */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ color: '#a1a1aa', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {cat}
                    </span>
                    <span style={{ color: '#3f3f46', fontSize: 11 }}>({catDocs.length})</span>
                  </div>

                  {/* Docs de esta categoría */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 20 }}>
                    {catDocs.map(d => (
                      <div key={d.id as number} style={{
                        background: '#18181b',
                        border: `1px solid ${d.active ? '#27272a' : '#1a1a1d'}`,
                        borderLeft: `3px solid ${d.active ? color : '#27272a'}`,
                        borderRadius: 10, padding: '14px 16px',
                        opacity: d.active ? 1 : 0.5,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                              {d.title as string}
                            </p>
                            <p style={{ color: '#71717a', fontSize: 12, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {d.content as string}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            {/* Toggle activo/inactivo */}
                            <button onClick={() => handleToggle(d.id as number)}
                              title={d.active ? 'Desactivar' : 'Activar'}
                              style={{ padding: '5px 8px', background: 'transparent', border: '1px solid #27272a', borderRadius: 6, color: d.active ? '#22c55e' : '#52525b', cursor: 'pointer', display: 'flex' }}>
                              {d.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            </button>
                            <button onClick={() => openEdit(d)}
                              style={{ padding: '5px 8px', background: 'transparent', border: '1px solid #27272a', borderRadius: 6, color: '#71717a', cursor: 'pointer', display: 'flex' }}>
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setDeleting(d)}
                              style={{ padding: '5px 8px', background: 'transparent', border: '1px solid #27272a', borderRadius: 6, color: '#f87171', cursor: 'pointer', display: 'flex' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Modal crear/editar ── */}
        {modal && (
          <div style={overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>
                  {modal === 'create' ? '➕ Agregar información' : '✏️ Editar información'}
                </h3>
                <button onClick={() => setModal(null)}
                  style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Categoría */}
                <div>
                  <label style={{ display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>
                    Categoría *
                  </label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputSt}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <p style={{ color: '#52525b', fontSize: 11, marginTop: 4 }}>
                    La categoría ayuda al bot a encontrar la información correcta más rápido
                  </p>
                </div>

                {/* Título */}
                <div>
                  <label style={{ display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>
                    Título *
                  </label>
                  <input value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="ej: Propuesta de seguridad en Medellín"
                    style={inputSt} />
                </div>

                {/* Contenido */}
                <div>
                  <label style={{ display: 'block', color: '#a1a1aa', fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>
                    Contenido *
                  </label>
                  <textarea value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Escribe aquí la información que el bot debe saber y usar al responder preguntas sobre este tema..."
                    rows={8}
                    style={{ ...inputSt, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }} />
                  <p style={{ color: '#52525b', fontSize: 11, marginTop: 4 }}>
                    {form.content.length} caracteres · Escribe información clara y completa
                  </p>
                </div>

                {/* Activo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                    style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: form.active ? '#22c55e' : '#3f3f46', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: 2, left: form.active ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                  </button>
                  <span style={{ color: form.active ? '#a1a1aa' : '#52525b', fontSize: 13 }}>
                    {form.active ? 'Activo — el bot usará esta información' : 'Inactivo — el bot no lo usará'}
                  </span>
                </div>

                {error && (
                  <div style={{ background: '#3f1212', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModal(null)}
                    style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa', fontSize: 13, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9, border: 'none', background: '#CE1126', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    <Check size={14} />
                    {saving ? 'Guardando...' : modal === 'create' ? 'Guardar' : 'Actualizar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirm delete ── */}
        {deleting && (
          <div style={overlay} onClick={e => e.target === e.currentTarget && setDeleting(null)}>
            <div style={{ ...card, maxWidth: 400, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>¿Eliminar este documento?</h3>
              <p style={{ color: '#71717a', fontSize: 13, marginBottom: 8 }}>
                <strong style={{ color: '#a1a1aa' }}>{deleting.title as string}</strong>
              </p>
              <p style={{ color: '#52525b', fontSize: 12, marginBottom: 24 }}>
                El bot dejará de usar esta información inmediatamente.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleting(null)}
                  style={{ flex: 1, padding: '9px', borderRadius: 9, border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa', fontSize: 13, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleDelete}
                  style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}