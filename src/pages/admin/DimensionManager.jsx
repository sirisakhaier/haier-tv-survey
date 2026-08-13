import { useState, useRef } from 'react'
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
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'inactive'
  const [page, setPage] = useState(1)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef(null)

  const rawData = activeTab === 'store' ? stores : activeTab === 'model' ? models : locations
  const data = Array.isArray(rawData) ? rawData : []

  // Filter logic including search + status filter
  const filtered = data.filter(r => {
    if (activeTab === 'store' && statusFilter !== 'all') {
      const st = r.status || 'active'
      if (st !== statusFilter) return false
    }
    if (!search.trim()) return true
    return Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleTabChange = (t) => { setActiveTab(t); setPage(1); setSearch(''); setStatusFilter('all') }

  // Store status toggle handler
  const handleToggleStoreStatus = async (storeId, currentStatus) => {
    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive'
    try {
      const res = await fetch('/api/admin/dimension/store/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId, status: nextStatus }),
      })
      if (!res.ok) throw new Error('Status update failed')
      toast.success(nextStatus === 'active' ? `🟢 เปิดใช้งาน ${storeId} เรียบร้อย` : `🔴 ปิดใช้งาน ${storeId} เรียบร้อย`)
      await refreshFromApi()
    } catch {
      toast.error('ไม่สามารถเปลี่ยนสถานะได้')
    }
  }

  // CSV Import (Replaces whole catalog)
  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const confirmMsg = `⚠️ คำเตือน: การนำเข้า CSV จะลบข้อมูล ${activeTab === 'store' ? 'ห้าง/สาขา' : activeTab === 'model' ? 'รุ่นทีวี' : 'ตำแหน่ง'} เดิมทั้งหมด และแทนที่ด้วยข้อมูลในไฟล์นี้ทั้งชุด\n\nต้องการดำเนินการต่อหรือไม่?`
    if (!confirm(confirmMsg)) {
      if (fileRef.current) fileRef.current.value = ''
      return
    }

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
          toast.success(`นำเข้าสำเร็จ ${json.imported} รายการ (ทดแทนข้อมูลเดิมเรียบร้อย)`)
          await refreshFromApi()
        } catch (err) {
          toast.error(`Import ล้มเหลว: ${err.message}`)
        } finally {
          setImporting(false)
          if (fileRef.current) fileRef.current.value = ''
        }
      },
      error: () => { toast.error('ไม่สามารถอ่านไฟล์ CSV'); setImporting(false) }
    })
  }

  // CSV Export
  const handleExport = () => {
    const csv = Papa.unparse(data)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
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

  const getColumns = () => {
    if (activeTab === 'store') return ['store_id', 'hang', 'phumipak', 'changwat', 'sakha', 'store_name', 'status']
    if (activeTab === 'model') return ['model_code', 'category', 'sub_category', 'size']
    return ['code', 'label_th', 'label_en']
  }
  const getPK = (row) => row.store_id || row.model_code || row.code

  const cols = getColumns()

  // Counts for store status
  const activeCount = stores.filter(s => (s.status || 'active') === 'active').length
  const inactiveCount = stores.filter(s => s.status === 'inactive').length

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dimension Manager</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>จัดการข้อมูลอ้างอิง — ห้าง / รุ่น / ตำแหน่ง (พร้อมตั้งค่า Active/Inactive)</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} className={`tab-btn${activeTab === t.key ? ' active' : ''}`} onClick={() => handleTabChange(t.key)}>
            {t.label} <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7 }}>{t.labelTh}</span>
          </button>
        ))}
      </div>

      {/* Store status filter bar */}
      {activeTab === 'store' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>สถานะร้านค้า:</span>
          <button
            className={`btn btn--sm ${statusFilter === 'all' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => { setStatusFilter('all'); setPage(1) }}
          >
            ทั้งหมด ({data.length})
          </button>
          <button
            className={`btn btn--sm ${statusFilter === 'active' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => { setStatusFilter('active'); setPage(1) }}
            style={{ color: statusFilter === 'active' ? '#fff' : 'var(--accent-green)' }}
          >
            🟢 Active ใช้งานอยู่ ({activeCount})
          </button>
          <button
            className={`btn btn--sm ${statusFilter === 'inactive' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => { setStatusFilter('inactive'); setPage(1) }}
            style={{ color: statusFilter === 'inactive' ? '#fff' : 'var(--accent-red)' }}
          >
            🔴 Inactive ปิดใช้งาน ({inactiveCount})
          </button>
        </div>
      )}

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
        <button className="btn btn--primary btn--sm" onClick={() => fileRef.current?.click()} disabled={importing} title="นำเข้า CSV ทั้งหมด (ลบของเดิมแล้วแทนที่)">
          {importing ? <><div className="spinner" />Importing...</> : '⬆ Import CSV (แทนที่ทั้งหมด)'}
        </button>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      {/* Notice about CSV Replace mode */}
      <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.78rem', color: '#92400E', marginBottom: 12 }}>
        💡 <strong>หมายเหตุ:</strong> การกด <strong>Import CSV</strong> จะลบข้อมูล {activeTab === 'store' ? 'ห้าง/สาขา' : activeTab === 'model' ? 'รุ่นทีวี' : 'ตำแหน่ง'} เดิมทั้งหมด และแทนที่ด้วยข้อมูลใหม่ในไฟล์ทั้งชุด
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
              {cols.map(c => <th key={c}>{c === 'status' ? 'สถานะ (Status)' : c}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={cols.length + 1}><div className="empty-state"><div className="empty-state__icon">🔍</div><div className="empty-state__text">ไม่พบข้อมูล</div></div></td></tr>
            ) : paginated.map((row, i) => {
              const pk = getPK(row)
              const isInactive = (row.status || 'active') === 'inactive'

              return (
                <tr key={pk || i} style={{ opacity: isInactive ? 0.6 : 1, background: isInactive ? '#FFF5F5' : undefined }}>
                  {cols.map(c => {
                    if (c === 'status' && activeTab === 'store') {
                      return (
                        <td key={c}>
                          <button
                            type="button"
                            className="btn btn--sm"
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 10px',
                              borderRadius: 12,
                              fontWeight: 700,
                              background: isInactive ? '#FED7D7' : '#C6F6D5',
                              color: isInactive ? '#9B2C2C' : '#22543D',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleToggleStoreStatus(row.store_id, row.status || 'active')}
                            title="คลิกเพื่อเปลี่ยนสถานะ (Active ↔ Inactive)"
                          >
                            {isInactive ? '🔴 Inactive (ปิด)' : '🟢 Active (ใช้งาน)'}
                          </button>
                        </td>
                      )
                    }
                    return (
                      <td key={c} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row[c] ?? ''}
                      </td>
                    )
                  })}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn--ghost btn--sm" style={{ color: 'var(--accent-red)', padding: '4px 8px' }} onClick={() => handleDelete(pk)}>🗑</button>
                  </td>
                </tr>
              )
            })}
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
