import { createContext, useContext, useState, useCallback } from 'react'

const SurveyContext = createContext(null)

const INITIAL_STATE = {
  // Step 1
  hang: '',
  phumipak: '',
  sakha: '',
  storeId: '',
  storeName: '',
  changwat: '',
  // Step 2
  respondentName: '',
  phone: '',
  // Step 3
  entries: [], // [{model_code, sub_category, size, location_code, location_label_th, location_label_en}]
  // Step 4
  photos: [],  // [{id, file, preview, compressed}]
}

export function SurveyProvider({ children }) {
  const [survey, setSurvey] = useState(INITIAL_STATE)

  const update = useCallback((patch) => {
    setSurvey(prev => ({ ...prev, ...patch }))
  }, [])

  const reset = useCallback(() => setSurvey(INITIAL_STATE), [])

  const addEntry = useCallback((entry) => {
    setSurvey(prev => {
      const dup = prev.entries.find(
        e => e.model_code === entry.model_code && e.location_code === entry.location_code
      )
      if (dup) return prev
      return { ...prev, entries: [...prev.entries, { ...entry, id: Date.now() + Math.random() }] }
    })
  }, [])

  const removeEntry = useCallback((id) => {
    setSurvey(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }))
  }, [])

  const addPhotos = useCallback((newPhotos) => {
    setSurvey(prev => {
      const combined = [...prev.photos, ...newPhotos]
      return { ...prev, photos: combined.slice(0, 10) }
    })
  }, [])

  const removePhoto = useCallback((id) => {
    setSurvey(prev => {
      const photo = prev.photos.find(p => p.id === id)
      if (photo?.preview) URL.revokeObjectURL(photo.preview)
      return { ...prev, photos: prev.photos.filter(p => p.id !== id) }
    })
  }, [])

  return (
    <SurveyContext.Provider value={{ survey, update, reset, resetSurvey: reset, addEntry, removeEntry, addPhotos, removePhoto }}>
      {children}
    </SurveyContext.Provider>
  )
}

export const useSurvey = () => {
  const ctx = useContext(SurveyContext)
  if (!ctx) throw new Error('useSurvey must be inside SurveyProvider')
  return ctx
}
