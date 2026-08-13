import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  const [activeSample, setActiveSample] = useState(null) // { file, th, en }

  const samples = [
    { file: '/sample-wall.jpg',   th: 'ผนัง',  en: 'Wall' },
    { file: '/sample-table.jpg',  th: 'โต๊ะ',  en: 'Table' },
    { file: '/sample-pillar.jpg', th: 'เสา',   en: 'Pillar' },
  ]

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveSample(null)
    }
    if (activeSample) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeSample])

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
            📸 ตัวอย่างรูปแบบการจัดวาง (แตะที่รูปเพื่อขยายเต็มจอ) / Click image for full screen view
          </p>
          <div className="sample-grid">
            {samples.map(s => (
              <div
                key={s.en}
                className="sample-card"
                onClick={() => setActiveSample(s)}
                title={`คลิกเพื่อดูรูปขยายเต็มจอ: ${s.th} (${s.en})`}
              >
                <img src={s.file} alt={s.en} loading="lazy" />
                <div className="sample-card__label">
                  <strong>{s.th}</strong>
                  <span>{s.en}</span>
                  <div style={{ fontSize: '0.68rem', color: 'var(--haier-blue)', fontWeight: 600, marginTop: 2 }}>
                    🔍 แตะขยายเต็มจอ
                  </div>
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

      {/* Full-Screen Image View Lightbox */}
      {activeSample && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 16px',
            backdropFilter: 'blur(6px)',
            cursor: 'pointer',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setActiveSample(null)}
          title="แตะที่ใดก็ได้เพื่อปิดรูปภาพ"
        >
          {/* Lightbox Header */}
          <div
            style={{
              width: '100%',
              maxWidth: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff',
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📍 ตัวอย่างการจัดวาง: <strong>{activeSample.th}</strong> ({activeSample.en})</span>
            </div>
            <button
              type="button"
              style={{
                background: 'rgba(255,255,255,0.25)',
                border: 'none',
                color: '#fff',
                width: 32,
                height: 32,
                borderRadius: '50%',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={(e) => { e.stopPropagation(); setActiveSample(null); }}
              title="ปิดรูปภาพ"
            >
              ✕
            </button>
          </div>

          {/* Fullscreen Image Display */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 0',
              width: '100%',
            }}
          >
            <img
              src={activeSample.file}
              alt={activeSample.en}
              style={{
                maxWidth: '96vw',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: 14,
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                border: '2px solid rgba(255,255,255,0.3)',
              }}
            />
          </div>

          {/* Lightbox Footer Instruction */}
          <div
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'rgba(0,0,0,0.4)',
              padding: '8px 20px',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            🔍 แตะที่ใดก็ได้บนหน้าจอเพื่อปิดดูรูปเต็ม (Tap anywhere to close)
          </div>
        </div>
      )}
    </div>
  )
}
