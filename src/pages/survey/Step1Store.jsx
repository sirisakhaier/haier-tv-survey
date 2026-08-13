import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSurvey } from '../../context/SurveyContext'
import { useData } from '../../context/DataContext'
import StepIndicator from '../../components/StepIndicator'
import SearchableSelect from '../../components/SearchableSelect'

export default function Step1Store() {
  const navigate = useNavigate()
  const { survey, update } = useSurvey()
  const { hangs, regionsForHang, branchesForHangRegion, loading } = useData()
  const [touched, setTouched] = useState(false)

  const regions = useMemo(() => survey.hang ? regionsForHang(survey.hang) : [], [survey.hang, regionsForHang])
  const branches = useMemo(() => (survey.hang && survey.phumipak) ? branchesForHangRegion(survey.hang, survey.phumipak) : [], [survey.hang, survey.phumipak, branchesForHangRegion])

  const branchOptions = branches.map(b => ({
    value: b.store_id,
    label: b.sakha,
    sublabel: `${b.changwat} · ${b.store_id}`,
  }))

  const handleHangChange = (e) => {
    update({ hang: e.target.value, phumipak: '', sakha: '', storeId: '', storeName: '', changwat: '' })
  }
  const handleRegionChange = (e) => {
    update({ phumipak: e.target.value, sakha: '', storeId: '', storeName: '', changwat: '' })
  }
  const handleBranchChange = (storeId) => {
    const store = branches.find(b => b.store_id === storeId)
    if (store) update({ storeId: store.store_id, sakha: store.sakha, storeName: store.store_name, changwat: store.changwat })
  }

  const canProceed = survey.hang && survey.phumipak && survey.storeId

  const handleNext = () => {
    setTouched(true)
    if (canProceed) navigate('/survey/step2')
  }

  if (loading) {
    return (
      <div className="survey-page" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="spinner spinner--blue" style={{ width: 36, height: 36 }} />
        <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  return (
    <div className="survey-page fade-in">
      <header className="page-header">
        <div className="page-header__inner">
          <img src="/haier-logo.png" alt="Haier" className="page-header__logo" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Haier TV Survey</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>ขั้นตอนที่ 1 จาก 4 — เลือกร้านค้า</div>
          </div>
        </div>
        <StepIndicator current={1} />
      </header>

      <div className="survey-body">
        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: '1.3rem' }}>🏪</span>
            <div>
              <div style={{ fontWeight: 700 }}>เลือกสาขาร้านค้า</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Select Store</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ห้าง */}
            <div className="form-group">
              <label className="form-label">ห้าง (Retail Chain) <span className="required">*</span></label>
              <div className="select-wrapper">
                <select
                  id="hang-select"
                  className={`form-select${touched && !survey.hang ? ' error' : ''}`}
                  value={survey.hang}
                  onChange={handleHangChange}
                >
                  <option value="">-- เลือกห้าง --</option>
                  {hangs.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              {touched && !survey.hang && <span className="form-error">⚠ กรุณาเลือกห้าง</span>}
            </div>

            {/* ภูมิภาค */}
            <div className="form-group">
              <label className="form-label">ภูมิภาค (Region) <span className="required">*</span></label>
              <div className="select-wrapper">
                <select
                  id="region-select"
                  className={`form-select${touched && survey.hang && !survey.phumipak ? ' error' : ''}`}
                  value={survey.phumipak}
                  onChange={handleRegionChange}
                  disabled={!survey.hang}
                >
                  <option value="">-- เลือกภูมิภาค --</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {touched && survey.hang && !survey.phumipak && <span className="form-error">⚠ กรุณาเลือกภูมิภาค</span>}
            </div>

            {/* สาขา — searchable */}
            <div className="form-group">
              <label className="form-label">สาขา (Branch) <span className="required">*</span></label>
              <SearchableSelect
                options={branchOptions}
                value={survey.storeId}
                onChange={handleBranchChange}
                placeholder="พิมพ์เพื่อค้นหาสาขา..."
                disabled={!survey.phumipak}
              />
              {survey.storeId && (
                <div style={{ fontSize: '0.78rem', color: 'var(--haier-blue)', fontWeight: 600 }}>
                  ✓ Store ID: {survey.storeId} · {survey.changwat}
                </div>
              )}
              {touched && survey.phumipak && !survey.storeId && <span className="form-error">⚠ กรุณาเลือกสาขา</span>}
            </div>
          </div>
        </div>

        <button id="step1-next-btn" className="btn btn--primary btn--block" onClick={handleNext}>
          ถัดไป — ข้อมูลผู้กรอก →
        </button>
      </div>
    </div>
  )
}
