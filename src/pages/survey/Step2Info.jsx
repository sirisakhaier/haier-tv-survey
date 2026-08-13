import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSurvey } from '../../context/SurveyContext'
import StepIndicator from '../../components/StepIndicator'

function validatePhone(p) {
  return /^0\d{9}$/.test(p.replace(/\s/g, ''))
}

export default function Step2Info() {
  const navigate = useNavigate()
  const { survey, update } = useSurvey()
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!survey.respondentName.trim()) errs.name = 'กรุณากรอกชื่อ'
    if (!survey.phone.trim()) errs.phone = 'กรุณากรอกเบอร์โทรศัพท์'
    else if (!validatePhone(survey.phone)) errs.phone = 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validate()) navigate('/survey/step3')
  }

  const handlePhoneBlur = () => {
    if (survey.phone && !validatePhone(survey.phone)) {
      setErrors(e => ({ ...e, phone: 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0' }))
    } else {
      setErrors(e => { const n = { ...e }; delete n.phone; return n })
    }
  }

  return (
    <div className="survey-page fade-in">
      <header className="page-header">
        <div className="page-header__inner">
          <button className="btn btn--ghost" style={{ color: '#fff', padding: '8px' }} onClick={() => navigate('/survey/step1')}>
            ← ย้อนกลับ
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>Haier Electrical Appliances (Thailand) Co., Ltd.</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              Haier TV Survey <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 10 }}>Sell out team</span>
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>ขั้นตอนที่ 2 จาก 4 — ข้อมูลผู้กรอก</div>
          </div>
        </div>
        <StepIndicator current={2} />
      </header>

      <div className="survey-body">
        {/* Store summary */}
        <div style={{ background: 'var(--haier-blue-pale)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.875rem', color: 'var(--haier-blue)', fontWeight: 500 }}>
          🏪 {survey.hang} · {survey.phumipak} · <strong>{survey.sakha}</strong> {survey.storeName ? `(${survey.storeName})` : ''}
          <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>{survey.storeId} · {survey.changwat}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: '1.3rem' }}>👤</span>
            <div>
              <div style={{ fontWeight: 700 }}>ข้อมูลผู้กรอกแบบสำรวจ</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Respondent Information</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div className="form-group">
              <label className="form-label" htmlFor="name-input">ชื่อ-นามสกุล (Name) <span className="required">*</span></label>
              <input
                id="name-input"
                type="text"
                className={`form-input${errors.name ? ' error' : ''}`}
                value={survey.respondentName}
                onChange={e => { update({ respondentName: e.target.value }); setErrors(er => { const n={...er}; delete n.name; return n }) }}
                placeholder="กรอกชื่อ-นามสกุล"
                autoComplete="name"
              />
              {errors.name && <span className="form-error">⚠ {errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone-input">เบอร์โทรศัพท์ (Phone) <span className="required">*</span></label>
              <input
                id="phone-input"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                className={`form-input${errors.phone ? ' error' : ''}`}
                value={survey.phone}
                onChange={e => { const v = e.target.value.replace(/\D/g, ''); update({ phone: v }); if (errors.phone) setErrors(er => { const n={...er}; delete n.phone; return n }) }}
                onBlur={handlePhoneBlur}
                placeholder="0xxxxxxxxx (10 หลัก)"
                autoComplete="tel"
              />
              {errors.phone && <span className="form-error">⚠ {errors.phone}</span>}
              {survey.phone && !errors.phone && validatePhone(survey.phone) && (
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>✓ เบอร์โทรถูกต้อง</span>
              )}
            </div>

          </div>
        </div>

        <button id="step2-next-btn" className="btn btn--primary btn--block" onClick={handleNext}>
          ถัดไป — เลือกรุ่นทีวี →
        </button>

        {/* Footer info */}
        <footer style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Haier Electrical Appliances (Thailand) Co., Ltd. · Sell out team
        </footer>
      </div>
    </div>
  )
}
