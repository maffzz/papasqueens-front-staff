import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'

export function useDeliveryData(pollIntervalMs = 20000) {
  const [riders, setRiders] = useState([])
  const [actives, setActives] = useState([])
  const [ridersLoading, setRidersLoading] = useState(false)
  const [activesLoading, setActivesLoading] = useState(false)
  const [loadingAll, setLoadingAll] = useState(true)
  const { showToast } = useToast()

  const loadRiders = useCallback(async () => {
    setRidersLoading(true)
    try {
      const data = await api('/riders', { timeout: 15000 })
      setRiders(Array.isArray(data) ? data : (data.items || []))
    } catch (e) {
      console.error('Error loading riders:', e)
      setRiders([])
      showToast({ type: 'error', message: 'Error al cargar repartidores' })
    } finally {
      setRidersLoading(false)
    }
  }, [showToast])

  const loadActives = useCallback(async () => {
    setActivesLoading(true)
    try {
      // Solo entregas que están listas para asignar a un repartidor
      const data = await api('/delivery?status=listo_para_entrega', { timeout: 15000 })
      const list = Array.isArray(data) ? data : (data.items || [])
      setActives(list)
    } catch (e) {
      console.error('Error loading active deliveries:', e)
      setActives([])
      showToast({ type: 'error', message: 'Error al cargar entregas activas' })
    } finally {
      setActivesLoading(false)
    }
  }, [showToast])

  const loadAll = useCallback(async () => {
    setLoadingAll(true)
    await Promise.all([loadRiders(), loadActives()])
    setLoadingAll(false)
  }, [loadRiders, loadActives])

  useEffect(() => {
    loadAll()
    if (!pollIntervalMs || pollIntervalMs <= 0) return
    const t1 = setInterval(loadRiders, pollIntervalMs)
    const t2 = setInterval(loadActives, pollIntervalMs)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [loadAll, loadRiders, loadActives, pollIntervalMs])

  return {
    riders,
    actives,
    ridersLoading,
    activesLoading,
    loadingAll,
    reloadRiders: loadRiders,
    reloadActives: loadActives,
    reloadAll: loadAll,
  }
}
