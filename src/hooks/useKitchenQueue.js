import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'

export function useKitchenQueue(pollIntervalMs = 15000) {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api('/kitchen/queue')
      setQueue(Array.isArray(data) ? data : (data.items || []))
    } catch (e) {
      console.error('Error loading kitchen queue:', e)
      setQueue([])
      showToast({ type: 'error', message: 'Error cargando la cola de pedidos' })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    load()
    if (!pollIntervalMs || pollIntervalMs <= 0) return
    const t = setInterval(load, pollIntervalMs)
    return () => clearInterval(t)
  }, [load, pollIntervalMs])

  return { queue, loading, reload: load }
}
