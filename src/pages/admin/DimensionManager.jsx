import { useState, useRef, useEffect, useCallback } from 'react'
import Papa from 'papaparse'
import { useData } from '../../context/DataContext'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'store', label: '🏪 Store', labelTh: 'ห้าง/สาขา' },
  { key: 'model', label: '📺 Model', labelTh: 'รุ่นทีวี' },
  { key: 'location', label: '📍 Location', labelTh: 'ตำแหน่ง' },
]

const PAGE_SIZE = 25

export default function DimensionManager() {
  const { stores, models, locations, refreshFromApi } = useData()
  const [activeTab, setActiveTab] = useState('store')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [importing, setImporting] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const fileRef = useRef(null)

  const data = activeTab === 'store' ? stores : activeTab === 'model' ? models : locations

  const filtered = data.filter(r => {
    if (!search.trim()) return true
    return Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleTabChange = (t) => { setActiveTab(t); setPage(1); setSearch('') }

  // CSV Import
  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch(`/api/admin/import/${activeTab}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: results.data }),
          })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || 'Import failed')
          toast.success(`นำเข้าสำเร็จ ${json.imported} รายการ`)
          await refreshFromApi()
        } catch (err) {
          toast.error(`Import ล้มเหลว: ${err.message}`)
        } finally {
          setImporting(false)
          if (fileRef.current) fileRef.current.value = ''
        }
      },
      error: (err) => { toast.error('ไม่สามารถอ่านไฟล์ CSV'); setImporting(false) }
    })
  }

  // CSV Export
  const handleExport = () => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `haier_${activeTab}_dimension_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('ดาวน์โหลด CSV สำเร็จ')
  }

  // Delete row
  const handleDelete = async (pk) => {
    if (!confirm('ยืนยันการลบรายการนี้?')) return
    try {
      const res = await fetch(`/api/admin/dimension/${activeTab}/${encodeURIComponent(pk)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('ลบสำเร็จ')
      await refreshFromApi()
    } catch { toast.error('ไม่สามารถลบได้') }
  }

  // Column renderers
  const getColumns = () => {
    if (activeTab === 'store') return ['store_id','hang','phumipak','changwat','sakha','store_name']
    if (activeTab === 'model') return ['model_code','category','sub_category','size']
    return ['code','label_th','label_en']
  }
  const getPK = (row) => row.store_id || row.model_code || row.code

  const cols = getColumns()

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dimension Manager</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>จัดการข้อมูลอ้างอิง — ห้าง / รุ่น / ตำแหน่ง</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} className={`tab-btn${activeTab === t.key ? ' active' : ''}`} onClick={() => handleTabChange(t.key)}>
            {t.label} <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7 }}>{t.labelTh}</span>
          </button>
        ))}
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            className="form-input"
            style={{ paddingLeft: 40 }}
            placeholder="ค้นหา..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <button className="btn btn--secondary btn--sm" onClick={handleExport}>⬇ Export CSV</button>
        <button className="btn btn--primary btn--sm" onClick={() => fileRef.current?.click()} disabled={importing}>
          {importing ? <><div className="spinner" />Importing...</> : '⬆ Import CSV'}
        </button>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      {/* Count */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>
        แสดง {paginated.length} จาก {filtered.length} รายการ (ทั้งหมด {data.length} รายการ)
      </div>

      {/* Table */}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {cols.map(c => <th key={c}>{c}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={cols.length + 1}><div className="empty-state"><div className="empty-state__icon">🔍</div><div className="empty-state__text">ไม่พบข้อมูล</div></div></td></tr>
            ) : paginated.map((row, i) => (
              <tr key={getPK(row) || i}>
                {cols.map(c => <td key={c} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[c] ?? ''}</td>)}
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn--ghost btn--sm" style={{ color: 'var(--accent-red)', padding: '4px 8px' }} onClick={() => handleDelete(getPK(row))}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
            return pg <= totalPages ? (
              <button key={pg} className={`page-btn${pg === page ? ' active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>
            ) : null
          })}
          <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
        </div>
      )}
    </div>
  )
}
