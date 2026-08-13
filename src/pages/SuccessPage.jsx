import { useNavigate } from 'react-router-dom'
import { useSurvey } from '../context/SurveyContext'
import ThemeToggle from '../components/ThemeToggle'

export default function SuccessPage() {
  const navigate = useNavigate()
  const { reset } = useSurvey()

  const handleAnother = () => {
    reset()
    navigate('/survey/step1')
  }

  return (
    <div className="survey-page fade-in" style={{ alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', background: 'var(--bg-primary)', position: 'relative' }}>
      <ThemeToggle style={{ position: 'absolute', top: 16, right: 16 }} />
      <div style={{ maxWidth: 380, width: '100%' }}>
        <div className="success-icon">✓</div>
        <h1 style={{ marginTop: 20, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          ส่งข้อมูลสำเร็จ!
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.95rem', fontWeight: 600 }}>
          Haier Electrical Appliances (Thailand) Co., Ltd.
        </p>
        <p style={{ color: 'var(--haier-blue)', fontSize: '0.85rem', fontWeight: 700, marginTop: 2 }}>
          Sell out team
        </p>
        <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '0.875rem', lineHeight: 1.7 }}>
          ขอบคุณที่ส่งข้อมูลการจัดวางทีวี Haier<br/>
          ข้อมูลของท่านได้รับการบันทึกเรียบร้อยแล้ว
        </p>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            id="submit-another-btn"
            className="btn btn--primary btn--block"
            onClick={handleAnother}
            style={{ fontSize: '1.05rem', padding: '16px' }}
          >
            🔄 ส่งแบบสำรวจสาขาอื่น
          </button>
          <button className="btn btn--secondary btn--block" onClick={() => navigate('/')}>
            🏠 กลับหน้าหลัก
          </button>
        </div>
      </div>
    </div>
  )
}
