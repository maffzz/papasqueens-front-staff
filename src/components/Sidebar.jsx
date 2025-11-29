import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const nav = useNavigate()
  const loc = useLocation()
  const { auth } = useAuth()
  
  const userRole = auth?.role || 'staff'
  const isAdmin = userRole === 'admin'
  const isCocinero = userRole === 'cocinero'
  const isEmpaquetador = userRole === 'empaquetador'
  const isDelivery = userRole === 'delivery'

  const isActive = (path) => loc.pathname === path

  // Navegación principal - Operaciones
  const mainNav = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: '🏠',
      roles: ['staff', 'admin', 'cocinero', 'empaquetador', 'delivery']
    },
    { 
      path: '/kitchen', 
      label: 'Cocina', 
      icon: '👨‍🍳',
      roles: ['staff', 'admin', 'cocinero', 'empaquetador']
    },
    { 
      path: '/delivery', 
      label: 'Delivery', 
      icon: '🚚',
      roles: ['staff', 'admin', 'delivery']
    },
  ]

  // Navegación admin
  const adminNav = [
    { 
      path: '/admin/analytics', 
      label: 'Analytics', 
      icon: '📊',
      roles: ['admin']
    },
    { 
      path: '/admin/menu', 
      label: 'Menú', 
      icon: '📋',
      roles: ['admin']
    },
    { 
      path: '/admin/staff', 
      label: 'Personal', 
      icon: '👥',
      roles: ['admin']
    },
  ]

  const filteredMainNav = mainNav.filter(item => 
    !item.roles || item.roles.includes(userRole)
  )

  const filteredAdminNav = adminNav.filter(item => 
    !item.roles || item.roles.includes(userRole)
  )

  return (
    <div className="sidebar">
      {/* Header con Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img 
            src="https://tofuu.getjusto.com/orioneat-prod/ynBWKNhowKKGBQatZ-A4--LOGOTIPO.png" 
            alt="Papas Queen's" 
          />
        </div>
        <div className="sidebar-brand">
          <h1 className="sidebar-brand-name">Papas Queen's</h1>
          <p className="sidebar-brand-subtitle">Staff Portal</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        {/* Sección Operaciones */}
        {filteredMainNav.length > 0 && (
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-label">Operaciones</div>
            {filteredMainNav.map(item => (
              <button
                key={item.path}
                onClick={() => nav(item.path)}
                className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Sección Administración */}
        {filteredAdminNav.length > 0 && (
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-label">Administración</div>
            {filteredAdminNav.map(item => (
              <button
                key={item.path}
                onClick={() => nav(item.path)}
                className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Footer con info del usuario */}
      <div className="sidebar-footer">
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center'
        }}>
          © 2025 Papas Queen's
        </div>
      </div>
    </div>
  )
}
