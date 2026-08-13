import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSurvey } from '../../context/SurveyContext'
import ThemeToggle from '../../components/ThemeToggle'
import toast from 'react-hot-toast'

export default function ReviewSubmit() {
  const navigate = useNavigate()
  const { survey, resetSurvey } = useSurvey()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('store_id',       survey.storeId)
      formData.append('storeId',        survey.storeId)
      formData.append('storeName',      survey.storeName || survey.sakha)
      formData.append('hang',           survey.hang)
      formData.append('phumipak',       survey.phumipak)
      formData.append('changwat',       survey.changwat || '')
      formData.append('sakha',          survey.sakha)
      formData.append('respondent_name', survey.respondentName)
      formData.append('respondentName', survey.respondentName)
      formData.append('phone',          survey.phone)

      formData.append('entries', JSON.stringify(survey.entries))

      survey.photos.forEach(p => {
        formData.append('photos', p.file, p.name || 'photo.jpg')
      })

      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Submission failed')

      resetSurvey()
      navigate('/survey/success', { replace: true, state: { submissionId: json.id } })
    } catch (err) {
      toast.error(`ส่งข้อมูลล้มเหลว: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="survey-page fade-in">
      <header className="page-header">
        <div className="page-header__inner">
          <button className="btn btn--ghost" style={{ color: '#fff', padding: '8px' }} onClick={() => navigate('/survey/step4')}>
            ← ย้อนกลับ
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>Haier Electrical Appliances (Thailand) Co., Ltd.</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              ตรวจสอบข้อมูล <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 10 }}>Sell out team</span>
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>Review & Submit</div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="survey-body">
        {/* Store */}
        <div className="review-section">
          <div className="review-section__header">
            🏪 ข้อมูลร้านค้า
            <button className="btn btn--ghost btn--sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => navigate('/survey/step1')}>แก้ไข</button>
          </div>
          <div className="review-section__body">
            <div className="review-row"><span className="review-row__label">ห้าง</span><span className="review-row__value">{survey.hang}</span></div>
            <div className="review-row"><span className="review-row__label">ภูมิภาค</span><span className="review-row__value">{survey.phumipak}</span></div>
            <div className="review-row"><span className="review-row__label">สาขา</span><span className="review-row__value">{survey.sakha} {survey.storeName ? `(${survey.storeName})` : ''} — {survey.changwat}</span></div>
            <div className="review-row"><span className="review-row__label">Store ID</span><span className="review-row__value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{survey.storeId}</span></div>
          </div>
        </div>

        {/* Respondent */}
        <div className="review-section">
          <div className="review-section__header">
            👤 ข้อมูลผู้กรอก
            <button className="btn btn--ghost btn--sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => navigate('/survey/step2')}>แก้ไข</button>
          </div>
          <div className="review-section__body">
            <div className="review-row"><span className="review-row__label">ชื่อ</span><span className="review-row__value">{survey.respondentName}</span></div>
            <div className="review-row"><span className="review-row__label">เบอร์โทร</span><span className="review-row__value">{survey.phone}</span></div>
          </div>
        </div>

        {/* Entries */}
        <div className="review-section">
          <div className="review-section__header">
            📺 รุ่นทีวีที่จัดแสดง ({survey.entries.length})
            <button className="btn btn--ghost btn--sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => navigate('/survey/step3')}>แก้ไข</button>
          </div>
          <div className="review-section__body" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {survey.entries.map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontWeight: 600 }}>{e.model_code}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className={`tag tag--blue`}>{e.sub_category} {e.size}</span>
                  <span className="tag tag--orange">{e.location_label_th}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div className="review-section">
          <div className="review-section__header">
            📸 รูปภาพ ({survey.photos.length})
            <button className="btn btn--ghost btn--sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => navigate('/survey/step4')}>แก้ไข</button>
          </div>
          <div className="review-section__body">
            <div className="photo-grid">
              {survey.photos.map(p => (
                <div key={p.id} className="photo-thumb" style={{ aspectRatio: '4/3' }}>
                  <img src={p.preview} alt="preview" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          id="submit-survey-btn"
          className="btn btn--primary btn--block"
          disabled={submitting}
          onClick={handleSubmit}
          style={{ fontSize: '1.1rem', padding: '18px' }}
        >
          {submitting
            ? <><div className="spinner" />กำลังส่งข้อมูล...</>
            : '✅ ส่งแบบสำรวจ (Submit)'}
        </button>

        {/* Footer info */}
        <footer style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Haier Electrical Appliances (Thailand) Co., Ltd. · Sell out team
        </footer>
      </div>
    </div>
  )
}
