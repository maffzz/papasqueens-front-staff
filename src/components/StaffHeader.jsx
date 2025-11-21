import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { clearAuthData } from '../api/client'

export default function StaffHeader() {
  const nav = useNavigate()
  const loc = useLocation()
  const { auth, logout, connectionStatus } = useAuth()
  const { showToast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function doLogout() {
    try {
      clearAuthData()
      logout('manual')
      nav('/')
    } catch (error) {
      console.error('Logout error:', error)
      showToast({ type:'error', message:'Error al cerrar sesión' })
    }
  }

  const current = loc.pathname
  const isActive = (path) => current === path

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '', roles: ['staff', 'admin', 'manager', 'kitchen', 'delivery'] },
    { path: '/kitchen', label: 'Cocina', icon: '', roles: ['staff', 'admin', 'manager', 'kitchen'] },
    { path: '/delivery', label: 'Delivery', icon: '', roles: ['staff', 'admin', 'manager', 'delivery'] },
    { path: '/admin/analytics', label: 'Analytics', icon: '', roles: ['admin', 'manager'] }
  ]

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(auth?.role || 'staff')
  )

  return (
    <header className="header" style={{ background: '#ffffff', boxShadow: '0 2px 4px rgba(15,23,42,0.08)' }}>
      <div className="container" style={{ padding: '0.5rem 0' }}>
        {/* Única fila: logo + navegación + acciones */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1.5rem' }}>
          {/* Logo y título pegados a la izquierda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '2px solid #03592e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              background: '#fff',
            }}>
              <img 
                src="https://tofuu.getjusto.com/orioneat-prod/ynBWKNhowKKGBQatZ-A4--LOGOTIPO.png" 
                alt="Papas Queen's Logo" 
                style={{ width: '38px', height: '38px', objectFit: 'cover' }}
              />
            </div>
            <div>
              <h1
                className="appTitle"
                style={{
                  fontSize: '16px',
                  margin: 0,
                  fontWeight: 700,
                  letterSpacing: '.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                Papas Queen's
              </h1>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Staff Portal</span>
            </div>
          </div>

          {/* Navegación central */}
          <nav
            className="nav"
            style={{
              flex: 1,
              justifyContent: 'center',
              gap: '1rem',
              fontSize: '12px',
            }}
          >
            {filteredNavItems.map(item => (
              <button
                key={item.path}
                onClick={() => {
                  nav(item.path)
                  setMobileMenuOpen(false)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0 0 0.25rem',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: isActive(item.path) ? 700 : 500,
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  color: isActive(item.path) ? '#03592e' : '#64748b',
                  borderBottom: isActive(item.path) ? '2px solid #03592e' : '2px solid transparent',
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* User Actions a la derecha */}
          <div className="nav" style={{ gap:'0.75rem', alignItems: 'center' }}>
          {auth?.token ? (
            <>
              {/* Connection Status Indicator */}
              {connectionStatus !== 'unknown' && (
                <div 
                  style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%',
                    background: connectionStatus === 'ok' ? '#16a34a' : '#eab308',
                    boxShadow: connectionStatus === 'ok' ? '0 0 0 2px rgba(22, 163, 74, 0.2)' : '0 0 0 2px rgba(234, 179, 8, 0.2)'
                  }}
                  title={connectionStatus === 'ok' ? 'Conectado' : 'Problemas de conexión'}
                />
              )}

              {/* User Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #03592E, #0a7f4a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {(auth.user || auth.id || 'S').charAt(0).toUpperCase()}
                </div>
                <div style={{ display: window.innerWidth > 768 ? 'block' : 'none' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#03592E', lineHeight: '1.2' }}>
                    {auth.user || auth.id || 'Staff'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>
                    {auth.role || 'staff'}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button 
                className="btn danger" 
                onClick={doLogout}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '14px',
                  padding: '0.5rem 1rem',
                  height: '2.5rem'
                }}
              >
                🚪 Salir
              </button>
            </>
          ) : (
            <Link className="btn primary" to="/">🔐 Staff Login</Link>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}
