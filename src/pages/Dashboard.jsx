import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    if (isAdmin) return 'Panel del equipo Papas Queen\'s'
    return 'Panel del equipo Papas Queen\'s'
  }

  const getRoleDescription = () => {
    if (isCocinero) return 'Acepta y prepara los pedidos de la cocina'
    if (isEmpaquetador) return 'Empaca los pedidos listos para entrega'
    if (isDelivery) return 'Gestiona las entregas y rutas'
    return 'Elige el módulo con el que quieres trabajar hoy. Todo está conectado al mismo flujo de pedidos.'
  }

  const cards = []

  // Cocinero solo ve Cocina
  if (isCocinero) {
    cards.push({
      title: 'Cocina',
      desc: 'Acepta y prepara los pedidos pendientes.',
      action: () => nav('/kitchen'),
      badge: 'Tu área',
      icon: '👨‍🍳'
    })
  }

  // Empaquetador solo ve Cocina (para empacar)
  if (isEmpaquetador) {
    cards.push({
      title: 'Cocina',
      desc: 'Empaca los pedidos listos para entrega.',
      action: () => nav('/kitchen'),
      badge: 'Tu área',
      icon: '📦'
    })
  }

  // Delivery ve Delivery
  if (isDelivery) {
    cards.push({
      title: 'Delivery',
      desc: 'Asignar repartidores y seguir entregas.',
      action: () => nav('/delivery'),
      badge: 'Tu área',
      icon: '🚚'
    })
  }

  // Admin ve todo
  if (isAdmin) {
    cards.push(
      {
        title: 'Cocina',
        desc: 'Ver y gestionar la cola de pedidos en cocina.',
        action: () => nav('/kitchen'),
        badge: 'Tiempo real',
        icon: '🍳'
      },
      {
        title: 'Delivery',
        desc: 'Asignar repartidores y seguir entregas.',
        action: () => nav('/delivery'),
        badge: 'Rutas y tracking',
        icon: '🚚'
      },
      {
        title: 'Admin Menú',
        desc: 'Gestionar productos y precios del menú.',
        action: () => nav('/admin/menu'),
        badge: 'Solo admin',
        icon: '📋'
      },
      {
        title: 'Admin Staff',
        desc: 'Gestionar personal de cocina, repartidores y accesos.',
        action: () => nav('/admin/staff'),
        badge: 'Solo admin',
        icon: '👥'
      },
      {
        title: 'Analytics',
        desc: 'Ver métricas de pedidos, tiempos y rendimiento.',
        action: () => nav('/admin/analytics'),
        badge: 'KPIs',
        icon: '📊'
      }
    )
  }

  return (
    <main className="section" style={{ background: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <div className="container">
        <header style={{ marginBottom: '1.5rem' }}>
          <h1 className="appTitle" style={{ color: '#03592e', fontSize: '28px', marginBottom: '.25rem' }}>
            {getRoleTitle()}
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {getRoleDescription()}
          </p>
          {(isCocinero || isEmpaquetador || isDelivery) && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem 1rem', 
              background: 'rgba(3, 89, 46, 0.1)', 
              borderRadius: '8px',
              border: '1px solid rgba(3, 89, 46, 0.2)'
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#03592e' }}>
                <strong>Tu rol:</strong> {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </p>
            </div>
          )}
        </header>

        <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {cards.map(card => (
            <article
              key={card.title}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '.5rem',
                cursor: 'pointer',
                transition: 'transform .15s ease, box-shadow .15s ease',
              }}
              onClick={card.action}
            >
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.08em', color: '#16a34a' }}>
                {card.badge}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '24px' }}>{card.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>{card.title}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', flex: 1 }}>{card.desc}</div>
              <button className="btn primary" style={{ marginTop: '.5rem', alignSelf: 'flex-start' }}>
                Abrir
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
