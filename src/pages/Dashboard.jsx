import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/AppLayout'

export default function Dashboard() {
  const nav = useNavigate()
  const { auth } = useAuth()
  const userRole = auth?.role || 'staff'
  const isAdmin = userRole === 'admin'
  const isCocinero = userRole === 'cocinero'
  const isEmpaquetador = userRole === 'empaquetador'
  const isDelivery = userRole === 'delivery'

  const getRoleTitle = () => {
    if (isCocinero) return '👨‍🍳 Panel de Cocinero'
    if (isEmpaquetador) return '📦 Panel de Empaquetador'
    if (isDelivery) return '🚚 Panel de Delivery'
    if (isAdmin) return 'Panel de Gestión'
    return 'Panel del equipo'
  }

  const getRoleDescription = () => {
    if (isCocinero) return 'Acepta y prepara los pedidos de la cocina'
    if (isEmpaquetador) return 'Empaca los pedidos listos para entrega'
    if (isDelivery) return 'Gestiona las entregas y rutas'
    return 'Elige el módulo con el que quieres trabajar hoy'
  }

  const cards = []

  if (isCocinero) {
    cards.push({
      title: 'Cocina',
      desc: 'Acepta y prepara los pedidos pendientes.',
      action: () => nav('/kitchen'),
      badge: 'Tu área',
      icon: '👨‍🍳',
      color: 'var(--queens-orange)'
    })
  }

  if (isEmpaquetador) {
    cards.push({
      title: 'Cocina',
      desc: 'Empaca los pedidos listos para entrega.',
      action: () => nav('/kitchen'),
      badge: 'Tu área',
      icon: '📦',
      color: 'var(--queens-gold)'
    })
  }

  if (isDelivery) {
    cards.push({
      title: 'Delivery',
      desc: 'Asignar repartidores y seguir entregas.',
      action: () => nav('/delivery'),
      badge: 'Tu área',
      icon: '🚚',
      color: 'var(--status-delivery)'
    })
  }

  if (isAdmin) {
    cards.push(
      {
        title: 'Cocina',
        desc: 'Ver y gestionar la cola de pedidos en cocina.',
        action: () => nav('/kitchen'),
        badge: 'Tiempo real',
        icon: '👨‍🍳',
        color: 'var(--queens-orange)'
      },
      {
        title: 'Delivery',
        desc: 'Asignar repartidores y seguir entregas.',
        action: () => nav('/delivery'),
        badge: 'Rutas y tracking',
        icon: '🚚',
        color: 'var(--status-delivery)'
      },
      {
        title: 'Menú',
        desc: 'Gestionar productos y precios del menú.',
        action: () => nav('/admin/menu'),
        badge: 'Solo admin',
        icon: '📋',
        color: 'var(--queens-gold)'
      },
      {
        title: 'Personal',
        desc: 'Gestionar personal de cocina, repartidores y accesos.',
        action: () => nav('/admin/staff'),
        badge: 'Solo admin',
        icon: '👥',
        color: 'var(--queens-green)'
      },
      {
        title: 'Analytics',
        desc: 'Ver métricas de pedidos, tiempos y rendimiento.',
        action: () => nav('/admin/analytics'),
        badge: 'KPIs',
        icon: '📊',
        color: 'var(--neutral-700)'
      }
    )
  }

  return (
    <AppLayout title="Dashboard">
      {/* Header con bienvenida */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ 
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--queens-green)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          {getRoleTitle()}
        </h1>
        <p style={{ 
          fontSize: '1rem',
          color: 'var(--neutral-600)',
          margin: 0
        }}>
          {getRoleDescription()}
        </p>
        
        {(isCocinero || isEmpaquetador || isDelivery) && (
          <div style={{ 
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            background: 'var(--warm-cream)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--queens-gold)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)'
          }}>
            <span style={{ fontSize: '1.25rem' }}>👤</span>
            <span style={{ 
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: 'var(--queens-green)'
            }}>
              Tu rol: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          </div>
        )}
      </div>

      {/* Grid de módulos */}
      <div className="grid" style={{ 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--spacing-xl)'
      }}>
        {cards.map(card => (
          <div
            key={card.title}
            className="card"
            onClick={card.action}
            style={{
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              borderTop: `4px solid ${card.color}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-xl)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }}
          >
            {/* Badge superior */}
            <div style={{
              position: 'absolute',
              top: 'var(--spacing-md)',
              right: 'var(--spacing-md)',
              padding: '0.25rem 0.75rem',
              background: 'var(--warm-cream)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--queens-green)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {card.badge}
            </div>

            {/* Icono grande */}
            <div style={{
              fontSize: '4rem',
              marginBottom: 'var(--spacing-lg)',
              marginTop: 'var(--spacing-md)'
            }}>
              {card.icon}
            </div>

            {/* Título */}
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--neutral-900)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              {card.title}
            </h3>

            {/* Descripción */}
            <p style={{
              fontSize: '0.9375rem',
              color: 'var(--neutral-600)',
              lineHeight: 1.6,
              marginBottom: 'var(--spacing-lg)'
            }}>
              {card.desc}
            </p>

            {/* Botón */}
            <button 
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Abrir módulo →
            </button>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
