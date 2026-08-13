import { useState } from 'react'
import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import toast from 'react-hot-toast'

export default function SurveyDataManager() {
  const [confirmReset, setConfirmReset] = useState('')
  const [resetting, setResetting] = useState(false)
  const [exportingCSV, setExportingCSV] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportProgress, setExportProgress] = useState('')
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

  // Format URL to ensure 1 URL per photo and ends with .jpg
  const formatJpgUrl = (p, origin) => {
    if (!p) return ''
    let url = p.trim()
    if (!url.startsWith('http')) url = origin + url
    if (!/\.(jpg|jpeg|png|webp)$/i.test(url)) {
      url = url + '.jpg'
    } else {
      url = url.replace(/\.(jpeg|png|webp)$/i, '.jpg')
    }
    return url
  }

  // 1. Export Without Pictures (CSV - 1 JPG URL per photo column)
  const handleExportWithoutPictures = async () => {
    setExportingCSV(true)
    try {
      const res = await fetch('/api/admin/export')
      const data = await res.json()
      const origin = window.location.origin

      if (!data || data.length === 0) {
        toast.error('ไม่มีข้อมูลสำหรับส่งออก')
        setExportingCSV(false)
        return
      }

      // Determine maximum number of photos across all submissions
      let maxPhotos = 3
      data.forEach(r => {
        if (r.photo_urls) {
          const count = r.photo_urls.split(', ').filter(Boolean).length
          if (count > maxPhotos) maxPhotos = count
        }
      })

      const rows = data.map(r => {
        const rawUrls = r.photo_urls ? r.photo_urls.split(', ').filter(Boolean) : []
        const jpgUrls = rawUrls.map(p => formatJpgUrl(p, origin))

        const rowObj = {
          'Submission ID': r.id,
          'Store ID': r.store_id,
          'ห้าง': r.hang,
          'ภูมิภาค': r.phumipak,
          'จังหวัด': r.changwat,
          'สาขา': r.sakha,
          'ชื่อร้าน (Store Name)': r.store_name || '',
          'ชื่อผู้กรอก': r.respondent_name,
          'เบอร์โทร': r.phone,
          'Model': r.model_code,
          'Sub Category': r.sub_category,
          'Size': r.size,
          'Location TH': r.location_label_th,
          'Location EN': r.location_label_en,
          'วันที่ส่ง': r.submitted_at ? new Date(r.submitted_at).toLocaleString('th-TH') : '',
        }

        // Add 1 JPG URL per photo column
        for (let i = 1; i <= maxPhotos; i++) {
          rowObj[`Photo ${i} URL (.jpg)`] = jpgUrls[i - 1] || ''
        }

        return rowObj
      })

      const csv = Papa.unparse(rows)
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `haier_survey_jpg_urls_${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('ส่งออก CSV (1 JPG URL ต่อรูป) สำเร็จ')
    } catch (err) {
      toast.error('ส่งออก CSV ล้มเหลว: ' + err.message)
    } finally {
      setExportingCSV(false)
    }
  }

  // Helper to fetch image buffer for Excel embedding
  const fetchImageBuffer = async (url) => {
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      const blob = await res.blob()
      const arrayBuffer = await blob.arrayBuffer()
      return { buffer: new Uint8Array(arrayBuffer), type: 'jpeg' }
    } catch {
      return null
    }
  }

  // 2. Export With Pictures (Excel .xlsx with 1 JPG URL + Embedded Thumbnail per photo)
  const handleExportWithPictures = async () => {
    setExportingExcel(true)
    setExportProgress('กำลังเตรียมข้อมูล...')
    try {
      const res = await fetch('/api/admin/export')
      const data = await res.json()
      const origin = window.location.origin

      if (!data || data.length === 0) {
        toast.error('ไม่มีข้อมูลสำหรับส่งออก')
        setExportingExcel(false)
        return
      }

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Survey Data with Photos')

      // Determine maximum number of photos per submission
      let maxPhotos = 3
      data.forEach(r => {
        if (r.photo_urls) {
          const count = r.photo_urls.split(', ').filter(Boolean).length
          if (count > maxPhotos) maxPhotos = count
        }
      })

      // Columns setup
      const baseCols = [
        { header: 'Submission ID', key: 'id', width: 14 },
        { header: 'Store ID', key: 'store_id', width: 14 },
        { header: 'ห้าง', key: 'hang', width: 16 },
        { header: 'ภูมิภาค', key: 'phumipak', width: 22 },
        { header: 'จังหวัด', key: 'changwat', width: 16 },
        { header: 'สาขา', key: 'sakha', width: 22 },
        { header: 'ชื่อร้าน (Store Name)', key: 'store_name', width: 28 },
        { header: 'ชื่อผู้กรอก', key: 'respondent_name', width: 20 },
        { header: 'เบอร์โทร', key: 'phone', width: 15 },
        { header: 'Model', key: 'model_code', width: 18 },
        { header: 'Sub Category', key: 'sub_category', width: 14 },
        { header: 'Size', key: 'size', width: 10 },
        { header: 'Location TH', key: 'location_label_th', width: 14 },
        { header: 'Location EN', key: 'location_label_en', width: 14 },
        { header: 'วันที่ส่ง', key: 'submitted_at', width: 20 },
      ]

      // Add Photo URL and Photo Thumbnail columns for each picture (1 URL per photo)
      for (let i = 1; i <= maxPhotos; i++) {
        baseCols.push({ header: `Photo ${i} URL (.jpg)`, key: `photo_${i}_url`, width: 35 })
        baseCols.push({ header: `Photo ${i} Preview`, key: `photo_${i}_thumb`, width: 16 })
      }

      worksheet.columns = baseCols

      // Header row styling
      const headerRow = worksheet.getRow(1)
      headerRow.height = 28
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0047BA' } }
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      })

      // Process rows
      let total = data.length
      for (let idx = 0; idx < data.length; idx++) {
        const r = data[idx]
        setExportProgress(`กำลังดาวน์โหลดรูปภาพและสร้าง Excel (${idx + 1}/${total})...`)

        const rawUrls = r.photo_urls ? r.photo_urls.split(', ').filter(Boolean) : []
        const jpgUrls = rawUrls.map(p => formatJpgUrl(p, origin))

        const rowValues = {
          id: r.id,
          store_id: r.store_id,
          hang: r.hang,
          phumipak: r.phumipak,
          changwat: r.changwat,
          sakha: r.sakha,
          store_name: r.store_name || '',
          respondent_name: r.respondent_name,
          phone: r.phone,
          model_code: r.model_code,
          sub_category: r.sub_category,
          size: r.size,
          location_label_th: r.location_label_th,
          location_label_en: r.location_label_en,
          submitted_at: r.submitted_at ? new Date(r.submitted_at).toLocaleString('th-TH') : '',
        }

        // Add individual photo URLs
        for (let i = 1; i <= maxPhotos; i++) {
          rowValues[`photo_${i}_url`] = jpgUrls[i - 1] || ''
        }

        const addedRow = worksheet.addRow(rowValues)
        addedRow.height = 65 // height for embedded thumbnail
        addedRow.eachCell(cell => {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
        })

        const rowIndex = addedRow.number // 1-indexed

        // Fetch and embed photo thumbnails into corresponding Photo i Preview columns
        for (let pIdx = 0; pIdx < jpgUrls.length; pIdx++) {
          const imgUrl = jpgUrls[pIdx]
          const imgData = await fetchImageBuffer(imgUrl)
          if (imgData) {
            try {
              const imageId = workbook.addImage({
                buffer: imgData.buffer,
                extension: 'jpeg',
              })
              // Column 0-indexed: base 15 cols, then for each photo: 2 cols (URL, Preview)
              // Photo 1 Preview -> col 16 (0-indexed)
              // Photo 2 Preview -> col 18 (0-indexed)
              const colIndex = 15 + (pIdx * 2) + 1 // Preview column index
              worksheet.addImage(imageId, {
                tl: { col: colIndex, row: rowIndex - 1 },
                ext: { width: 75, height: 60 },
                editAs: 'oneCell',
              })
            } catch (e) {
              console.error('Image add error:', e)
            }
          }
        }
      }

      setExportProgress('กำลังสร้างไฟล์ Excel...')
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `haier_survey_with_pictures_${new Date().toISOString().slice(0,10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('ส่งออก Excel (พร้อม 1 JPG URL ต่อรูป + พรีวิว) สำเร็จ!')
    } catch (err) {
      toast.error('ส่งออก Excel ล้มเหลว: ' + err.message)
    } finally {
      setExportingExcel(false)
      setExportProgress('')
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Survey Data Export & Management</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          ส่งออกข้อมูลแบบสำรวจทีวี Haier (แยกแบบมีรูปภาพและไม่มีรูปภาพ — 1 ลิงก์ .jpg ต่อรูป)
        </p>
      </div>

      {/* Export Options Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span>📊</span>
          <div style={{ fontWeight: 700 }}>ส่งออกข้อมูล (Export Options)</div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Export Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>

            {/* 1. Export Without Pictures (1 JPG URL per column) */}
            <div style={{ background: '#F7FAFC', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', flexDirection: 'column', justify: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📄 1. ส่งออก CSV (ไม่มีรูปภาพ - 1 ลิงก์ .jpg ต่อคอลัมน์)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  ดาวน์โหลด CSV รวดเร็ว แยกคอลัมน์ Photo 1 URL, Photo 2 URL... (มีเฉพาะลิงก์ .jpg 1 ลิงก์ต่อช่อง)
                </div>
              </div>
              <button
                className="btn btn--secondary btn--block btn--sm"
                onClick={handleExportWithoutPictures}
                disabled={exportingCSV || exportingExcel}
              >
                {exportingCSV ? <><div className="spinner spinner--blue" />กำลัง Export CSV...</> : '⬇️ ดาวน์โหลด CSV (Without Pictures)'}
              </button>
            </div>

            {/* 2. Export With Pictures (Excel with Thumbnails & JPG URLs) */}
            <div style={{ background: 'var(--haier-blue-pale)', border: '1px solid var(--border-blue)', borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', flexDirection: 'column', justify: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--haier-blue)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🖼️ 2. ส่งออก Excel (มีรูปภาพพรีวิว + ลิงก์ .jpg)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  ดาวน์โหลด Excel (.xlsx) แยกคอลัมน์ Photo 1 URL (.jpg) คู่กับรูปภาพ Thumbnail พรีวิวฝังในตาราง
                </div>
              </div>
              <button
                className="btn btn--primary btn--block btn--sm"
                onClick={handleExportWithPictures}
                disabled={exportingCSV || exportingExcel}
              >
                {exportingExcel ? <><div className="spinner" />{exportProgress || 'กำลัง Export Excel...'}</> : '🖼️ ดาวน์โหลด Excel (With Pictures)'}
              </button>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            <button className="btn btn--ghost btn--sm" onClick={loadSubmissions} style={{ color: 'var(--haier-blue)' }}>
              📋 ดูตารางรายการส่ง ({submissions.length || 'คลิกเพื่อโหลด'})
            </button>
          </div>

          {/* Submissions Table Preview */}
          {loaded && (
            <>
              <div className="search-bar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input className="form-input" style={{ paddingLeft: 40 }} placeholder="ค้นหารายการ..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {filtered.length === 0
                ? <div className="empty-state"><div className="empty-state__icon">📭</div><div className="empty-state__text">ไม่มีข้อมูล</div></div>
                : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>ID</th><th>ร้านค้า</th><th>ผู้กรอก</th><th>รุ่น (items)</th><th>รูป</th><th>วันที่</th></tr>
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
