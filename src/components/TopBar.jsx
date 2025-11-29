import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { clearAuthData, getTenantId } from '../api/client'

export default function TopBar({ title = 'Dashboard' }) {
  const nav = useNavigate()
  const { auth, logout, connectionStatus } = useAuth()
  const { showToast } = useToast()

  function doLogout() {
    try {
      clearAuthData()
      logout('manual')
      nav('/login')
    } catch (error) {
      console.error('Logout error:', error)
      showToast({ type:'error', message:'Error al cerrar sesión' })
    }
  }

  const tenantId = getTenantId()
  const sedeLabels = {
    'tenant_pq_barranco': 'Barranco (UTEC)',
    'tenant_pq_puruchuco': 'Puruchuco',
    'tenant_pq_villamaria': 'Villa María',
    'tenant_pq_jiron': 'Jirón'
  }
  const sedeName = sedeLabels[tenantId] || 'Sede'

  const roleLabels = {
    'cocinero': '👨‍🍳 Cocinero',
    'empaquetador': '📦 Empaquetador',
    'delivery': '🚚 Delivery',
    'admin': '👔 Admin',
    'staff': 'Staff'
  }
  const roleLabel = roleLabels[auth?.role] || 'Staff'

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">{title}</h2>
      </div>

      <div className="topbar-right">
        {/* Sede Actual */}
        <div className="topbar-sede">
          <span className="topbar-sede-icon">🏪</span>
          <span className="topbar-sede-text">{sedeName}</span>
        </div>

        {/* Estado de Conexión */}
        {connectionStatus !== 'unknown' && (
          <div className="topbar-status">
            <div 
              className="topbar-status-dot"
              style={{
                background: connectionStatus === 'ok' ? '#10B981' : '#F59E0B'
              }}
              title={connectionStatus === 'ok' ? 'Conectado' : 'Problemas de conexión'}
            />
          </div>
        )}

        {/* Usuario */}
        <div className="topbar-user">
          <div className="topbar-user-avatar">
            {(auth?.user || auth?.id || 'S').charAt(0).toUpperCase()}
          </div>
          <div className="topbar-user-info">
            <div className="topbar-user-name">
              {auth?.user || auth?.id || 'Staff'}
            </div>
            <div className="topbar-user-role">{roleLabel}</div>
          </div>
        </div>

        {/* Botón Logout */}
        <button 
          className="btn btn-danger"
          onClick={doLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            padding: '0.625rem 1rem'
          }}
        >
          🚪 Salir
        </button>
      </div>
    </div>
  )
}
