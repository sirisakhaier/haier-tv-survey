import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import storesJson from '../data/stores.json'
import modelsJson from '../data/models.json'
import locationsJson from '../data/locations.json'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [stores, setStores] = useState([])
  const [models, setModels] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from API (backend), fallback to bundled JSON
    async function load() {
      try {
        const [sr, mr, lr] = await Promise.allSettled([
          fetch('/api/stores').then(r => r.json()),
          fetch('/api/models').then(r => r.json()),
          fetch('/api/locations').then(r => r.json()),
        ])
        const loadedStores = sr.status === 'fulfilled' && Array.isArray(sr.value) ? sr.value : storesJson
        setStores(loadedStores.map(s => ({ ...s, status: s.status || 'active' })))
        setModels(mr.status === 'fulfilled' && Array.isArray(mr.value) ? mr.value : modelsJson)
        setLocations(lr.status === 'fulfilled' && Array.isArray(lr.value) ? lr.value : locationsJson)
      } catch {
        setStores(storesJson.map(s => ({ ...s, status: s.status || 'active' })))
        setModels(modelsJson)
        setLocations(locationsJson)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Active stores filter helper (for public survey)
  const activeStores = stores.filter(s => s.status !== 'inactive')

  // Derived: unique hangs (only active stores)
  const hangs = [...new Set(activeStores.map(s => s.hang))].sort()

  // Get regions for a hang (only active stores)
  const regionsForHang = useCallback((hang) => {
    return [...new Set(activeStores.filter(s => s.hang === hang).map(s => s.phumipak))].sort()
  }, [stores])

  // Get branches for hang + region (only active stores)
  const branchesForHangRegion = useCallback((hang, phumipak) => {
    return activeStores.filter(s => s.hang === hang && s.phumipak === phumipak)
  }, [stores])

  const refreshFromApi = useCallback(async () => {
    try {
      const [sr, mr, lr] = await Promise.allSettled([
        fetch('/api/stores').then(r => r.json()),
        fetch('/api/models').then(r => r.json()),
        fetch('/api/locations').then(r => r.json()),
      ])
      if (sr.status === 'fulfilled' && Array.isArray(sr.value)) setStores(sr.value.map(s => ({ ...s, status: s.status || 'active' })))
      if (mr.status === 'fulfilled' && Array.isArray(mr.value)) setModels(mr.value)
      if (lr.status === 'fulfilled' && Array.isArray(lr.value)) setLocations(lr.value)
    } catch {}
  }, [])

  return (
    <DataContext.Provider value={{ stores, models, locations, loading, hangs, regionsForHang, branchesForHangRegion, setStores, setModels, setLocations, refreshFromApi }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be inside DataProvider')
  return ctx
}
