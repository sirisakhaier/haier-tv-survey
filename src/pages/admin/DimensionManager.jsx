import { useState, useRef, useMemo } from 'react'
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
  const { stores, models, locations, chains, refreshFromApi } = useData()
  const [activeTab, setActiveTab] = useState('store')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef(null)

  const rawData = activeTab === 'store' ? stores : activeTab === 'model' ? models : locations
  const data = Array.isArray(rawData) ? rawData : []

  // Chain status map helper
  const chainStatusMap = useMemo(() => {
    const map = new Map()
    if (Array.isArray(chains)) {
      for (const c of chains) map.set(c.hang, c.status)
    }
    return map
  }, [chains])

  // Get list of all unique hangs (ห้าง) with branch counts
  const chainList = useMemo(() => {
    const hangMap = new Map()
    if (Array.isArray(stores)) {
      for (const s of stores) {
        const count = hangMap.get(s.hang) || 0
        hangMap.set(s.hang, count + 1)
      }
    }
    const result = []
    for (const [hang, count] of hangMap.entries()) {
      const status = chainStatusMap.get(hang) || 'active'
      result.push({ hang, count, status })
    }
    return result.sort((a, b) => a.hang.localeCompare(b.hang, 'th'))
  }, [stores, chainStatusMap])

  // Filter logic for data table
  const filtered = data.filter(r => {
    if (!search.trim()) return true
    return Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleTabChange = (t) => { setActiveTab(t); setPage(1); setSearch('') }

  // Toggle Retail Chain (ห้าง) status handler
  const handleToggleChainStatus = async (hang, currentStatus) => {
    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive'
    try {
      const res = await fetch('/api/admin/dimension/chain/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hang, status: nextStatus }),
      })
      if (!res.ok) throw new Error('Status update failed')
      toast.success(nextStatus === 'active' ? `🟢 เปิดใช้งาน "${hang}" เรียบร้อย` : `🔴 ปิดใช้งาน "${hang}" เรียบร้อย`)
      await refreshFromApi()
    } catch {
      toast.error('ไม่สามารถเปลี่ยนสถานะห้างได้')
    }
  }

  // CSV Import (Replaces whole catalog)
  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const confirmMsg = `⚠️ คำเตือน: การนำเข้า CSV จะลบข้อมูล ${activeTab === 'store' ? 'ห้าง/สาขา' : activeTab === 'model' ? 'รุ่นทีวี' : 'ตำแหน่ง'} เดิมทั้งหมด แล้วแทนที่ด้วยข้อมูลในไฟล์นี้ทั้งชุด\n\nต้องการดำเนินการต่อหรือไม่?`
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
    if (activeTab === 'store') return ['store_id', 'hang', 'phumipak', 'changwat', 'sakha', 'store_name']
    if (activeTab === 'model') return ['model_code', 'category', 'sub_category', 'size']
    return ['code', 'label_th', 'label_en']
  }
  const getPK = (row) => row.store_id || row.model_code || row.code

  const cols = getColumns()

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dimension Manager</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>จัดการข้อมูลอ้างอิง — ตั้งค่า Active/Inactive รายห้าง & นำเข้าไฟล์ CSV</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} className={`tab-btn${activeTab === t.key ? ' active' : ''}`} onClick={() => handleTabChange(t.key)}>
            {t.label} <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7 }}>{t.labelTh}</span>
          </button>
        ))}
      </div>

      {/* Retail Chain (ห้าง) Active/Inactive Status Setting Card */}
      {activeTab === 'store' && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid var(--border-blue)', background: 'var(--haier-blue-pale)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-blue)' }}>
            <span>🏢</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--haier-blue)', fontSize: '1rem' }}>
                จัดการสถานะเปิด/ปิดใช้งาน รายห้าง (Chain Active / Inactive Status)
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                ตั้งค่าเปิด (Active) หรือปิด (Inactive) สำหรับแต่ละห้าง — หากปิดใช้งาน ห้างนั้นและสาขาทั้งหมดจะไม่ปรากฏในหน้าแบบสำรวจ
              </div>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {chainList.map(c => {
                const isActive = c.status !== 'inactive'
                return (
                  <div
                    key={c.hang}
                    style={{
                      background: '#fff',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${isActive ? '#C6F6D5' : '#FED7D7'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {c.hang}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {c.count} สาขา
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn--sm"
                      style={{
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        borderRadius: 14,
                        fontWeight: 700,
                        background: isActive ? '#C6F6D5' : '#FED7D7',
                        color: isActive ? '#22543D' : '#9B2C2C',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => handleToggleChainStatus(c.hang, c.status)}
                      title={`คลิกเพื่อเปลี่ยนสถานะของ ${c.hang}`}
                    >
                      {isActive ? '🟢 Active' : '🔴 Inactive'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
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
        💡 <strong>หมายเหตุ:</strong> การกด <strong>Import CSV</strong> จะลบข้อมูล {activeTab === 'store' ? 'ห้าง/สาขา' : activeTab === 'model' ? 'รุ่นทีวี' : 'ตำแหน่ง'} เดิมทั้งหมด แล้วแทนที่ด้วยข้อมูลใหม่ในไฟล์ทั้งชุด
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
              {activeTab === 'store' && <th>สถานะห้าง</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={cols.length + 2}><div className="empty-state"><div className="empty-state__icon">🔍</div><div className="empty-state__text">ไม่พบข้อมูล</div></div></td></tr>
            ) : paginated.map((row, i) => {
              const pk = getPK(row)
              const chainStatus = activeTab === 'store' ? (chainStatusMap.get(row.hang) || 'active') : 'active'
              const isChainInactive = chainStatus === 'inactive'

              return (
                <tr key={pk || i} style={{ opacity: isChainInactive ? 0.6 : 1, background: isChainInactive ? '#FFF5F5' : undefined }}>
                  {cols.map(c => (
                    <td key={c} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row[c] ?? ''}
                    </td>
                  ))}
                  {activeTab === 'store' && (
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontWeight: 700,
                          background: isChainInactive ? '#FED7D7' : '#C6F6D5',
                          color: isChainInactive ? '#9B2C2C' : '#22543D',
                        }}
                      >
                        {isChainInactive ? '🔴 ห้างปิดใช้งาน' : '🟢 ห้างเปิดใช้งาน'}
                      </span>
                    </td>
                  )}
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
