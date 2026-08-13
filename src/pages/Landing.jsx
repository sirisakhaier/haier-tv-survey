import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  const samples = [
    { file: '/sample-wall.jpg',   th: 'ผนัง',  en: 'Wall' },
    { file: '/sample-table.jpg',  th: 'โต๊ะ',  en: 'Table' },
    { file: '/sample-pillar.jpg', th: 'เสา',   en: 'Pillar' },
  ]

  return (
    <div className="survey-page fade-in">
      {/* Hero */}
      <header className="landing-hero">
        <img src="/haier-logo.png" alt="Haier" className="landing-hero__logo" />
        <h1 className="landing-hero__title">Haier TV Display Survey</h1>
        <p className="landing-hero__subtitle">สำรวจการจัดวางทีวี Haier หน้าร้าน<br/>สำหรับพนักงานและเมอร์แชนไดเซอร์</p>
      </header>

      {/* Sample Photos Reference */}
      <section className="landing-samples">
        <div className="container">
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 14, fontWeight: 600 }}>
            📸 ตัวอย่างรูปแบบการจัดวาง / Display Location Examples
          </p>
          <div className="sample-grid">
            {samples.map(s => (
              <div key={s.en} className="sample-card">
                <img src={s.file} alt={s.en} loading="lazy" />
                <div className="sample-card__label">
                  <strong>{s.th}</strong>
                  <span>{s.en}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="container" style={{ paddingBottom: 40 }}>
        <div style={{ padding: '0 0 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          กรุณาถ่ายรูปพร้อมกรอกข้อมูลรุ่นทีวี Haier ที่ร้านของท่าน
        </div>
        <button
          id="start-survey-btn"
          className="btn btn--primary btn--block"
          style={{ fontSize: '1.1rem', padding: '18px', borderRadius: '16px' }}
          onClick={() => navigate('/survey/step1')}
        >
          🚀 เริ่มทำแบบสำรวจ
        </button>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/admin/login" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Admin
          </a>
        </div>
      </div>
    </div>
  )
}
