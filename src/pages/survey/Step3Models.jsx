import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSurvey } from '../../context/SurveyContext'
import { useData } from '../../context/DataContext'
import StepIndicator from '../../components/StepIndicator'
import SearchableSelect from '../../components/SearchableSelect'
import ThemeToggle from '../../components/ThemeToggle'

const LOCATION_ICONS = { wall: '🧱', table: '📺', pillar: '🏛️' }
const SUB_CAT_CLASS = { 'QLED': 'qled', 'MINI-LED': 'miniled', 'OLED': 'oled', 'UHD': 'uhd', 'FHD': 'fhd' }
const LOC_CLASS = { wall: 'wall', table: 'table', pillar: 'pillar' }

export default function Step3Models() {
  const navigate = useNavigate()
  const { survey, addEntry, removeEntry } = useSurvey()
  const { models, locations } = useData()
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [addError, setAddError] = useState('')
  const [submitTouched, setSubmitTouched] = useState(false)

  const modelOptions = models.map(m => ({
    value: m.model_code,
    label: `${m.model_code} — ${m.sub_category} — ${m.size}`,
  }))

  const handleAdd = () => {
    if (!selectedModel || !selectedLocation) {
      setAddError('กรุณาเลือกทั้งรุ่นทีวีและตำแหน่งการจัดวาง')
      return
    }
    const model = models.find(m => m.model_code === selectedModel)
    const loc = locations.find(l => l.code === selectedLocation)
    const dup = survey.entries.find(e => e.model_code === selectedModel && e.location_code === selectedLocation)
    if (dup) {
      setAddError('รายการนี้มีอยู่แล้ว (รุ่นและตำแหน่งเดิม)')
      return
    }
    addEntry({
      model_code: model.model_code,
      sub_category: model.sub_category,
      size: model.size,
      location_code: loc.code,
      location_label_th: loc.label_th,
      location_label_en: loc.label_en,
    })
    setSelectedModel('')
    setSelectedLocation('')
    setAddError('')
  }

  const handleNext = () => {
    setSubmitTouched(true)
    if (survey.entries.length > 0) navigate('/survey/step4')
  }

  return (
    <div className="survey-page fade-in">
      <header className="page-header">
        <div className="page-header__inner">
          <button className="btn btn--ghost" style={{ color: '#fff', padding: '8px' }} onClick={() => navigate('/survey/step2')}>
            ← ย้อนกลับ
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>Haier Electrical Appliances (Thailand) Co., Ltd.</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              Haier TV Survey <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 10 }}>Sell out team</span>
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>ขั้นตอนที่ 3 จาก 4 — รุ่นทีวีและตำแหน่ง</div>
          </div>
          <ThemeToggle />
        </div>
        <StepIndicator current={3} />
      </header>

      <div className="survey-body">
        {/* Entry form card */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: '1.3rem' }}>📺</span>
            <div>
              <div style={{ fontWeight: 700 }}>เพิ่มรุ่นทีวีและตำแหน่ง</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Add TV Model + Display Location</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Model picker */}
            <div className="form-group">
              <label className="form-label">รุ่นทีวี (Model) <span className="required">*</span></label>
              <SearchableSelect
                options={modelOptions}
                value={selectedModel}
                onChange={v => { setSelectedModel(v); setAddError('') }}
                placeholder="ค้นหารุ่นทีวี..."
              />
            </div>

            {/* Location picker */}
            <div className="form-group">
              <label className="form-label">ตำแหน่งการจัดวาง (Location) <span className="required">*</span></label>
              <div className="location-grid">
                {locations.map(loc => (
                  <button
                    key={loc.code}
                    type="button"
                    id={`loc-${loc.code}`}
                    className={`location-btn${selectedLocation === loc.code ? ' active' : ''}`}
                    onClick={() => { setSelectedLocation(loc.code); setAddError('') }}
                  >
                    <span className="icon">{LOCATION_ICONS[loc.code] || '📍'}</span>
                    <span>{loc.label_th}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>{loc.label_en}</span>
                  </button>
                ))}
              </div>
            </div>

            {addError && <span className="form-error">⚠ {addError}</span>}

            <button id="add-model-btn" className="btn btn--secondary btn--block" onClick={handleAdd}>
              ＋ เพิ่มรุ่น (Add Model)
            </button>
          </div>
        </div>

        {/* Entry list */}
        {survey.entries.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span style={{ fontSize: '1.1rem' }}>📋</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>รายการที่เพิ่มแล้ว</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Added Entries · {survey.entries.length} รายการ</div>
              </div>
            </div>
            <div className="card-body">
              <div className="entry-list">
                {survey.entries.map(e => (
                  <div key={e.id} className="entry-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {e.model_code}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span className={`entry-badge badge--${SUB_CAT_CLASS[e.sub_category] || 'uhd'}`}>{e.sub_category}</span>
                        <span className="entry-badge" style={{ background: '#F7FAFC', color: 'var(--text-muted)' }}>{e.size}</span>
                        <span className={`entry-badge badge--${LOC_CLASS[e.location_code]}`}>{e.location_label_th} {e.location_label_en}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn--icon"
                      title="ลบรายการ"
                      style={{ color: 'var(--accent-red)', background: '#FFF5F5', flexShrink: 0 }}
                      onClick={() => removeEntry(e.id)}
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {submitTouched && survey.entries.length === 0 && (
          <div className="form-error" style={{ justifyContent: 'center', fontSize: '0.9rem' }}>
            ⚠ กรุณาเพิ่มอย่างน้อย 1 รายการก่อนดำเนินการต่อ
          </div>
        )}

        <button id="step3-next-btn" className="btn btn--primary btn--block" onClick={handleNext}>
          ถัดไป — อัพโหลดรูปภาพ →
        </button>

        {/* Footer info */}
        <footer style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Haier Electrical Appliances (Thailand) Co., Ltd. · Sell out team
        </footer>
      </div>
    </div>
  )
}
