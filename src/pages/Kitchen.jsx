import React, { useState } from 'react'
import { api, formatPrice } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useKitchenQueue } from '../hooks/useKitchenQueue'

export default function Kitchen() {
  const [actionLoading, setActionLoading] = useState({})
  const { showToast } = useToast()
  const { queue, loading, reload } = useKitchenQueue(15000)

  async function doAction(kind, id) {
    const actionKey = `${kind}-${id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))
    
    try {
      if (kind === 'accept') {
        await api(`/kitchen/orders/${encodeURIComponent(id)}/accept`, { method: 'POST' })
        showToast({ type:'success', message: '✅ Pedido aceptado correctamente' })
      }
      if (kind === 'pack') {
        await api(`/kitchen/orders/${encodeURIComponent(id)}/pack`, { method: 'POST' })
        showToast({ type:'success', message: '📦 Pedido empacado correctamente' })
      }
      await reload()
    } catch (e) {
      console.error('Error in kitchen action:', e)
      const msg = (e && e.message) || 'No se pudo ejecutar la acción'
      showToast({ type:'error', message: msg })
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  const getStatusBadge = (order) => {
    const rawStatus = order.status || order.estado || 'recibido'
    const status = String(rawStatus).toLowerCase()
    const statusConfig = {
      pending:          { class: 'warning', text: 'Pendiente',           icon: '⏳' },
      accepted:         { class: 'info',    text: 'Aceptado',            icon: '👨‍🍳' },
      preparing:        { class: 'info',    text: 'Preparando',          icon: '🔥' },
      ready:            { class: 'success', text: 'Listo',               icon: '✅' },
      packed:           { class: 'success', text: 'Empacado',            icon: '📦' },
      delivered:        { class: 'success', text: 'Entregado',           icon: '🚚' },
      cancelled:        { class: 'danger',  text: 'Cancelado',           icon: '❌' },
      recibido:         { class: 'warning', text: 'Pendiente',           icon: '⏳' },
      en_preparacion:   { class: 'info',    text: 'En preparación',      icon: '🔥' },
      listo_para_entrega:{ class: 'success', text: 'Listo para entrega', icon: '📦' },
    }

    const config = statusConfig[status] || statusConfig.recibido
    return (
      <span className={`badge ${config.class}`}>
        {config.icon} {config.text}
      </span>
    )
  }

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return ''
    const now = new Date()
    const orderTime = new Date(timestamp)
    const diffMs = now - orderTime
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Hace un momento'
    if (diffMins < 60) return `Hace ${diffMins} min`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `Hace ${hours}h ${mins}min`
  }

  const visibleQueue = queue.filter(order => {
    const status = String(order.status || order.estado || '').toLowerCase()
    return status !== 'cancelled' && status !== 'cancelado'
  })

  const acceptQueue = visibleQueue.filter(order => {
    const status = String(order.status || order.estado || '').toLowerCase()
    return status === 'recibido'
  })

  const packQueue = visibleQueue.filter(order => {
    const status = String(order.status || order.estado || '').toLowerCase()
    return status === 'en_preparacion'
  })

  function renderOrderCard(order, { disableAccept = false, disablePack = false } = {}) {
    const orderId = order.id_order || order.order_id || order.id
    const acceptKey = `accept-${orderId}`
    const packKey = `pack-${orderId}`
    const status = String(order.status || order.estado || '').toLowerCase()

    return (
      <div
        className="card"
        key={orderId}
        style={{
          position: 'relative',
          borderLeft: '4px solid',
          borderLeftColor:
            order.priority === 'high'
              ? '#dc2626'
              : order.priority === 'medium'
              ? '#eab308'
              : '#03592E',
        }}
      >
        {order.priority === 'high' && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: '#dc2626',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
            }}
          >
            ⚡ URGENTE
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', color: '#03592E' }}>
                Pedido #{orderId}
              </h3>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {getTimeAgo(order.created_at || order.timestamp)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="price" style={{ fontSize: '1.1rem' }}>
                {(() => {
                  const paymentStatus = String(order.payment_status || order.estado_pago || '').toLowerCase()
                  const isPaid = paymentStatus === 'paid' || paymentStatus === 'pagado'
                  const total = Number(order.total || 0)
                  if (isPaid || total === 0) return 'Pagado'
                  return formatPrice(total)
                })()}
              </div>
              {getStatusBadge(order)}
            </div>
          </div>

          <div>
            {(() => {
              const name = order.customer_name || order.customer
              const addr = order.delivery_address
              const label = name || (addr ? `Cliente en ${addr}` : 'Cliente no registrado')
              return (
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
                  👤 {label}
                </div>
              )
            })()}
            {order.phone && (
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                📞 {order.phone}
              </div>
            )}
            {order.delivery_address && (
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                📍 {order.delivery_address}
              </div>
            )}
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#03592E' }}>🛒 Items:</h4>
            <div className="list" style={{ gap: '0.5rem', paddingLeft: '0' }}>
              {(order.items || []).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <span>
                    {item.cantidad || item.qty || 1} × {item.nombre || item.name}
                  </span>
                  <span style={{ fontWeight: '500', color: '#03592E' }}>
                    {formatPrice(item.price || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {order.notes && (
            <div
              style={{
                padding: '0.75rem',
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.2)',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#92400e',
              }}
            >
              <strong>📝 Notas:</strong> {order.notes}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn success"
              onClick={() => doAction('accept', orderId)}
              disabled={
                disableAccept ||
                actionLoading[acceptKey] ||
                status !== 'recibido'
              }
              style={{
                flex: 1,
                opacity:
                  disableAccept || status !== 'recibido'
                    ? 0.5
                    : 1,
                cursor:
                  disableAccept || status !== 'recibido'
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {actionLoading[acceptKey] ? (
                <>
                  <div className="loading" style={{ width: '14px', height: '14px' }}></div>{' '}
                  Aceptando...
                </>
              ) : (
                <>✅ Aceptar</>
              )}
            </button>
            <button
              className="btn primary"
              onClick={() => doAction('pack', orderId)}
              disabled={
                disablePack ||
                actionLoading[packKey] ||
                status !== 'en_preparacion'
              }
              style={{
                flex: 1,
                opacity:
                  disablePack || status !== 'en_preparacion'
                    ? 0.5
                    : 1,
                cursor:
                  disablePack || status !== 'en_preparacion'
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {actionLoading[packKey] ? (
                <>
                  <div className="loading" style={{ width: '14px', height: '14px' }}></div>{' '}
                  Empacando...
                </>
              ) : (
                <>📦 Empacar</>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="container section">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 className="appTitle" style={{ marginBottom: '0.5rem' }}>🍳 Cocina</h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Gestiona la cola de pedidos y preparación
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn" onClick={reload} disabled={loading}>
            {loading ? (
              <><div className="loading" style={{ width: '16px', height: '16px' }}></div> Actualizando...</>
            ) : (
              <>🔄 Actualizar</>
            )}
          </button>
        </div>
      </div>

      {loading && visibleQueue.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#64748b' }}>Cargando cola de pedidos...</p>
        </div>
      ) : visibleQueue.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🍽️</div>
          <h3 style={{ color: '#03592E', marginBottom: '0.5rem' }}>No hay pedidos en cola</h3>
          <p style={{ color: '#64748b', margin: 0 }}>
            Todos los pedidos están siendo procesados o no hay nuevos pedidos
          </p>
        </div>
      ) : (
        <>
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1rem', 
            background: 'rgba(3, 89, 46, 0.05)', 
            borderRadius: '8px',
            border: '1px solid rgba(3, 89, 46, 0.1)'
          }}>
            <p style={{ margin: 0, color: '#03592E', fontWeight: '500' }}>
              📊 {visibleQueue.length} pedidos en cola ({acceptQueue.length} por aceptar, {packQueue.length} por empacar)
            </p>
          </div>

          {(acceptQueue.length > 0 || packQueue.length > 0) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  acceptQueue.length > 0 && packQueue.length > 0
                    ? 'minmax(0,1fr) minmax(0,1fr)'
                    : 'minmax(0,1fr)',
                gap: '1.25rem',
                alignItems: 'flex-start',
              }}
            >
              {acceptQueue.length > 0 && (
                <div>
                  <h2
                    className="appTitle"
                    style={{ fontSize: '16px', marginBottom: '.5rem', color: '#0f172a' }}
                  >
                    Por aceptar
                  </h2>
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}
                  >
                    {acceptQueue.map(order =>
                      renderOrderCard(order, { disableAccept: false, disablePack: true })
                    )}
                  </div>
                </div>
              )}

              {packQueue.length > 0 && (
                <div>
                  <h2
                    className="appTitle"
                    style={{ fontSize: '16px', marginBottom: '.5rem', color: '#0f172a' }}
                  >
                    Por empacar
                  </h2>
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}
                  >
                    {packQueue.map(order =>
                      renderOrderCard(order, { disableAccept: true, disablePack: false })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  )
}
