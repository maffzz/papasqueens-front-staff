import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const nav = useNavigate()
  const { auth } = useAuth()
  const isAdmin = auth?.role === 'admin'

  const cards = [
    {
      title: 'Cocina',
      desc: 'Ver y gestionar la cola de pedidos en cocina.',
      action: () => nav('/kitchen'),
      badge: 'Tiempo real',
    },
    {
      title: 'Delivery',
      desc: 'Asignar repartidores y seguir entregas.',
      action: () => nav('/delivery'),
      badge: 'Rutas y tracking',
    },
    ...(isAdmin ? [
      {
        title: 'Admin Menú',
        desc: 'Gestionar productos y precios del menú.',
        action: () => nav('/admin/menu'),
        badge: 'Solo admin',
      },
      {
        title: 'Admin Staff',
        desc: 'Gestionar personal de cocina, repartidores y accesos.',
        action: () => nav('/admin/staff'),
        badge: 'Solo admin',
      },
      {
        title: 'Analytics',
        desc: 'Ver métricas de pedidos, tiempos y rendimiento.',
        action: () => nav('/admin/analytics'),
        badge: 'KPIs',
      },
    ] : []),
  ]

  return (
    <main className="section" style={{ background: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <div className="container">
        <header style={{ marginBottom: '1.5rem' }}>
          <h1 className="appTitle" style={{ color: '#03592e', fontSize: '28px', marginBottom: '.25rem' }}>
            Panel del equipo Papas Queen's
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Elige el módulo con el que quieres trabajar hoy. Todo está conectado al mismo flujo de pedidos.
          </p>
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
              <div style={{ fontWeight: 700, fontSize: '16px' }}>{card.title}</div>
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
