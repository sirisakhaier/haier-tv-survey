import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSurvey } from '../../context/SurveyContext'
import { useData } from '../../context/DataContext'
import StepIndicator from '../../components/StepIndicator'
import SearchableSelect from '../../components/SearchableSelect'
import ThemeToggle from '../../components/ThemeToggle'

export default function Step1Store() {
  const navigate = useNavigate()
  const { survey, update } = useSurvey()
  const { hangs, regionsForHang, branchesForHangRegion, loading } = useData()
  const [touched, setTouched] = useState(false)
  const [useSearchMode, setUseSearchMode] = useState(false)

  const regions = useMemo(() => survey.hang ? regionsForHang(survey.hang) : [], [survey.hang, regionsForHang])
  const branches = useMemo(() => (survey.hang && survey.phumipak) ? branchesForHangRegion(survey.hang, survey.phumipak) : [], [survey.hang, survey.phumipak, branchesForHangRegion])

  const branchOptions = useMemo(() => branches.map(b => ({
    value: b.store_id,
    label: b.store_name && b.store_name !== b.sakha ? `${b.sakha} (${b.store_name})` : b.sakha,
    sublabel: `${b.changwat} · ID: ${b.store_id}`,
  })), [branches])

  const handleHangChange = (e) => {
    update({ hang: e.target.value, phumipak: '', sakha: '', storeId: '', storeName: '', changwat: '' })
  }
  const handleRegionChange = (e) => {
    update({ phumipak: e.target.value, sakha: '', storeId: '', storeName: '', changwat: '' })
  }
  const handleBranchChange = (storeId) => {
    const store = branches.find(b => b.store_id === storeId)
    if (store) {
      update({
        storeId: store.store_id,
        sakha: store.sakha,
        storeName: store.store_name,
        changwat: store.changwat
      })
    }
  }

  const selectedStore = branches.find(b => b.store_id === survey.storeId)

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
      {/* Header with Company & Team Name */}
      <header className="page-header">
        <div className="page-header__inner">
          <img src="/haier-logo.png" alt="Haier" className="page-header__logo" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>Haier Electrical Appliances (Thailand) Co., Ltd.</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              Haier TV Survey <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 10 }}>Sell out team</span>
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>ขั้นตอนที่ 1 จาก 4 — เลือกร้านค้า</div>
          </div>
          <ThemeToggle />
        </div>
        <StepIndicator current={1} />
      </header>

      <div className="survey-body">
        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: '1.3rem' }}>🏪</span>
            <div>
              <div style={{ fontWeight: 700 }}>เลือกสาขาร้านค้า</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Select Retail Chain, Region & Branch</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 1. ห้าง */}
            <div className="form-group">
              <label className="form-label" htmlFor="hang-select">1. ห้าง (Retail Chain) <span className="required">*</span></label>
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

            {/* 2. ภูมิภาค */}
            <div className="form-group">
              <label className="form-label" htmlFor="region-select">2. ภูมิภาค (Region) <span className="required">*</span></label>
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

            {/* 3. สาขา (Branch / Store Name) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="branch-select">
                  3. สาขา / ชื่อร้านค้า (Store Name) <span className="required">*</span>
                </label>
                {survey.phumipak && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    style={{ fontSize: '0.75rem', color: 'var(--haier-blue)', padding: '2px 6px' }}
                    onClick={() => setUseSearchMode(!useSearchMode)}
                  >
                    {useSearchMode ? '📋 สลับเป็นรายการเลือก' : '🔍 สลับเป็นช่องค้นหา'}
                  </button>
                )}
              </div>

              {useSearchMode ? (
                /* Searchable Combobox */
                <SearchableSelect
                  options={branchOptions}
                  value={survey.storeId}
                  onChange={handleBranchChange}
                  placeholder="พิมพ์เพื่อค้นหาสาขาหรือชื่อร้านค้า..."
                  disabled={!survey.phumipak}
                />
              ) : (
                /* Native Dropdown — 100% reliable on all mobile browsers */
                <div className="select-wrapper">
                  <select
                    id="branch-select"
                    className={`form-select${touched && survey.phumipak && !survey.storeId ? ' error' : ''}`}
                    value={survey.storeId}
                    onChange={e => handleBranchChange(e.target.value)}
                    disabled={!survey.phumipak}
                  >
                    <option value="">
                      {!survey.phumipak ? '-- กรุณาเลือกภูมิภาคก่อน --' : `-- เลือกสาขา (${branches.length} สาขา) --`}
                    </option>
                    {branches.map(b => (
                      <option key={b.store_id} value={b.store_id}>
                        {b.sakha} {b.store_name && b.store_name !== b.sakha ? `(${b.store_name})` : ''} — {b.changwat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Store Details Selected Card */}
              {survey.storeId && (
                <div style={{ background: 'var(--haier-blue-pale)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-blue)', marginTop: 4 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--haier-blue)' }}>
                    ✓ {survey.sakha}
                  </div>
                  {survey.storeName && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Store Name: <strong>{survey.storeName}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    จังหวัด: {survey.changwat} · Store ID: <code style={{ fontFamily: 'monospace' }}>{survey.storeId}</code>
                  </div>
                </div>
              )}

              {touched && survey.phumipak && !survey.storeId && <span className="form-error">⚠ กรุณาเลือกสาขา</span>}
            </div>

          </div>
        </div>

        <button id="step1-next-btn" className="btn btn--primary btn--block" onClick={handleNext}>
          ถัดไป — ข้อมูลผู้กรอก →
        </button>

        {/* Footer info */}
        <footer style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Haier Electrical Appliances (Thailand) Co., Ltd. · Sell out team
        </footer>
      </div>
    </div>
  )
}
