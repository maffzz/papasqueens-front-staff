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
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const polyRef = useRef(null)
  const routeRef = useRef(null)
  const destRef = useRef(null) // destino del cliente para trazar ruta origen-destino
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
    if (!navigator.geolocation) { alert('Geolocalización no soportada'); return }
    navigator.geolocation.getCurrentPosition(pos => {
      form.querySelector('[name="lat"]').value = pos.coords.latitude
      form.querySelector('[name="lng"]').value = pos.coords.longitude
    }, () => alert('No se pudo obtener la ubicación'))
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
                                  try {
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
            <div id="map" className="map"></div>
          </div>
        </aside>
      </section>
    </main>
  )
}
