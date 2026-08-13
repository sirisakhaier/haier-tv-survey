import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ style, className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 20,
        fontSize: '0.8rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 71, 186, 0.08)',
        color: isDark ? '#F8FAFC' : '#0047BA',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 71, 186, 0.2)'}`,
        backdropFilter: 'blur(4px)',
        userSelect: 'none',
        ...style,
      }}
      title={`สลับโหมด: ${isDark ? 'Light Mode (โหมดสว่าง)' : 'Dark Mode (โหมดมืด)'}`}
    >
      <span>{isDark ? '🌙 Dark' : '☀️ Light'}</span>
    </button>
  )
}
