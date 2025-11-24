import React, { useEffect, useRef, useState } from 'react'
import { api, getTenantId } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useDeliveryData } from '../hooks/useDeliveryData'
import L from 'leaflet'

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const TENANT_ORIGINS = {
  tenant_pq_barranco: { lat: -12.1372, lng: -77.0220 }, // Barranco (UTEC)
  tenant_pq_puruchuco: { lat: -12.0325, lng: -76.9302 },
  tenant_pq_vmt: { lat: -12.1630, lng: -76.9635 },
  tenant_pq_jiron: { lat: -12.0560, lng: -77.0370 },
}

export default function Delivery() {
  const [filter, setFilter] = useState('')
  const [trackingId, setTrackingId] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('')
  const [selectedRiderId, setSelectedRiderId] = useState('')
  const [autoGPS, setAutoGPS] = useState(false)
  const [gpsWatchId, setGpsWatchId] = useState(null)
  const [simulatingRoute, setSimulatingRoute] = useState(false)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const polyRef = useRef(null)
  const routeRef = useRef(null)
  const destRef = useRef(null) // destino del cliente para trazar ruta origen-destino
  const simulationIntervalRef = useRef(null)
  const { showToast } = useToast()
  const {
    riders,
    actives,
    ridersLoading,
    activesLoading,
    loadingAll,
    reloadRiders,
    reloadActives,
  } = useDeliveryData(20000)

  async function setStatus(id, status) {
    try {
      await api(`/riders/${encodeURIComponent(id)}/status`, { 
        method:'PATCH', 
        body: JSON.stringify({ status }),
        timeout: 10000 
      })
      await reloadRiders()
      showToast({ type:'success', message: `Estado actualizado a "${status}"` })
    } catch (e) {
      console.error('Error setting rider status:', e)
      showToast({ type:'error', message: e.message || 'Error al actualizar estado del repartidor' })
    }
  }

  async function assignFromCard(deliveryId, staffId) {
    if (!deliveryId || !staffId) {
      showToast({ type: 'warning', message: 'Ingresa un ID de repartidor válido' })
      return
    }
    try {
      await api('/delivery/assign', {
        method: 'POST',
        body: JSON.stringify({ id_delivery: deliveryId, id_staff: staffId }),
        timeout: 15000,
      })
      showToast({ type: 'success', message: 'Repartidor asignado a la entrega' })
      await reloadActives()
    } catch (e) {
      console.error('Error assigning from card:', e)
      showToast({ type: 'error', message: e.message || 'No se pudo asignar el delivery' })
    }
  }

  async function assign(ev) {
    // Manejar invocaciones tanto desde onSubmit real como desde llamadas manuales
    ev?.preventDefault?.()
    const formEl = ev?.currentTarget || document.getElementById('assign-form')
    if (!formEl) return

    const fd = new FormData(formEl)
    const payload = { id_order: fd.get('order'), id_staff: fd.get('rider') }
    const msg = document.getElementById('assign-msg')
    const submitBtn = formEl.querySelector('button[type="submit"]')
    const originalText = submitBtn ? submitBtn.textContent : 'Asignar'
    
    if (!payload.id_order || !payload.id_staff) {
      msg.textContent = 'Selecciona un pedido y un repartidor'
      msg.style.color = '#dc2626'
      showToast({ type:'warning', message:'Selecciona un pedido y un repartidor en las listas' })
      return
    }
    
    if (submitBtn) {
      submitBtn.disabled = true
      submitBtn.textContent = 'Asignando...'
    }
    msg.textContent = ''
    
    try {
      const res = await api('/delivery/assign', { 
        method:'POST', 
        body: JSON.stringify(payload),
        timeout: 15000 
      })
      msg.textContent = `Asignado (delivery: ${res.id_delivery || res.delivery_id || res.id || '—'})`
      msg.style.color = '#16a34a'
      showToast({ type:'success', message:'Pedido asignado correctamente' })
      formEl.reset()
      setSelectedOrderId('')
      setSelectedDeliveryId('')
      setSelectedRiderId('')
      await reloadActives()
    } catch (e) {
      console.error('Error assigning delivery:', e)
      msg.textContent = e.message || 'Error al asignar delivery'
      msg.style.color = '#dc2626'
      showToast({ type:'error', message: e.message || 'Error al asignar pedido' })
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false
        submitBtn.textContent = originalText
      }
    }
  }

  async function action(kind, id) {
    const msg = document.getElementById('actions-msg')
    const actionBtn = event.target
    const originalText = actionBtn.textContent
    
    actionBtn.disabled = true
    actionBtn.textContent = 'Procesando...'
    msg.textContent = ''
    
    try {
      let endpoint, method = 'POST'
      if (kind === 'handoff') {
        endpoint = `/delivery/orders/${encodeURIComponent(id)}/handoff`
      } else if (kind === 'delivered') {
        endpoint = `/delivery/orders/${encodeURIComponent(id)}/delivered`
      } else if (kind.startsWith('status-')) {
        const status = kind.replace('status-','')
        endpoint = `/delivery/${encodeURIComponent(id)}/status`
        method = 'PATCH'
        await api(endpoint, { method, body: JSON.stringify({ status }), timeout: 10000 })
      } else {
        await api(endpoint, { method, timeout: 10000 })
      }
      
      msg.textContent = 'Acción realizada exitosamente'
      msg.style.color = '#16a34a'
      showToast({ type:'success', message:'Acción realizada correctamente' })
      await reloadActives()
    } catch (e) {
      console.error('Error executing action:', e)
      msg.textContent = e.message || 'Error ejecutando acción'
      msg.style.color = '#dc2626'
      showToast({ type:'error', message: e.message || 'Error al ejecutar acción' })
    } finally {
      actionBtn.disabled = false
      actionBtn.textContent = originalText
    }
  }

  async function sendLocation(ev) {
    ev.preventDefault()
    const fd = new FormData(ev.currentTarget)
    const payload = { id_delivery: fd.get('delivery'), lat: parseFloat(fd.get('lat')), lng: parseFloat(fd.get('lng')) }
    const msg = document.getElementById('loc-msg')
    const submitBtn = ev.currentTarget.querySelector('button[type="submit"]')
    const originalText = submitBtn.textContent
    
    if (!payload.id_delivery || !isFinite(payload.lat) || !isFinite(payload.lng)) {
      msg.textContent = 'Datos inválidos'
      msg.style.color = '#dc2626'
      showToast({ type:'warning', message:'Completa ID y coordenadas válidas' })
      return
    }
    
    submitBtn.disabled = true
    submitBtn.textContent = 'Enviando...'
    msg.textContent = ''
    
    try {
      await api('/delivery/location', { 
        method:'POST', 
        body: JSON.stringify(payload),
        timeout: 10000 
      })
      msg.textContent = 'Ubicación actualizada correctamente'
      msg.style.color = '#16a34a'
      showToast({ type:'success', message:'Ubicación actualizada' })
    } catch (e) {
      console.error('Error sending location:', e)
      msg.textContent = e.message || 'Error enviando ubicación'
      msg.style.color = '#dc2626'
      showToast({ type:'error', message: e.message || 'Error al enviar ubicación' })
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = originalText
    }
  }

  function useGPS() {
    const form = document.getElementById('loc-form')
    if (!navigator.geolocation) { 
      showToast({ type: 'error', message: 'Geolocalización no soportada en este navegador' })
      return 
    }
    navigator.geolocation.getCurrentPosition(pos => {
      form.querySelector('[name="lat"]').value = pos.coords.latitude.toFixed(6)
      form.querySelector('[name="lng"]').value = pos.coords.longitude.toFixed(6)
      showToast({ type: 'success', message: '📍 Ubicación obtenida' })
    }, (error) => {
      console.error('GPS error:', error)
      showToast({ type: 'error', message: 'No se pudo obtener la ubicación. Verifica los permisos.' })
    })
  }

  function toggleAutoGPS() {
    if (!navigator.geolocation) {
      showToast({ type: 'error', message: 'Geolocalización no soportada' })
      return
    }

    if (autoGPS) {
      // Detener tracking automático
      if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId)
        setGpsWatchId(null)
      }
      setAutoGPS(false)
      showToast({ type: 'info', message: '📍 Tracking GPS desactivado' })
    } else {
      // Iniciar tracking automático
      const form = document.getElementById('loc-form')
      const deliveryId = form.querySelector('[name="delivery"]').value

      if (!deliveryId) {
        showToast({ type: 'warning', message: 'Ingresa un ID de delivery primero' })
        return
      }

      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          
          // Actualizar campos del formulario
          form.querySelector('[name="lat"]').value = lat.toFixed(6)
          form.querySelector('[name="lng"]').value = lng.toFixed(6)

          // Enviar ubicación automáticamente cada vez que cambie
          try {
            await api('/delivery/location', {
              method: 'POST',
              body: JSON.stringify({ id_delivery: deliveryId, lat, lng }),
              timeout: 5000
            })
            console.log('📍 Ubicación actualizada:', lat, lng)
          } catch (e) {
            console.error('Error enviando ubicación automática:', e)
          }
        },
        (error) => {
          console.error('GPS watch error:', error)
          showToast({ type: 'error', message: 'Error en tracking GPS' })
          setAutoGPS(false)
          if (gpsWatchId !== null) {
            navigator.geolocation.clearWatch(gpsWatchId)
            setGpsWatchId(null)
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )

      setGpsWatchId(watchId)
      setAutoGPS(true)
      showToast({ type: 'success', message: '📍 Tracking GPS activado' })
    }
  }

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId)
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
      }
    }
  }, [gpsWatchId])

  // Función para interpolar entre dos puntos
  function interpolate(start, end, progress) {
    return {
      lat: start.lat + (end.lat - start.lat) * progress,
      lng: start.lng + (end.lng - start.lng) * progress
    }
  }

  // Función para generar puntos intermedios en una ruta (simulando calles)
  function generateRoutePoints(origin, destination, numPoints = 20) {
    const points = []
    
    // Agregar variación para simular que sigue calles (no línea recta)
    for (let i = 0; i <= numPoints; i++) {
      const progress = i / numPoints
      
      // Interpolación base
      const basePoint = interpolate(origin, destination, progress)
      
      // Agregar "ruido" para simular calles (más en el medio del trayecto)
      const noiseAmount = Math.sin(progress * Math.PI) * 0.002 // Máximo ruido en el medio
      const latNoise = (Math.random() - 0.5) * noiseAmount
      const lngNoise = (Math.random() - 0.5) * noiseAmount
      
      points.push({
        lat: basePoint.lat + latNoise,
        lng: basePoint.lng + lngNoise
      })
    }
    
    return points
  }

  function startRouteSimulation() {
    const tenantId = getTenantId()
    const origin = TENANT_ORIGINS[tenantId]
    const dest = destRef.current

    if (!origin || !dest) {
      showToast({ type: 'warning', message: 'Selecciona un delivery con dirección primero' })
      return
    }

    // Generar ruta con puntos intermedios
    const routePoints = generateRoutePoints(origin, dest, 30)
    
    setSimulatingRoute(true)
    setSimulationProgress(0)
    
    let currentIndex = 0
    const totalPoints = routePoints.length
    const intervalTime = 200 // ms entre cada punto (más rápido = más fluido)

    // Limpiar simulación anterior si existe
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
    }

    // Inicializar mapa si no existe
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([origin.lat, origin.lng], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        maxZoom: 19, 
        attribution: '&copy; OpenStreetMap' 
      }).addTo(mapRef.current)
    }

    const map = mapRef.current

    // Dibujar ruta completa (línea punteada azul)
    if (routeRef.current) {
      map.removeLayer(routeRef.current)
    }
    routeRef.current = L.polyline(
      routePoints.map(p => [p.lat, p.lng]), 
      { color: '#0ea5e9', dashArray: '6 4', weight: 3, opacity: 0.6 }
    ).addTo(map)

    // Ajustar vista para mostrar toda la ruta
    map.fitBounds(routeRef.current.getBounds(), { padding: [50, 50] })

    // Crear marcador de destino
    if (destRef.current) {
      L.marker([dest.lat, dest.lng], { icon: markerIcon })
        .addTo(map)
        .bindPopup('🏠 Destino')
    }

    // Crear marcador de origen
    L.marker([origin.lat, origin.lng], { 
      icon: L.divIcon({
        html: '<div style="background: #03592e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).addTo(map).bindPopup('🏪 Local')

    // Crear polyline para el track (se irá dibujando)
    if (polyRef.current) {
      map.removeLayer(polyRef.current)
    }
    polyRef.current = L.polyline([], { color: '#16a34a', weight: 4 }).addTo(map)

    // Crear marcador del delivery (se moverá)
    if (markerRef.current) {
      map.removeLayer(markerRef.current)
    }
    markerRef.current = L.marker([origin.lat, origin.lng], {
      icon: L.divIcon({
        html: '<div style="background: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>',
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(map).bindPopup('🚚 Delivery en camino')

    showToast({ type: 'success', message: '🚚 Simulación de ruta iniciada' })

    // Animar el movimiento
    simulationIntervalRef.current = setInterval(() => {
      if (currentIndex >= totalPoints - 1) {
        clearInterval(simulationIntervalRef.current)
        setSimulatingRoute(false)
        setSimulationProgress(100)
        showToast({ type: 'success', message: '✅ Delivery llegó al destino' })
        return
      }

      const currentPoint = routePoints[currentIndex]
      
      // Actualizar marcador
      if (markerRef.current) {
        markerRef.current.setLatLng([currentPoint.lat, currentPoint.lng])
      }

      // Actualizar polyline (track recorrido)
      if (polyRef.current) {
        const latlngs = routePoints.slice(0, currentIndex + 1).map(p => [p.lat, p.lng])
        polyRef.current.setLatLngs(latlngs)
      }

      // Actualizar progreso
      const progress = Math.round((currentIndex / (totalPoints - 1)) * 100)
      setSimulationProgress(progress)

      currentIndex++
    }, intervalTime)
  }

  function stopRouteSimulation() {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
      simulationIntervalRef.current = null
    }
    setSimulatingRoute(false)
    showToast({ type: 'info', message: '⏸️ Simulación detenida' })
  }

  async function queryDelivery(ev) {
    ev.preventDefault()
    const id = new FormData(ev.currentTarget).get('delivery')
    try { const data = await api(`/delivery/${encodeURIComponent(id)}`); renderDelivery(data) } catch (e) { document.getElementById('delivery-view').innerHTML = '<div class="card">Error consultando delivery</div>' }
  }

  async function track(ev) {
    ev.preventDefault()
    const id = new FormData(ev.currentTarget).get('delivery')
    setTrackingId(id)
    try { const data = await api(`/delivery/${encodeURIComponent(id)}/track`); renderTrack(data) } catch (e) { document.getElementById('track-view').innerHTML = '<div class="card">Error consultando track</div>' }
  }

  function renderDelivery(d) {
    const wrap = document.getElementById('delivery-view')
    if (!d) { wrap.innerHTML = '<div class="card">No encontrado</div>'; return }
    wrap.innerHTML = `<div class="card"><div><strong>Delivery #${d.id_delivery || d.id}</strong></div><div>Pedido: ${d.id_order || d.order_id}</div><div>Rider: ${d.id_staff || d.rider_id}</div><div>Estado: ${d.status || d.estado}</div><div>Ubicación: ${(d.location && (d.location.lat + ', ' + d.location.lng)) || '—'}</div></div>`
  }

  function renderTrack(t) {
    const wrap = document.getElementById('track-view')
    if (!t) { wrap.innerHTML = '<div class="card">Sin datos</div>'; return }
    const points = Array.isArray(t) ? t : (t.points || [])
    const last = points[points.length - 1]

    if (!mapRef.current) {
      mapRef.current = L.map('map').setView(last ? [last.lat, last.lng] : [-12.0464, -77.0428], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(mapRef.current)
    }
    const map = mapRef.current
    const latlngs = points.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number').map(p => [p.lat, p.lng])

    // Limpia línea de track anterior
    if (polyRef.current) { map.removeLayer(polyRef.current); polyRef.current = null }
    if (latlngs.length) {
      polyRef.current = L.polyline(latlngs, { color: '#03592e' }).addTo(map)
      map.fitBounds(polyRef.current.getBounds(), { padding: [20, 20] })
    }
    if (markerRef.current) { map.removeLayer(markerRef.current); markerRef.current = null }
    if (last && typeof last.lat === 'number' && typeof last.lng === 'number') {
      markerRef.current = L.marker([last.lat, last.lng], { icon: markerIcon }).addTo(map)
    }

    // Dibuja línea entre local (origen) y dirección del cliente (destino)
    const tenantId = getTenantId()
    const origin = TENANT_ORIGINS[tenantId]
    const dest = destRef.current
    if (origin && dest && typeof dest.lat === 'number' && typeof dest.lng === 'number') {
      const routeLatLngs = [
        [origin.lat, origin.lng],
        [dest.lat, dest.lng],
      ]
      if (routeRef.current) { map.removeLayer(routeRef.current); routeRef.current = null }
      routeRef.current = L.polyline(routeLatLngs, { color: '#0ea5e9', dashArray: '6 4' }).addTo(map)
      if (!latlngs.length) {
        map.fitBounds(routeRef.current.getBounds(), { padding: [20, 20] })
      }
    } else if (routeRef.current) {
      map.removeLayer(routeRef.current)
      routeRef.current = null
    }
  }

  useEffect(() => {
    if (!trackingId) return
    const t = setInterval(async () => {
      try { const data = await api(`/delivery/${encodeURIComponent(trackingId)}/track`); renderTrack(data) } catch (e) {}
    }, 8000)
    return () => clearInterval(t)
  }, [trackingId])

  if (loadingAll) {
    return (
      <main className="container section" style={{ textAlign: 'center', padding: '3rem 0' }}>
        <div className="spinner" style={{ 
          width: '48px', 
          height: '48px', 
          border: '4px solid #e5e7eb', 
          borderTopColor: '#03592e', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <h2 className="appTitle" style={{ color: '#64748b', fontSize: '1.25rem' }}>Cargando gestión de delivery...</h2>
      </main>
    )
  }

  return (
    <main className="container section">
      <h1 className="appTitle" style={{ color:'#03592e' }}>Gestión de Delivery</h1>

      <section className="grid" style={{ gridTemplateColumns:'1.3fr 1fr', gap:'1.5rem', alignItems:'start' }}>
        <div className="list">
          <div className="card">
            <h2 className="appTitle" style={{ marginBottom: '.5rem' }}>Entregas activas</h2>
            {activesLoading ? (
              <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                <div className="spinner" style={{ 
                  width: '24px', 
                  height: '24px', 
                  border: '2px solid #e5e7eb', 
                  borderTopColor: '#03592e', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 0.5rem'
                }}></div>
                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Cargando entregas...</div>
              </div>
            ) : !actives.length ? (
              <div className="card" style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                No hay entregas activas
              </div>
            ) : (
              <div className="list">
                {actives.map(d => {
                  const status = d.status || d.estado || 'unknown'
                  const statusColor =
                    status === 'delivered'
                      ? '#16a34a'
                      : status === 'onroute'
                      ? '#2563eb'
                      : status === 'pickup'
                      ? '#f59e0b'
                      : status === 'listo_para_entrega'
                      ? '#22c55e'
                      : '#64748b'
                  const canAssignHere = String(status).toLowerCase() === 'listo_para_entrega'
                  const deliveryKey = d.id_delivery || d.id
                  const isSelected = selectedDeliveryId === deliveryKey
                  const customerName = d.customer_name || d.nombre_cliente || ''
                  const deliveryAddress = d.direccion || d.delivery_address || ''
                  const rawDestLat = d.dest_lat ?? d.destLat
                  const rawDestLng = d.dest_lng ?? d.destLng
                  const destLat = rawDestLat != null ? parseFloat(rawDestLat) : null
                  const destLng = rawDestLng != null ? parseFloat(rawDestLng) : null
                  return (
                    <div className="card" key={d.id_delivery || d.id} style={{ 
                      borderLeft: `4px solid ${statusColor}`,
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 0 2px #22c55e40' : undefined,
                      cursor: 'pointer',
                      background: isSelected ? '#ecfdf5' : 'white'
                    }}
                      onClick={() => {
                        // Siempre seleccionar el delivery a nivel visual / herramientas avanzadas
                        setSelectedDeliveryId(deliveryKey)

                        const orderIdForAssign = d.id_order || d.order_id || ''
                        if (canAssignHere) {
                          // Solo rellenar el formulario de asignación si la entrega está lista para asignar
                          setSelectedOrderId(orderIdForAssign)
                        } else {
                          // Si ya está asignada / en camino, usar el click para preparar el track en tiempo real
                          const trackForm = document.getElementById('track-form')
                          if (trackForm) {
                            const input = trackForm.querySelector('input[name="delivery"]')
                            if (input) input.value = String(deliveryKey)
                          }
                        }
                        if (isFinite(destLat) && isFinite(destLng)) {
                          destRef.current = { lat: destLat, lng: destLng }
                        } else {
                          destRef.current = null
                        }
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                        <div style={{ display: 'flex', justifyContent:'space-between', alignItems:'center', gap:'.5rem' }}>
                          <div>
                            <div><strong>Delivery #{deliveryKey}</strong> — Pedido {d.id_order || d.order_id}</div>
                            {customerName && (
                              <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                                Cliente: {customerName}
                              </div>
                            )}
                            {deliveryAddress && (
                              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                                Dirección: {deliveryAddress}
                              </div>
                            )}
                            <div style={{ 
                              color: statusColor,
                              fontWeight: '500',
                              fontSize: '0.875rem'
                            }}>
                              Estado: <span style={{ 
                                background: `${statusColor}20`,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                textTransform: 'capitalize'
                              }}>{status}</span>
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:'.6rem' }}>
                            {['en_camino', 'onroute', 'asignado', 'assigned'].includes(String(status).toLowerCase()) && (d.id_order || d.order_id) && (
                              <button
                                className="btn"
                                style={{ fontSize: '0.875rem', padding: '0.55rem 1.1rem', minHeight: '2.4rem', minWidth: '9rem', whiteSpace: 'nowrap' }}
                                onClick={async e => {
                                  e.stopPropagation()
                                  const oid = d.id_order || d.order_id
                                  const did = d.id_delivery || d.id
                                  try {
                                    // 0) Actualizar el estado del delivery a 'entregado' para liberar al repartidor
                                    if (did) {
                                      await api(`/delivery/${encodeURIComponent(did)}/status`, {
                                        method: 'PATCH',
                                        body: JSON.stringify({ status: 'entregado' }),
                                      })
                                    }
                                    // 1) Confirmar entrega a nivel de delivery + generar recibo y Order.Delivered
                                    await api(`/delivery/orders/${encodeURIComponent(oid)}/delivered`, {
                                      method: 'POST',
                                      body: JSON.stringify({}),
                                    })
                                    // 2) Confirmar entrega a nivel de orden (flag de staff para Step Functions)
                                    await api(`/orders/${encodeURIComponent(oid)}/staff-confirm-delivered`, { method: 'POST' })
                                    showToast({ type: 'success', message: 'Entrega marcada como entregada' })
                                    await reloadActives()
                                  } catch (err) {
                                    console.error('Error marcando entrega como entregada:', err)
                                    showToast({ type: 'error', message: err.message || 'No se pudo marcar la entrega como entregada' })
                                  }
                                }}
                              >
                                ✅ Marcar entregado
                              </button>
                            )}
                          </div>
                        </div>

                        {canAssignHere && (
                          <div style={{ marginTop: '.25rem', fontSize: '0.8rem', color: '#64748b' }}>
                            Haz clic en esta tarjeta para seleccionar el pedido.
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="appTitle" style={{ marginBottom: '.5rem' }}>Repartidores</h2>
            <div style={{ display:'flex', gap:'.5rem', alignItems:'center', marginBottom:'.5rem' }}>
              <input 
                className="input" 
                placeholder="ID o nombre" 
                value={filter} 
                onChange={e => setFilter(e.target.value)} 
                style={{ flex: 1 }}
              />
              <button 
                className="btn" 
                onClick={reloadRiders}
                disabled={ridersLoading}
                style={{ minWidth: '80px' }}
              >
                {ridersLoading ? '⏳' : '🔄'} Actualizar
              </button>
            </div>
            {ridersLoading && riders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                <div className="spinner" style={{ 
                  width: '24px', 
                  height: '24px', 
                  border: '2px solid #e5e7eb', 
                  borderTopColor: '#03592e', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 0.5rem'
                }}></div>
                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Cargando repartidores...</div>
              </div>
            ) : (
              <div className="list">
                {riders.filter(r => !filter || String(r.id_staff||r.id||'').includes(filter) || String(r.nombre||r.name||'').toLowerCase().includes(filter.toLowerCase()))
                  .map(r => {
                    const status = (r.status || r.estado || 'unknown').toLowerCase()
                    const riderId = r.id_staff || r.id
                    const hasActiveDelivery = actives.some(d => {
                      const dStatus = String(d.status || d.estado || '').toLowerCase()
                      const notFinished = dStatus !== 'delivered' && dStatus !== 'entregado'
                      return notFinished && (d.id_staff === riderId)
                    })

                    const isAvailable = !hasActiveDelivery
                    const isBusy = hasActiveDelivery
                    const statusColor = isAvailable ? '#16a34a' : '#dc2626'
                    const statusText = isAvailable ? 'Disponible' : 'Ocupado'
                    const isSelected = selectedRiderId === riderId

                    return (
                      <div className="card" key={r.id_staff || r.id} style={{ 
                        borderLeft: `4px solid ${statusColor}`,
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 0 0 2px #22c55e40' : undefined,
                        cursor: 'pointer',
                        background: isSelected ? '#eff6ff' : 'white'
                      }}
                        onClick={() => {
                          if (!isAvailable) return
                          setSelectedRiderId(riderId)
                        }}
                      >
                        <div style={{ display:'flex', justifyContent:'space-between', gap:'.5rem', alignItems:'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <strong>{r.nombre || r.name || 'Rider'}</strong>
                              <small style={{ color: '#64748b' }}>(ID: {r.id_staff || r.id})</small>
                              <span style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%',
                                background: statusColor,
                                display: 'inline-block'
                              }}></span>
                            </div>
                            <div style={{ 
                              color: statusColor,
                              fontWeight: '500',
                              fontSize: '0.875rem',
                              marginTop: '0.25rem'
                            }}>
                              Estado: <span style={{ 
                                background: `${statusColor}20`,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                textTransform: 'capitalize'
                              }}>{statusText}</span>
                            </div>
                          </div>
                          <div style={{ 
                            minWidth: '110px',
                            textAlign: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            padding: '0.35rem 0.75rem',
                            borderRadius: '999px',
                            background: statusColor,
                            color: '#fff'
                          }}>
                            {isAvailable ? (isSelected ? 'Seleccionado' : 'Disponible') : 'Ocupado'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                {riders.length === 0 && !ridersLoading && (
                  <div className="card" style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                    No hay repartidores disponibles
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        <aside className="list">
          <div className="card">
            <h2 className="appTitle" style={{ marginBottom: '.5rem' }}>Asignar Delivery a Pedido</h2>
            <form 
              id="assign-form"
              onSubmit={assign} 
              className="list"
              style={{ maxWidth: '420px', margin: '0 auto', width: '100%' }}
            >
              <input 
                className="input" 
                name="order" 
                placeholder="ID de pedido" 
                value={selectedOrderId}
                readOnly
              />
              <input 
                className="input" 
                name="rider" 
                placeholder="ID de staff" 
                value={selectedRiderId}
                readOnly
              />
              <button 
                className="btn primary" 
                type="submit"
                disabled={!selectedOrderId || !selectedRiderId}
              >
                Asignar
              </button>
            </form>
            <div id="assign-msg" style={{ marginTop: '.5rem' }}></div>
          </div>

          <div className="card">
            <h2 className="appTitle" style={{ marginBottom: '.5rem' }}>Track en tiempo real</h2>
            <form 
              id="track-form"
              onSubmit={track} 
              className="list"
              style={{ maxWidth: '420px', margin: '0 auto', width: '100%' }}
            >
              <input className="input" name="delivery" placeholder="ID de delivery" required />
              <button className="btn" type="submit">Track</button>
            </form>
            <div id="track-view" className="list" style={{ marginTop: '.75rem' }}></div>
            
            {/* Simulación de ruta */}
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '0.75rem', color: '#0f172a' }}>
                🎬 Simulación de Ruta
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.75rem' }}>
                Simula el recorrido del delivery desde el local hasta el destino seleccionado
              </p>
              
              {simulatingRoute && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>En camino...</span>
                    <span style={{ color: '#64748b' }}>{simulationProgress}%</span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    background: '#e5e7eb', 
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${simulationProgress}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #16a34a, #22c55e)',
                      transition: 'width 0.2s ease',
                      borderRadius: '999px'
                    }}></div>
                  </div>
                </div>
              )}
              
              <button 
                className={simulatingRoute ? "btn danger" : "btn success"}
                type="button"
                onClick={simulatingRoute ? stopRouteSimulation : startRouteSimulation}
                disabled={!selectedDeliveryId || !destRef.current}
                style={{ width: '100%' }}
              >
                {simulatingRoute ? '⏹️ Detener simulación' : '▶️ Simular ruta'}
              </button>
              
              {!selectedDeliveryId && (
                <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '0.5rem', textAlign: 'center' }}>
                  Selecciona un delivery con dirección primero
                </p>
              )}
            </div>
            
            <div id="map" className="map" style={{ marginTop: '1rem' }}></div>
          </div>

          <div className="card">
            <h2 className="appTitle" style={{ marginBottom: '.5rem' }}>📍 Enviar ubicación GPS</h2>
            <form 
              id="loc-form"
              onSubmit={sendLocation} 
              className="list"
              style={{ maxWidth: '420px', margin: '0 auto', width: '100%' }}
            >
              <input className="input" name="delivery" placeholder="ID de delivery" required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input className="input" name="lat" placeholder="Latitud" required />
                <input className="input" name="lng" placeholder="Longitud" required />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn" type="button" onClick={useGPS} style={{ flex: 1 }}>
                    🌍 Usar mi ubicación
                  </button>
                  <button className="btn primary" type="submit" style={{ flex: 1 }}>
                    📤 Enviar
                  </button>
                </div>
                <button 
                  className={autoGPS ? "btn danger" : "btn success"}
                  type="button" 
                  onClick={toggleAutoGPS}
                  style={{ width: '100%' }}
                >
                  {autoGPS ? '⏸️ Detener tracking automático' : '▶️ Iniciar tracking automático'}
                </button>
                {autoGPS && (
                  <div style={{ 
                    padding: '0.5rem', 
                    background: 'rgba(22, 163, 74, 0.1)', 
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#16a34a',
                    textAlign: 'center'
                  }}>
                    🟢 Tracking GPS activo - Enviando ubicación automáticamente
                  </div>
                )}
              </div>
            </form>
            <div id="loc-msg" style={{ marginTop: '.5rem', fontSize: '13px' }}></div>
          </div>
        </aside>
      </section>
    </main>
  )
}
