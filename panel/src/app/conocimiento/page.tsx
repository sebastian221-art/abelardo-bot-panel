'use client'
// 📄 panel/src/app/conocimiento/page.tsx  ← REEMPLAZA EL ANTERIOR
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { BookOpen, Plus, Trash2, Edit2, Save, X, RefreshCw, Globe, FileText, Zap, ExternalLink } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Doc = {
  id:         number
  title:      string
  category:   string
  content:    string
  source:     string
  active:     boolean
  created_at: string
  updated_at: string | null
}

const CATEGORIES = [
  'general','propuestas','seguridad','economia','salud',
  'educacion','paz','biografia','debates','corrupcion',
]

const CATEGORY_COLORS: Record<string,string> = {
  general:'#6366f1', propuestas:'#CE1126', seguridad:'#ef4444',
  economia:'#f59e0b', salud:'#10b981', educacion:'#0ea5e9',
  paz:'#22c55e', biografia:'#a855f7', debates:'#f97316', corrupcion:'#f43f5e',
}

const DEFAULT_URLS = [
  'https://defensoresdelapatria.com',
  'https://defensoresdelapatria.com/propuestas',
  'https://defensoresdelapatria.com/plan-de-gobierno',
]

const inputSt: React.CSSProperties = {
  width:'100%', padding:'10px 12px', background:'#09090b',
  border:'1px solid #27272a', borderRadius:8, color:'#fff',
  fontSize:13, outline:'none', boxSizing:'border-box',
}

export default function ConocimientoPage() {
  const [docs,        setDocs]        = useState<Doc[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [editingId,   setEditingId]   = useState<number | null>(null)
  const [scraping,    setScraping]    = useState(false)
  const [scrapeUrl,   setScrapeUrl]   = useState('')
  const [scrapeMsg,   setScrapeMsg]   = useState('')
  const [showScraper, setShowScraper] = useState(false)

  // Formulario
  const [title,    setTitle]    = useState('')
  const [category, setCategory] = useState('general')
  const [content,  setContent]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState('')

  function getToken() { return localStorage.getItem('token') }

  async function loadDocs() {
    setLoading(true)
    try {
      const res  = await fetch(`${API}/knowledge/`, { headers: { Authorization: `Bearer ${getToken()}` } })
      const data = await res.json()
      setDocs(data as Doc[])
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { loadDocs() }, [])

  function resetForm() {
    setTitle(''); setCategory('general'); setContent(''); setFormErr(''); setEditingId(null)
  }

  function startEdit(doc: Doc) {
    setTitle(doc.title); setCategory(doc.category); setContent(doc.content)
    setEditingId(doc.id); setShowForm(true); setFormErr('')
  }

  async function handleSave() {
    setFormErr('')
    if (!title.trim())   return setFormErr('El título es obligatorio')
    if (!content.trim()) return setFormErr('El contenido es obligatorio')
    setSaving(true)
    try {
      const url    = editingId ? `${API}/knowledge/${editingId}` : `${API}/knowledge/`
      const method = editingId ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` },
        body: JSON.stringify({ title, category, content }),
      })
      if (!res.ok) return setFormErr('Error al guardar')
      setShowForm(false); resetForm(); loadDocs()
    } catch { setFormErr('Error de conexión') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number, docTitle: string) {
    if (!confirm(`¿Eliminar "${docTitle}"?`)) return
    await fetch(`${API}/knowledge/${id}`, {
      method:'DELETE', headers: { Authorization:`Bearer ${getToken()}` },
    })
    loadDocs()
  }

  async function handleToggle(id: number, active: boolean) {
    await fetch(`${API}/knowledge/${id}`, {
      method:'PUT',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` },
      body: JSON.stringify({ active: !active }),
    })
    loadDocs()
  }

  async function handleScrape(url: string) {
    setScraping(true); setScrapeMsg('')
    try {
      const res  = await fetch(`${API}/knowledge/scrape`, {
        method:'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` },
        body: JSON.stringify({ url }),
      })
      const data = await res.json() as { ok: boolean; message: string; chars?: number }
      if (data.ok) {
        setScrapeMsg(`✅ ${data.message}${data.chars ? ` (${data.chars.toLocaleString()} caracteres)` : ''}`)
        loadDocs()
      } else {
        setScrapeMsg(`❌ ${data.message}`)
      }
    } catch { setScrapeMsg('❌ Error de conexión') }
    setScraping(false)
  }

  async function handleLoadDefaults() {
    setScraping(true); setScrapeMsg('Cargando datos oficiales de Abelardo...')
    try {
      const res  = await fetch(`${API}/knowledge/load-defaults`, {
        method:'POST', headers: { Authorization:`Bearer ${getToken()}` },
      })
      const data = await res.json() as { ok: boolean; created: number }
      setScrapeMsg(`✅ ${data.created} documentos cargados correctamente`)
      loadDocs()
    } catch { setScrapeMsg('❌ Error al cargar datos') }
    setScraping(false)
  }

  // Stats
  const totalChars   = docs.filter(d => d.active).reduce((a, d) => a + d.content.length, 0)
  const activeDocs   = docs.filter(d => d.active).length
  const webDocs      = docs.filter(d => d.source === 'web_scrape').length
  const manualDocs   = docs.filter(d => d.source === 'manual').length

  return (
    <Layout>
      <div style={{ padding:32, maxWidth:1000 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <BookOpen size={22} style={{ color:'#FCD116' }}/>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>Base de Conocimiento</h1>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={loadDocs}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:12, cursor:'pointer' }}>
              <RefreshCw size={13}/>
            </button>
            <button onClick={() => setShowScraper(!showScraper)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #0ea5e944', background:'#0ea5e911', color:'#0ea5e9', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <Globe size={13}/> Importar web
            </button>
            <button onClick={() => { resetForm(); setShowForm(true) }}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background:'#FCD116', color:'#09090b', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              <Plus size={13}/> Agregar documento
            </button>
          </div>
        </div>
        <p style={{ color:'#71717a', fontSize:13, marginBottom:24 }}>
          Todo lo que el bot sabe sobre Abelardo. Más documentos = respuestas más precisas.
        </p>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'Documentos activos', val: activeDocs,                    color:'#22c55e' },
            { label:'Desde web',          val: webDocs,                       color:'#0ea5e9' },
            { label:'Manuales',           val: manualDocs,                    color:'#6366f1' },
            { label:'Caracteres totales', val: totalChars.toLocaleString(),   color:'#FCD116' },
          ].map(s => (
            <div key={s.label} style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:12, padding:'14px 16px' }}>
              <p style={{ color:'#52525b', fontSize:10, textTransform:'uppercase', marginBottom:6 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize:20, fontWeight:700 }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Panel scraping */}
        {showScraper && (
          <div style={{ background:'#0a1628', border:'1px solid #0ea5e933', borderRadius:14, padding:20, marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <Globe size={16} style={{ color:'#0ea5e9' }}/>
              <p style={{ color:'#0ea5e9', fontWeight:600, fontSize:14 }}>Importar desde página web</p>
            </div>

            {/* URLs predefinidas */}
            <p style={{ color:'#52525b', fontSize:11, textTransform:'uppercase', marginBottom:8 }}>Páginas oficiales:</p>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
              {DEFAULT_URLS.map(url => (
                <div key={url} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ color:'#a1a1aa', fontSize:12, fontFamily:'monospace', flex:1 }}>{url}</span>
                  <a href={url} target="_blank" rel="noreferrer"
                    style={{ color:'#52525b', cursor:'pointer' }}>
                    <ExternalLink size={12}/>
                  </a>
                  <button onClick={() => handleScrape(url)} disabled={scraping}
                    style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #0ea5e944', background:'transparent', color:'#0ea5e9', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                    {scraping ? '...' : 'Importar'}
                  </button>
                </div>
              ))}
            </div>

            {/* URL personalizada */}
            <p style={{ color:'#52525b', fontSize:11, textTransform:'uppercase', marginBottom:8 }}>URL personalizada:</p>
            <div style={{ display:'flex', gap:10 }}>
              <input value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)}
                placeholder="https://ejemplo.com/pagina-de-abelardo"
                style={{ ...inputSt, flex:1 }}/>
              <button onClick={() => handleScrape(scrapeUrl)} disabled={scraping || !scrapeUrl.trim()}
                style={{ padding:'10px 16px', borderRadius:8, border:'none', background:'#0ea5e9', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', flexShrink:0 }}>
                {scraping ? 'Importando...' : 'Importar'}
              </button>
            </div>

            {scrapeMsg && (
              <p style={{ color: scrapeMsg.startsWith('✅') ? '#86efac' : '#fca5a5', fontSize:13, marginTop:10 }}>
                {scrapeMsg}
              </p>
            )}

            {/* Botón cargar datos por defecto */}
            <div style={{ borderTop:'1px solid #0ea5e922', marginTop:16, paddingTop:16 }}>
              <button onClick={handleLoadDefaults} disabled={scraping}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:8, border:'none', background:'#FCD116', color:'#09090b', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                <Zap size={14}/> {scraping ? 'Cargando...' : 'Cargar datos oficiales de Abelardo (recomendado)'}
              </button>
              <p style={{ color:'#52525b', fontSize:11, marginTop:6 }}>
                Carga automáticamente propuestas, biografía, plan de gobierno y más desde las fuentes oficiales
              </p>
            </div>
          </div>
        )}

        {/* Lista de documentos */}
        {loading ? (
          <p style={{ color:'#52525b', textAlign:'center', padding:48 }}>Cargando...</p>
        ) : docs.length === 0 ? (
          <div style={{ textAlign:'center', padding:64, background:'#18181b', borderRadius:14, border:'1px solid #27272a' }}>
            <BookOpen size={40} style={{ color:'#27272a', margin:'0 auto 12px', display:'block' }}/>
            <p style={{ color:'#52525b', fontSize:14 }}>Sin documentos. Agrega el primero o importa desde web.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {docs.map(doc => {
              const catColor = CATEGORY_COLORS[doc.category] || '#6366f1'
              const isWeb    = doc.source === 'web_scrape'
              return (
                <div key={doc.id} style={{
                  background:'#18181b', border:`1px solid ${doc.active ? '#27272a' : '#1a1a1d'}`,
                  borderRadius:12, padding:'16px 18px',
                  opacity: doc.active ? 1 : 0.5,
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                        <h3 style={{ color:'#fff', fontSize:14, fontWeight:600 }}>{doc.title}</h3>
                        <span style={{ background: catColor+'22', color: catColor, border:`1px solid ${catColor}44`, borderRadius:5, padding:'1px 8px', fontSize:10, fontWeight:600 }}>
                          {doc.category}
                        </span>
                        {isWeb && (
                          <span style={{ background:'#0ea5e922', color:'#0ea5e9', border:'1px solid #0ea5e944', borderRadius:5, padding:'1px 8px', fontSize:10, fontWeight:600 }}>
                            🌐 Web
                          </span>
                        )}
                        {!doc.active && (
                          <span style={{ background:'#27272a', color:'#52525b', borderRadius:5, padding:'1px 8px', fontSize:10 }}>
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p style={{ color:'#71717a', fontSize:12, lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:600 }}>
                        {doc.content}
                      </p>
                      <div style={{ display:'flex', gap:12, marginTop:6 }}>
                        <span style={{ color:'#3f3f46', fontSize:10 }}>
                          {doc.content.length.toLocaleString()} caracteres
                        </span>
                        <span style={{ color:'#3f3f46', fontSize:10 }}>
                          {new Date(doc.created_at).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display:'flex', gap:6, marginLeft:12, flexShrink:0 }}>
                      <button onClick={() => handleToggle(doc.id, doc.active)}
                        style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #27272a', background:'transparent', color: doc.active ? '#22c55e' : '#52525b', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                        {doc.active ? '✅ Activo' : '○ Inactivo'}
                      </button>
                      {!isWeb && (
                        <button onClick={() => startEdit(doc)}
                          style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                          <Edit2 size={11}/> Editar
                        </button>
                      )}
                      <button onClick={() => handleDelete(doc.id, doc.title)}
                        style={{ padding:'5px 8px', borderRadius:7, border:'1px solid #27272a', background:'transparent', color:'#f87171', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center' }}>
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:16, padding:28, width:580, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <h2 style={{ color:'#fff', fontSize:16, fontWeight:700 }}>
                {editingId ? 'Editar documento' : 'Nuevo documento'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm() }} style={{ background:'transparent', border:'none', color:'#71717a', cursor:'pointer' }}>
                <X size={18}/>
              </button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>Título *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="ej: Propuesta de Seguridad" style={inputSt}/>
              </div>

              <div>
                <label style={{ display:'block', color:'#a1a1aa', fontSize:11, fontWeight:600, marginBottom:8, textTransform:'uppercase' }}>Categoría</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)}
                      style={{
                        padding:'5px 12px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer',
                        border:`1px solid ${category === c ? (CATEGORY_COLORS[c] || '#6366f1') : '#27272a'}`,
                        background: category === c ? (CATEGORY_COLORS[c] || '#6366f1') + '22' : 'transparent',
                        color: category === c ? (CATEGORY_COLORS[c] || '#6366f1') : '#71717a',
                      }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <label style={{ color:'#a1a1aa', fontSize:11, fontWeight:600, textTransform:'uppercase' }}>Contenido *</label>
                  <span style={{ color:'#52525b', fontSize:11 }}>{content.length.toLocaleString()} caracteres</span>
                </div>
                <textarea value={content} onChange={e => setContent(e.target.value)}
                  placeholder="Pega aquí el texto sobre Abelardo: propuestas, discursos, entrevistas, plan de gobierno..."
                  rows={10}
                  style={{ ...inputSt, resize:'vertical', fontFamily:'inherit', lineHeight:1.6 }}/>
                <p style={{ color:'#52525b', fontSize:11, marginTop:4 }}>
                  Mientras más texto detallado, mejor responderá el bot
                </p>
              </div>

              {formErr && (
                <p style={{ color:'#fca5a5', fontSize:12, background:'#3f1212', padding:'8px 12px', borderRadius:7 }}>{formErr}</p>
              )}

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => { setShowForm(false); resetForm() }}
                  style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:13, cursor:'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background:'#FCD116', color:'#09090b', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <Save size={14}/> {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar documento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}