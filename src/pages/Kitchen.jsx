import React, { useState } from 'react'
import { api, formatPrice } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useKitchenQueue } from '../hooks/useKitchenQueue'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/AppLayout'

export default function Kitchen() {
  const [actionLoading, setActionLoading] = useState({})
  const { showToast } = useToast()
  const { queue, loading, reload } = useKitchenQueue(15000)
  const { auth } = useAuth()
  
  const userRole = auth?.role || 'staff'
  const isCocinero = userRole === 'cocinero' || userRole === 'admin'
  const isEmpaquetador = userRole === 'empaquetador' || userRole === 'admin'

  async function doAction(kind, id) {
    const actionKey = `${kind}-${id}`
    
    if (kind === 'accept' && !isCocinero) {
      showToast({ type:'error', message: '❌ Solo cocineros pueden aceptar pedidos' })
      return
    }
    if (kind === 'pack' && !isEmpaquetador) {
      showToast({ type:'error', message: '❌ Solo empaquetadores pueden empacar pedidos' })
      return
    }
    
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
    
    const canAccept = isCocinero && !disableAccept
    const canPack = isEmpaquetador && !disablePack

    const paymentStatus = String(order.payment_status || order.estado_pago || '').toLowerCase()
    const isPaid = paymentStatus === 'paid' || paymentStatus === 'pagado'
    const total = Number(order.total || 0)

    return (
      <div
        className="card"
        key={orderId}
        style={{
          borderLeft: order.priority === 'high' ? '4px solid var(--status-urgent)' : '4px solid var(--queens-orange)'
        }}
      >
        {/* Header del pedido */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-lg)' }}>
          <div>
            <h3 style={{ 
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--queens-green)',
              margin: '0 0 0.25rem 0'
            }}>
              🍽️ Pedido #{orderId}
            </h3>
            <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
              {getTimeAgo(order.created_at || order.timestamp)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--queens-green)',
              marginBottom: '0.25rem'
            }}>
              {isPaid || total === 0 ? '✅ Pagado' : formatPrice(total)}
            </div>
            {order.priority === 'high' && (
              <span className="badge badge-urgent">⚡ URGENTE</span>
            )}
          </div>
        </div>

        {/* Info del cliente */}
        <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--warm-cream)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-700)', marginBottom: '0.25rem' }}>
            👤 {order.customer_name || order.customer || 'Cliente no registrado'}
          </div>
          {order.phone && (
            <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
              📞 {order.phone}
            </div>
          )}
          {order.delivery_address && (
            <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
              📍 {order.delivery_address}
            </div>
          )}
        </div>

        {/* Items del pedido */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h4 style={{ 
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: 'var(--neutral-700)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            🛒 Items del pedido:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {(order.items || []).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: 'white',
                  border: '1px solid var(--neutral-200)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9375rem'
                }}
              >
                <span style={{ fontWeight: 500 }}>
                  <strong style={{ color: 'var(--queens-orange)' }}>{item.cantidad || item.qty || 1}×</strong> {item.nombre || item.name}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--queens-green)' }}>
                  {formatPrice(item.price || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notas especiales */}
        {order.notes && (
          <div style={{
            padding: 'var(--spacing-md)',
            background: 'rgba(255, 184, 0, 0.1)',
            border: '1px solid var(--queens-gold)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            color: 'var(--neutral-700)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            <strong>📝 Notas:</strong> {order.notes}
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          {(canAccept || status === 'recibido') && (
            <button
              className="btn btn-success"
              onClick={() => doAction('accept', orderId)}
              disabled={!canAccept || actionLoading[acceptKey] || status !== 'recibido'}
              style={{ flex: 1 }}
            >
              {actionLoading[acceptKey] ? (
                <><div className="loading"></div> Aceptando...</>
              ) : (
                <>✅ Aceptar pedido</>
              )}
            </button>
          )}
          {(canPack || status === 'en_preparacion') && (
            <button
              className="btn btn-warning"
              onClick={() => doAction('pack', orderId)}
              disabled={!canPack || actionLoading[packKey] || status !== 'en_preparacion'}
              style={{ flex: 1 }}
            >
              {actionLoading[packKey] ? (
                <><div className="loading"></div> Empacando...</>
              ) : (
                <>📦 Empacar</>
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <AppLayout title="🍳 Cocina">
      {/* Header con stats */}
      <div className="card" style={{ marginBottom: 'var(--spacing-xl)', background: 'linear-gradient(135deg, var(--warm-cream), var(--warm-beige))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ 
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--queens-green)',
              margin: '0 0 0.5rem 0'
            }}>
              Cola de Pedidos
            </h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--neutral-600)', margin: 0 }}>
              📊 {visibleQueue.length} pedidos en cola • {acceptQueue.length} por aceptar • {packQueue.length} por empacar
            </p>
          </div>
          <button className="btn btn-secondary" onClick={reload} disabled={loading}>
            {loading ? <><div className="loading"></div> Actualizando...</> : <>🔄 Actualizar</>}
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      {loading && visibleQueue.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
          <div className="loading" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--neutral-600)' }}>Cargando cola de pedidos...</p>
        </div>
      ) : visibleQueue.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)' }}>🍽️</div>
          <h3 style={{ color: 'var(--queens-green)', marginBottom: 'var(--spacing-sm)' }}>No hay pedidos en cola</h3>
          <p style={{ color: 'var(--neutral-600)', margin: 0 }}>
            Todos los pedidos están siendo procesados o no hay nuevos pedidos
          </p>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: acceptQueue.length > 0 && packQueue.length > 0 ? 'repeat(2, 1fr)' : '1fr', gap: 'var(--spacing-xl)', alignItems: 'start' }}>
          {/* Columna: Por Aceptar */}
          {acceptQueue.length > 0 && (isCocinero || userRole === 'admin') && (
            <div>
              <h3 style={{ 
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--queens-orange)',
                marginBottom: 'var(--spacing-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)'
              }}>
                👨‍🍳 Por Aceptar ({acceptQueue.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {acceptQueue.map(order => renderOrderCard(order, { disableAccept: false, disablePack: true }))}
              </div>
            </div>
          )}

          {/* Columna: Por Empacar */}
          {packQueue.length > 0 && (isEmpaquetador || userRole === 'admin') && (
            <div>
              <h3 style={{ 
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--queens-gold)',
                marginBottom: 'var(--spacing-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)'
              }}>
                📦 Por Empacar ({packQueue.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {packQueue.map(order => renderOrderCard(order, { disableAccept: true, disablePack: false }))}
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  )
}
