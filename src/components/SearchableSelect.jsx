import { useState, useRef, useEffect } from 'react'

/**
 * SearchableSelect — a combobox-style dropdown with type-ahead filtering.
 * Props:
 *   options: [{value, label, sublabel?}]
 *   value: current selected value
 *   onChange: (value) => void
 *   placeholder: string
 *   disabled: bool
 */
export default function SearchableSelect({ options = [], value, onChange, placeholder = 'ค้นหา...', disabled }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef(null)
  const dropRef = useRef(null)
  const wrapRef = useRef(null)

  const selected = options.find(o => o.value === value)

  const filtered = query.trim()
    ? options.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(query.toLowerCase()))
      )
    : options

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (opt) => {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') { setOpen(true); e.preventDefault() }
      return
    }
    if (e.key === 'ArrowDown') { setHighlighted(h => Math.min(h + 1, filtered.length - 1)); e.preventDefault() }
    else if (e.key === 'ArrowUp') { setHighlighted(h => Math.max(h - 1, 0)); e.preventDefault() }
    else if (e.key === 'Enter' && filtered[highlighted]) { handleSelect(filtered[highlighted]); e.preventDefault() }
    else if (e.key === 'Escape') { setOpen(false); setQuery(''); e.preventDefault() }
  }

  const handleFocus = () => {
    setOpen(true)
    setHighlighted(0)
    setQuery('')
  }

  const handleChange = (e) => {
    setQuery(e.target.value)
    setOpen(true)
    setHighlighted(0)
  }

  // Show query while typing, selected label when closed, placeholder when nothing selected
  const displayValue = open ? query : (selected ? selected.label : '')

  return (
    <div className="searchable-select" ref={wrapRef}>
      <div className="searchable-select__input-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          className="form-input searchable-select__input"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={selected && !open ? selected.label : placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
      </div>
      {open && !disabled && (
        <div className="searchable-select__dropdown" ref={dropRef} role="listbox">
          {filtered.length === 0 ? (
            <div className="searchable-select__empty">ไม่พบผลลัพธ์</div>
          ) : (
            filtered.slice(0, 200).map((opt, idx) => (
              <div
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                className={`searchable-select__option${idx === highlighted ? ' highlighted' : ''}${opt.value === value ? ' selected' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(opt) }}
                onMouseEnter={() => setHighlighted(idx)}
              >
                <div>{opt.label}</div>
                {opt.sublabel && <div style={{ fontSize: '0.75rem', opacity: 0.65, marginTop: 1 }}>{opt.sublabel}</div>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
