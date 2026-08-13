import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import storesJson from '../data/stores.json'
import modelsJson from '../data/models.json'
import locationsJson from '../data/locations.json'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [stores, setStores] = useState([])
  const [models, setModels] = useState([])
  const [locations, setLocations] = useState([])
  const [chains, setChains] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [sr, mr, lr, cr] = await Promise.allSettled([
        fetch('/api/stores').then(r => r.json()),
        fetch('/api/models').then(r => r.json()),
        fetch('/api/locations').then(r => r.json()),
        fetch('/api/chains').then(r => r.json()),
      ])
      const loadedStores = sr.status === 'fulfilled' && Array.isArray(sr.value) ? sr.value : storesJson
      const loadedChains = cr.status === 'fulfilled' && Array.isArray(cr.value) ? cr.value : []

      setStores(loadedStores)
      setModels(mr.status === 'fulfilled' && Array.isArray(mr.value) ? mr.value : modelsJson)
      setLocations(lr.status === 'fulfilled' && Array.isArray(lr.value) ? lr.value : locationsJson)
      setChains(loadedChains)
    } catch {
      setStores(storesJson)
      setModels(modelsJson)
      setLocations(locationsJson)
      setChains([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Map of chain statuses
  const chainStatusMap = new Map()
  for (const c of chains) chainStatusMap.set(c.hang, c.status)

  // Active stores = stores whose retail chain (ห้าง) is not inactive
  const activeStores = stores.filter(s => chainStatusMap.get(s.hang) !== 'inactive')

  // Derived: unique active hangs for public survey
  const hangs = [...new Set(activeStores.map(s => s.hang))].sort()

  // Get regions for an active hang
  const regionsForHang = useCallback((hang) => {
    return [...new Set(activeStores.filter(s => s.hang === hang).map(s => s.phumipak))].sort()
  }, [stores, chains])

  // Get branches for an active hang + region
  const branchesForHangRegion = useCallback((hang, phumipak) => {
    return activeStores.filter(s => s.hang === hang && s.phumipak === phumipak)
  }, [stores, chains])

  const refreshFromApi = useCallback(async () => {
    await loadData()
  }, [loadData])

  return (
    <DataContext.Provider value={{
      stores, models, locations, chains, loading, hangs,
      regionsForHang, branchesForHangRegion,
      setStores, setModels, setLocations, setChains, refreshFromApi
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be inside DataProvider')
  return ctx
}
