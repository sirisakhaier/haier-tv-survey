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
      {/* Hero Header */}
      <header className="landing-hero">
        <img src="/haier-logo.png" alt="Haier Logo" className="landing-hero__logo" />
        <div className="landing-hero__company">Haier Electrical Appliances (Thailand) Co., Ltd.</div>
        <div style={{ margin: '6px 0 12px' }}>
          <span className="landing-hero__team">🏷️ Sell out team</span>
        </div>
        <h1 className="landing-hero__title">Haier TV Display Survey</h1>
        <p className="landing-hero__subtitle">สำรวจการจัดวางทีวี Haier หน้าร้าน<br/>สำหรับพนักงานและเมอร์แชนไดเซอร์</p>
      </header>

      {/* Sample Photos Reference */}
      <section className="landing-samples">
        <div className="container">
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 14, fontWeight: 600 }}>
            📸 ตัวอย่างรูปแบบการจัดวาง (ภาพเต็ม) / Display Location Examples
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
      <div className="container" style={{ paddingBottom: 32 }}>
        <div style={{ padding: '0 0 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
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

        {/* Footer info */}
        <footer style={{ textAlign: 'center', marginTop: 24, fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontWeight: 600 }}>Haier Electrical Appliances (Thailand) Co., Ltd.</div>
          <div>Sell out team</div>
          <div style={{ marginTop: 6 }}>
            <a href="/admin/login" style={{ color: 'var(--haier-blue)', textDecoration: 'underline' }}>
              Admin Module
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
