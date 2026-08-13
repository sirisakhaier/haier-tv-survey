import { useState } from 'react'
import Papa from 'papaparse'
import toast from 'react-hot-toast'

export default function SurveyDataManager() {
  const [confirmReset, setConfirmReset] = useState('')
  const [resetting, setResetting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [submissions, setSubmissions] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')

  const loadSubmissions = async () => {
    try {
      const res = await fetch('/api/admin/submissions')
      const data = await res.json()
      setSubmissions(Array.isArray(data) ? data : [])
      setLoaded(true)
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/admin/export')
      const data = await res.json()
      const rows = (data || []).map(r => ({
        'Submission ID': r.id,
        'Store ID': r.store_id,
        'ห้าง': r.hang,
        'ภูมิภาค': r.phumipak,
        'จังหวัด': r.changwat,
        'สาขา': r.sakha,
        'ชื่อผู้กรอก': r.respondent_name,
        'เบอร์โทร': r.phone,
        'Model': r.model_code,
        'Sub Category': r.sub_category,
        'Size': r.size,
        'Location TH': r.location_label_th,
        'Location EN': r.location_label_en,
        'วันที่ส่ง': r.submitted_at,
      }))
      const csv = Papa.unparse(rows)
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }) // BOM for Thai
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `haier_survey_data_${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export สำเร็จ')
    } catch {
      toast.error('Export ล้มเหลว')
    } finally {
      setExporting(false)
    }
  }

  const handleReset = async () => {
    if (confirmReset !== 'RESET') { toast.error('กรุณาพิมพ์ RESET เพื่อยืนยัน'); return }
    setResetting(true)
    try {
      const res = await fetch('/api/admin/reset-data', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('ลบข้อมูลสำรวจทั้งหมดสำเร็จ')
      setConfirmReset('')
      setSubmissions([])
      setLoaded(false)
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setResetting(false)
    }
  }

  const filtered = submissions.filter(s => !search || Object.values(s).some(v => String(v).toLowerCase().includes(search.toLowerCase())))

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Survey Data</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>จัดการและส่งออกข้อมูลแบบสำรวจ</p>
      </div>

      {/* Export & View */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span>📊</span>
          <div style={{ fontWeight: 700 }}>ส่งออกและดูข้อมูล (Export & View)</div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn--primary btn--sm" onClick={handleExport} disabled={exporting}>
              {exporting ? <><div className="spinner" />กำลัง Export...</> : '⬇ Export CSV (ข้อมูลทั้งหมด)'}
            </button>
            <button className="btn btn--secondary btn--sm" onClick={loadSubmissions}>
              📋 ดูรายการส่ง
            </button>
          </div>

          {loaded && (
            <>
              <div className="search-bar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input className="form-input" style={{ paddingLeft: 40 }} placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {filtered.length === 0
                ? <div className="empty-state"><div className="empty-state__icon">📭</div><div className="empty-state__text">ไม่มีข้อมูล</div></div>
                : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>ID</th><th>ร้าน</th><th>ผู้กรอก</th><th>รุ่น (items)</th><th>รูป</th><th>วันที่</th></tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, 100).map(r => (
                        <tr key={r.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>#{r.id}</td>
                          <td><div style={{ fontWeight: 600 }}>{r.sakha}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.store_id}</div></td>
                          <td><div>{r.respondent_name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.phone}</div></td>
                          <td><span className="tag tag--blue">{r.items_count} รายการ</span></td>
                          <td><span className="tag tag--green">{r.photos_count} รูป</span></td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(r.submitted_at).toLocaleString('th-TH')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="danger-zone">
        <div className="danger-zone__title">⚠️ Danger Zone — รีเซ็ตข้อมูลแบบสำรวจ</div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.7 }}>
          การดำเนินการนี้จะ <strong>ลบข้อมูลแบบสำรวจทั้งหมด</strong> รวมถึงรูปภาพที่อัพโหลด
          ข้อมูลอ้างอิง (Store/Model/Location) จะ<strong>ไม่</strong>ถูกลบ
          <br/>การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </p>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">พิมพ์ <code style={{ background: '#FED7D7', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>RESET</code> เพื่อยืนยัน</label>
          <input
            id="reset-confirm-input"
            className={`form-input${confirmReset && confirmReset !== 'RESET' ? ' error' : ''}`}
            value={confirmReset}
            onChange={e => setConfirmReset(e.target.value)}
            placeholder="พิมพ์ RESET"
            style={{ maxWidth: 300, fontFamily: 'monospace', letterSpacing: '0.05em' }}
          />
        </div>
        <button
          id="reset-data-btn"
          className="btn btn--danger"
          disabled={confirmReset !== 'RESET' || resetting}
          onClick={handleReset}
        >
          {resetting ? <><div className="spinner spinner--blue" />กำลังรีเซ็ต...</> : '🗑 รีเซ็ตข้อมูลแบบสำรวจทั้งหมด'}
        </button>
      </div>
    </div>
  )
}
