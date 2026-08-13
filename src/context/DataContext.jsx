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
    // Try to load from API (backend), fallback to bundled JSON
    async function load() {
      try {
        const [sr, mr, lr] = await Promise.allSettled([
          fetch('/api/stores').then(r => r.json()),
          fetch('/api/models').then(r => r.json()),
          fetch('/api/locations').then(r => r.json()),
        ])
        setStores(sr.status === 'fulfilled' && Array.isArray(sr.value) ? sr.value : storesJson)
        setModels(mr.status === 'fulfilled' && Array.isArray(mr.value) ? mr.value : modelsJson)
        setLocations(lr.status === 'fulfilled' && Array.isArray(lr.value) ? lr.value : locationsJson)
      } catch {
        setStores(storesJson)
        setModels(modelsJson)
        setLocations(locationsJson)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Derived: unique hangs
  const hangs = [...new Set(stores.map(s => s.hang))].sort()

  // Get regions for a hang
  const regionsForHang = useCallback((hang) => {
    return [...new Set(stores.filter(s => s.hang === hang).map(s => s.phumipak))].sort()
  }, [stores])

  // Get branches for hang + region
  const branchesForHangRegion = useCallback((hang, phumipak) => {
    return stores.filter(s => s.hang === hang && s.phumipak === phumipak)
  }, [stores])

  const refreshFromApi = useCallback(async () => {
    try {
      const [sr, mr, lr] = await Promise.allSettled([
        fetch('/api/stores').then(r => r.json()),
        fetch('/api/models').then(r => r.json()),
        fetch('/api/locations').then(r => r.json()),
      ])
      if (sr.status === 'fulfilled' && Array.isArray(sr.value)) setStores(sr.value)
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
