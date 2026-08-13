import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#0047BA', '#00A3E0', '#38A169', '#F5A623', '#E53E3E', '#6B46C1', '#D69E2E', '#319795']
const SUB_CAT_CLASS = { 'QLED': 'qled', 'MINI-LED': 'miniled', 'OLED': 'oled', 'UHD': 'uhd', 'FHD': 'fhd' }

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)       // { row } — summary row
  const [detail, setDetail] = useState(null)     // full submission detail
  const [detailLoading, setDetailLoading] = useState(false)


  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sr, rr] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/admin/recent').then(r => r.ok ? r.json() : []).catch(() => []),
      ])
      setStats(sr && !sr.error ? sr : {
        totalSubmissions: 0,
        uniqueStores: 0,
        totalPhotos: 0,
        totalItems: 0,
        today: 0,
        thisWeek: 0,
        byHang: [],
        byRegion: [],
        byModel: [],
        bySubCat: [],
        byLocation: [],
        trend: [],
      })
      setRecent(Array.isArray(rr) ? rr : [])
    } catch {
      setStats({
        totalSubmissions: 0,
        uniqueStores: 0,
        totalPhotos: 0,
        totalItems: 0,
        today: 0,
        thisWeek: 0,
        byHang: [],
        byRegion: [],
        byModel: [],
        bySubCat: [],
        byLocation: [],
        trend: [],
      })
      setRecent([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <div className="spinner spinner--blue" style={{ width: 40, height: 40 }} />
        <div style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</div>
      </div>
    )
  }

  const s = stats || {}

  const KPI_CARDS = [
    { label: 'Total Submissions', labelTh: 'แบบสำรวจทั้งหมด', value: s.totalSubmissions ?? 0, icon: '📝', color: '#0047BA' },
    { label: 'Stores Surveyed', labelTh: 'ร้านที่สำรวจแล้ว', value: s.uniqueStores ?? 0, icon: '🏪', color: '#38A169' },
    { label: 'Photos Uploaded', labelTh: 'รูปภาพทั้งหมด', value: s.totalPhotos ?? 0, icon: '📸', color: '#F5A623' },
    { label: 'Today / This Week', labelTh: 'วันนี้ / สัปดาห์นี้', value: `${s.today ?? 0}/${s.thisWeek ?? 0}`, icon: '📅', color: '#6B46C1' },
  ]

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Haier TV Survey — ภาพรวมข้อมูล</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {KPI_CARDS.map(k => (
          <div key={k.label} className="kpi-card" style={{ '--kpi-color': k.color }}>
            <div className="kpi-label">{k.labelTh}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-sub">{k.label}</div>
            <div className="kpi-icon">{k.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="chart-grid">
        {/* Trend */}
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-card__header">📈 แนวโน้มการส่งแบบสำรวจ (Submission Trend)</div>
          <div className="chart-card__body">
            {(s.trend || []).length === 0
              ? <div className="empty-state"><div className="empty-state__icon">📊</div><div className="empty-state__text">ยังไม่มีข้อมูล</div></div>
              : <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={s.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#0047BA" strokeWidth={2.5} dot={{ fill: '#0047BA', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
            }
          </div>
        </div>

        {/* By Hang */}
        <div className="chart-card">
          <div className="chart-card__header">🏬 สำรวจแยกตามห้าง (By Retail Chain)</div>
          <div className="chart-card__body">
            {(s.byHang || []).length === 0
              ? <div className="empty-state"><div className="empty-state__icon">📊</div><div className="empty-state__text">ยังไม่มีข้อมูล</div></div>
              : <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={s.byHang} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0047BA" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>
        </div>

        {/* By Region */}
        <div className="chart-card">
          <div className="chart-card__header">🗺️ แยกตามภูมิภาค (By Region)</div>
          <div className="chart-card__body">
            {(s.byRegion || []).length === 0
              ? <div className="empty-state"><div className="empty-state__icon">📊</div><div className="empty-state__text">ยังไม่มีข้อมูล</div></div>
              : <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={s.byRegion} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}>
                      {(s.byRegion || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
            }
          </div>
        </div>

        {/* Top Models */}
        <div className="chart-card">
          <div className="chart-card__header">📺 รุ่นยอดนิยม Top Models</div>
          <div className="chart-card__body">
            {(s.byModel || []).length === 0
              ? <div className="empty-state"><div className="empty-state__icon">📊</div><div className="empty-state__text">ยังไม่มีข้อมูล</div></div>
              : <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={(s.byModel || []).slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#38A169" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>
        </div>

        {/* By Location */}
        <div className="chart-card">
          <div className="chart-card__header">📍 ตำแหน่งการจัดวาง (By Location)</div>
          <div className="chart-card__body">
            {(s.byLocation || []).length === 0
              ? <div className="empty-state"><div className="empty-state__icon">📊</div><div className="empty-state__text">ยังไม่มีข้อมูล</div></div>
              : <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={s.byLocation} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                      {(s.byLocation || []).map((_, i) => <Cell key={i} fill={['#0047BA','#38A169','#F5A623'][i % 3]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
            }
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14 }}>📋 การส่งล่าสุด (Recent Submissions)</h2>
        {recent.length === 0
          ? <div className="empty-state"><div className="empty-state__icon">📭</div><div className="empty-state__text">ยังไม่มีการส่งแบบสำรวจ</div></div>
          : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store</th><th>ผู้กรอก</th><th>รุ่น</th><th>รูป</th><th>วันที่</th><th></th>
                </tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id}>
                    <td><div style={{ fontWeight: 600 }}>{r.sakha}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.hang} · {r.store_id}</div></td>
                    <td><div>{r.respondent_name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.phone}</div></td>
                    <td><span className="tag tag--blue">{r.items_count} รายการ</span></td>
                    <td><span className="tag tag--green">{r.photos_count} รูป</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(r.submitted_at).toLocaleString('th-TH')}</td>
                    <td>
                      <button className="btn btn--ghost btn--sm" onClick={async () => {
                        setModal(r); setDetail(null); setDetailLoading(true)
                        try {
                          const d = await fetch(`/api/admin/submissions/${r.id}`).then(x => x.json())
                          setDetail(d)
                        } catch {}
                        setDetailLoading(false)
                      }}>
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => { setModal(null); setDetail(null) }}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 style={{ fontWeight: 700 }}>รายละเอียดแบบสำรวจ #{modal.id}</h3>
              <button className="modal__close" onClick={() => { setModal(null); setDetail(null) }}>✕</button>
            </div>
            <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary */}
              <div style={{ background: 'var(--haier-blue-pale)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: '0.875rem' }}>
                <div><strong>🏪 ร้าน:</strong> {modal.hang} · {modal.phumipak} · {modal.sakha}</div>
                <div style={{ marginTop: 4 }}><strong>👤 ผู้กรอก:</strong> {modal.respondent_name} · {modal.phone}</div>
                <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: '0.78rem' }}>🕐 {new Date(modal.submitted_at).toLocaleString('th-TH')}</div>
              </div>

              {detailLoading && <div style={{ textAlign: 'center' }}><div className="spinner spinner--blue" style={{ margin: '0 auto' }} /></div>}

              {detail && (
                <>
                  {/* Items */}
                  {detail.items?.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>📺 รุ่นทีวีที่จัดแสดง ({detail.items.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {detail.items.map(item => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F7FAFC', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600 }}>{item.model_code}</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <span className={`entry-badge badge--${SUB_CAT_CLASS[item.sub_category] || 'uhd'}`}>{item.sub_category} {item.size}</span>
                              <span className="entry-badge badge--wall">{item.location_label_th}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photos */}
                  {detail.photos?.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>📸 รูปภาพ ({detail.photos.length})</div>
                      <div className="photo-grid">
                        {detail.photos.map(p => (
                          <a key={p.id} href={p.file_path} target="_blank" rel="noopener noreferrer" className="photo-thumb" style={{ display: 'block', aspectRatio: '1' }}>
                            <img src={p.file_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
