import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import imageCompression from 'browser-image-compression'
import { useSurvey } from '../../context/SurveyContext'
import StepIndicator from '../../components/StepIndicator'
import ThemeToggle from '../../components/ThemeToggle'
import toast from 'react-hot-toast'

const MIN_PHOTOS = 3
const MAX_PHOTOS = 10
const MAX_MB = 10

export default function Step4Photos() {
  const navigate = useNavigate()
  const { survey, addPhotos, removePhoto } = useSurvey()
  const fileRef = useRef(null)
  const [compressing, setCompressing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [submitTouched, setSubmitTouched] = useState(false)

  const photos = survey.photos
  const count = photos.length
  const canAddMore = count < MAX_PHOTOS

  const processFiles = async (files) => {
    if (!canAddMore) { toast.error(`สามารถอัพโหลดได้สูงสุด ${MAX_PHOTOS} รูป`); return }
    const remaining = MAX_PHOTOS - count
    const toProcess = Array.from(files).slice(0, remaining)

    // Filter valid images
    const valid = toProcess.filter(f => {
      if (!f.type.startsWith('image/')) { toast.error(`${f.name} ไม่ใช่ไฟล์รูปภาพ`); return false }
      if (f.size > MAX_MB * 1024 * 1024) { toast.error(`${f.name} ขนาดเกิน ${MAX_MB}MB`); return false }
      return true
    })
    if (!valid.length) return

    setCompressing(true)
    try {
      const compressed = await Promise.all(valid.map(async file => {
        let result = file
        if (file.size > 2 * 1024 * 1024) {
          result = await imageCompression(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true })
        }
        return {
          id: Date.now() + Math.random(),
          file: result,
          preview: URL.createObjectURL(result),
          name: file.name,
        }
      }))
      addPhotos(compressed)
      toast.success(`เพิ่ม ${compressed.length} รูปเรียบร้อย`)
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setCompressing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleFiles = (e) => processFiles(e.target.files)

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    processFiles(e.dataTransfer.files)
  }

  const handleNext = () => {
    setSubmitTouched(true)
    if (count >= MIN_PHOTOS) navigate('/survey/review')
  }

  const pct = Math.min((count / MIN_PHOTOS) * 100, 100)

  return (
    <div className="survey-page fade-in">
      <header className="page-header">
        <div className="page-header__inner">
          <button className="btn btn--ghost" style={{ color: '#fff', padding: '8px' }} onClick={() => navigate('/survey/step3')}>
            ← ย้อนกลับ
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>Haier Electrical Appliances (Thailand) Co., Ltd.</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              Haier TV Survey <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 10 }}>Sell out team</span>
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>ขั้นตอนที่ 4 จาก 4 — อัพโหลดรูปภาพ</div>
          </div>
          <ThemeToggle />
        </div>
        <StepIndicator current={4} />
      </header>

      <div className="survey-body">
        {/* Count bar */}
        <div className="photo-count-bar">
          <div>
            <span style={{ fontWeight: 700, color: count >= MIN_PHOTOS ? 'var(--accent-green)' : 'var(--text-primary)' }}>
              {count}/{MAX_PHOTOS} รูปภาพ
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 8 }}>
              (ต้องการอย่างน้อย {MIN_PHOTOS} รูป)
            </span>
          </div>
          {compressing && <div className="spinner spinner--blue" />}
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>

        {/* Drop zone */}
        {canAddMore && (
          <div
            className={`photo-drop-zone${dragOver ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div className="photo-drop-zone__icon">📷</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>แตะเพื่อถ่ายหรืออัพโหลดรูป</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tap to capture or upload photos</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เพิ่มได้อีก {MAX_PHOTOS - count} รูป · สูงสุด {MAX_MB}MB ต่อรูป</div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              style={{ display: 'none' }}
              onChange={handleFiles}
              id="photo-file-input"
            />
          </div>
        )}

        {/* Thumbnail grid */}
        {photos.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span>🖼️</span>
              <div style={{ fontWeight: 700 }}>รูปที่เลือก ({photos.length})</div>
            </div>
            <div className="card-body">
              <div className="photo-grid">
                {photos.map(p => (
                  <div key={p.id} className="photo-thumb">
                    <img src={p.preview} alt={p.name} />
                    <button
                      className="photo-thumb__delete"
                      title="ลบรูป"
                      onClick={() => removePhoto(p.id)}
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {submitTouched && count < MIN_PHOTOS && (
          <div className="form-error" style={{ justifyContent: 'center', fontSize: '0.9rem' }}>
            ⚠ กรุณาอัพโหลดรูปอย่างน้อย {MIN_PHOTOS} รูป (มีอยู่ {count} รูป)
          </div>
        )}

        <button
          id="step4-next-btn"
          className="btn btn--primary btn--block"
          disabled={compressing}
          onClick={handleNext}
        >
          {compressing ? <><div className="spinner" />กำลังประมวลผล...</> : `ตรวจสอบและส่งข้อมูล →`}
        </button>

        {/* Footer info */}
        <footer style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Haier Electrical Appliances (Thailand) Co., Ltd. · Sell out team
        </footer>
      </div>
    </div>
  )
}
