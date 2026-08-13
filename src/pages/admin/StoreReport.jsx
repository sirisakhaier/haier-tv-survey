import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'
import toast from 'react-hot-toast'

const PAGE_SIZE = 25

export default function StoreReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [hangFilter, setHangFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'surveyed' | 'pending'
  const [page, setPage] = useState(1)

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/store-report')
      const json = await res.json()
      if (Array.isArray(json)) {
        setData(json)
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลรายงานได้')
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  // Unique Hangs & Regions for dropdown filters
  const hangs = useMemo(() => [...new Set(data.map(d => d.hang).filter(Boolean))].sort(), [data])
  const regions = useMemo(() => [...new Set(data.map(d => d.phumipak).filter(Boolean))].sort(), [data])

  // Filtered dataset
  const filtered = useMemo(() => {
    return data.filter(r => {
      // Hang filter
      if (hangFilter !== 'all' && r.hang !== hangFilter) return false
      // Region filter
      if (regionFilter !== 'all' && r.phumipak !== regionFilter) return false
      // Survey status filter
      const isSurveyed = (r.submission_count || 0) > 0
      if (statusFilter === 'surveyed' && !isSurveyed) return false
      if (statusFilter === 'pending' && isSurveyed) return false

      // Search query
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        String(r.store_id || '').toLowerCase().includes(q) ||
        String(r.sakha || '').toLowerCase().includes(q) ||
        String(r.store_name || '').toLowerCase().includes(q) ||
        String(r.changwat || '').toLowerCase().includes(q) ||
        String(r.latest_respondent || '').toLowerCase().includes(q)
      )
    })
  }, [data, search, hangFilter, regionFilter, statusFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  }, [filtered, page])

  // Overall Statistics
  const totalStores = data.length
  const surveyedStores = data.filter(d => (d.submission_count || 0) > 0).length
  const pendingStores = totalStores - surveyedStores
  const totalTvs = data.reduce((sum, d) => sum + (d.total_tvs_displayed || 0), 0)
  const surveyedPct = totalStores > 0 ? ((surveyedStores / totalStores) * 100).toFixed(1) : '0'

  // CSV Export
  const handleExportCSV = () => {
    const exportRows = filtered.map(r => ({
      'Store ID': r.store_id,
      'ห้าง (Retail Chain)': r.hang,
      'ภูมิภาค (Region)': r.phumipak,
      'จังหวัด (Province)': r.changwat || '-',
      'สาขา (Branch)': r.sakha || '-',
      'ชื่อร้านค้า (Store Name)': r.store_name || '-',
      'สถานะการสำรวจ': (r.submission_count || 0) > 0 ? 'สำรวจแล้ว' : 'ยังไม่ได้สำรวจ',
      'จำนวนครั้งที่สำรวจ': r.submission_count || 0,
      'จำนวนทีวีที่จัดแสดง (เครื่อง)': r.total_tvs_displayed || 0,
      'ผู้ส่งแบบสำรวจล่าสุด': r.latest_respondent || '-',
      'วันที่สำรวจล่าสุด': r.latest_submitted_at ? new Date(r.latest_submitted_at).toLocaleString('th-TH') : '-',
    }))

    const csv = Papa.unparse(exportRows)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `haier_store_summary_report_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('ดาวน์โหลดรายงาน CSV สำเร็จ')
  }

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: 40, textAlign: 'center' }}>
        <div className="spinner spinner--blue" style={{ width: 36, height: 36, margin: '0 auto 12px' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>กำลังประมวลผลรายงานสรุปตามร้านค้า...</div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Store Summary Report</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            รายงานสรุปผลการเข้าสำรวจแยกตามห้างและร้านค้าสาขา (Store Level Aggregation)
          </p>
        </div>
        <button className="btn btn--primary btn--sm" onClick={handleExportCSV}>
          ⬇ Export Store Report (CSV)
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card" style={{ '--kpi-color': 'var(--haier-blue)' }}>
          <div className="kpi-label">🏪 สาขาทั้งหมดในระบบ</div>
          <div className="kpi-value">{totalStores.toLocaleString()}</div>
          <div className="kpi-sub">จำนวนสาขาตามมิติข้อมูลทั้งหมด</div>
          <div className="kpi-icon">🏬</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': 'var(--accent-green)' }}>
          <div className="kpi-label">✅ สาขาที่สำรวจแล้ว</div>
          <div className="kpi-value" style={{ color: 'var(--accent-green)' }}>{surveyedStores.toLocaleString()}</div>
          <div className="kpi-sub">คิดเป็น {surveyedPct}% ของสาขา ทั้งหมด</div>
          <div className="kpi-icon">✅</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': '#ED8936' }}>
          <div className="kpi-label">⏳ สาขาที่ยังไม่ได้สำรวจ</div>
          <div className="kpi-value" style={{ color: '#ED8936' }}>{pendingStores.toLocaleString()}</div>
          <div className="kpi-sub">รอการเข้าสำรวจโดยทีมขาย</div>
          <div className="kpi-icon">⏳</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': '#9F7AEA' }}>
          <div className="kpi-label">📺 รวมทีวีที่จัดแสดง</div>
          <div className="kpi-value" style={{ color: '#9F7AEA' }}>{totalTvs.toLocaleString()}</div>
          <div className="kpi-sub">จำนวนทีวี Haier ที่ถูกบันทึก</div>
          <div className="kpi-icon">📺</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'center' }}>
          {/* Search */}
          <div className="search-bar" style={{ gridColumn: 'span 1' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              className="form-input"
              style={{ paddingLeft: 40 }}
              placeholder="ค้นหา Store ID / สาขา / จังหวัด..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Hang Filter */}
          <div>
            <select
              className="form-select"
              value={hangFilter}
              onChange={e => { setHangFilter(e.target.value); setPage(1) }}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="all">🏢 ห้างทั้งหมด ({hangs.length} ห้าง)</option>
              {hangs.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          {/* Region Filter */}
          <div>
            <select
              className="form-select"
              value={regionFilter}
              onChange={e => { setRegionFilter(e.target.value); setPage(1) }}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="all">🗺️ ภูมิภาคทั้งหมด ({regions.length} ภาค)</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="all">📋 สถานะสำรวจทั้งหมด</option>
              <option value="surveyed">🟢 สำรวจแล้ว ({surveyedStores})</option>
              <option value="pending">⚪ ยังไม่ได้สำรวจ ({pendingStores})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Result Count */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          แสดง {paginated.length} จาก {filtered.length} รายการ (ค้นพบทั้งหมด {filtered.length} สาขา)
        </div>
        <button className="btn btn--ghost btn--sm" onClick={fetchReport} style={{ fontSize: '0.78rem' }}>
          🔄 รีเฟรชข้อมูล
        </button>
      </div>

      {/* Store Report Data Table */}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Store ID</th>
              <th>ห้าง (Chain)</th>
              <th>ภูมิภาค</th>
              <th>จังหวัด</th>
              <th>สาขา</th>
              <th style={{ textAlign: 'center' }}>สถานะสำรวจ</th>
              <th style={{ textAlign: 'center' }}>จำนวนครั้งที่สำรวจ</th>
              <th style={{ textAlign: 'center' }}>ทีวีที่จัดแสดง</th>
              <th>ผู้สำรวจล่าสุด</th>
              <th>วันที่สำรวจล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <div className="empty-state">
                    <div className="empty-state__icon">🔍</div>
                    <div className="empty-state__text">ไม่พบข้อมูลร้านค้าตามเงื่อนไขที่เลือก</div>
                  </div>
                </td>
              </tr>
            ) : paginated.map((r) => {
              const isSurveyed = (r.submission_count || 0) > 0
              return (
                <tr key={r.store_id} style={{ background: isSurveyed ? 'var(--haier-blue-pale)' : undefined }}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--haier-blue)' }}>
                    {r.store_id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.hang}</td>
                  <td>{r.phumipak}</td>
                  <td>{r.changwat || '-'}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.sakha}</div>
                    {r.store_name && r.store_name !== r.sakha && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.store_name}</div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: isSurveyed ? '#C6F6D5' : '#EDF2F7',
                        color: isSurveyed ? '#22543D' : '#4A5568',
                      }}
                    >
                      {isSurveyed ? '🟢 สำรวจแล้ว' : '⚪ ยังไม่ได้สำรวจ'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    {r.submission_count > 0 ? (
                      <span className="tag tag--blue">{r.submission_count} ครั้ง</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>0</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    {r.total_tvs_displayed > 0 ? (
                      <span className="tag tag--green">{r.total_tvs_displayed} เครื่อง</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>0</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{r.latest_respondent || '-'}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {r.latest_submitted_at ? new Date(r.latest_submitted_at).toLocaleString('th-TH') : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: 20 }}>
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
