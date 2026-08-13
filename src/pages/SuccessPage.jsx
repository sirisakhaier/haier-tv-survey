import { useNavigate } from 'react-router-dom'
import { useSurvey } from '../context/SurveyContext'

export default function SuccessPage() {
  const navigate = useNavigate()
  const { reset } = useSurvey()

  const handleAnother = () => {
    reset()
    navigate('/survey/step1')
  }

  return (
    <div className="survey-page fade-in" style={{ alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #F0F4FF 0%, #E8F5E9 100%)' }}>
      <div style={{ maxWidth: 380, width: '100%' }}>
        <div className="success-icon">✓</div>
        <h1 style={{ marginTop: 24, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          ส่งข้อมูลสำเร็จ!
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '1rem' }}>
          Survey Submitted Successfully
        </p>
        <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '0.875rem', lineHeight: 1.7 }}>
          ขอบคุณที่ส่งข้อมูลการจัดวางทีวี Haier<br/>
          ข้อมูลของท่านได้รับการบันทึกเรียบร้อยแล้ว
        </p>

        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
