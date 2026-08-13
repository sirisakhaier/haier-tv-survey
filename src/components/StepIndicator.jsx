// StepIndicator — shows progress through the 4 survey steps
export default function StepIndicator({ current }) {
  const steps = [
    { n: 1, label: 'ร้านค้า' },
    { n: 2, label: 'ข้อมูล' },
    { n: 3, label: 'รุ่น' },
    { n: 4, label: 'รูปภาพ' },
  ]

  return (
    <div className="step-bar">
      {steps.map((step, idx) => {
        const status = step.n < current ? 'done' : step.n === current ? 'active' : 'pending'
        return (
          <div key={step.n} className="step-item">
            <div className={`step-circle step-circle--${status}`} title={step.label}>
              {status === 'done' ? '✓' : step.n}
            </div>
            {idx < steps.length - 1 && (
              <div className="step-line" style={{ '--pct': status === 'done' ? '100%' : '0%' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
