import React, { createContext, useContext, useEffect, useState } from 'react'
import { getAuth, setAuth, clearAuthData, healthCheck } from '../api/client'
import { useToast } from './ToastContext'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuthState] = useState(getAuth())
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('unknown')
  const { showToast } = useToast()

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      try {
        const currentAuth = getAuth()
        setAuthState(currentAuth)
        
        // Check backend connection if authenticated
        if (currentAuth.token) {
          try {
            const health = await healthCheck()
            setConnectionStatus(health.status)
            
            if (health.status === 'error') {
              showToast({ 
                type: 'warning', 
                message: 'Advertencia: Hay problemas de conexión con el servidor' 
              })
            }
          } catch (healthError) {
            console.warn('Health check failed:', healthError)
            setConnectionStatus('error')
            // Don't show toast on initial load to avoid spam
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
        // Clear auth if there's a critical error
        if (error.message && (error.message.includes('401') || error.message.includes('403'))) {
          clearAuthData()
          setAuthState({})
        }
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false)
    }, 10000) // 10 seconds max
    
    return () => clearTimeout(timeoutId)
  }, [])

  const login = (data) => {
    try {
      // Validate data before setting
      if (!data || !data.token) {
        throw new Error('Datos de autenticación inválidos')
      }
      
      const authData = {
        token: data.token,
        id: data.id,
        email: data.email,
        type: data.type || 'staff',
        role: data.role,
        user: data.user,
        tenant_id: data.tenant_id,
        loginTime: new Date().toISOString()
      }
      
      setAuth(authData)
      setAuthState(authData)
      
      showToast({ 
        type: 'success', 
        message: `¡Bienvenido${data.user ? ' ' + data.user : ''}!` 
      })
    } catch (error) {
      console.error('Login error:', error)
      showToast({ 
        type: 'error', 
        message: error.message || 'Error al iniciar sesión' 
      })
    }
  }

  const logout = (reason = 'manual') => {
    try {
      clearAuthData()
      setAuthState({})
      
      const messages = {
        manual: 'Sesión cerrada correctamente',
        expired: 'Tu sesión ha expirado',
        error: 'Error de autenticación',
        network: 'Error de conexión'
      }
      
      if (reason !== 'manual') {
        showToast({ 
          type: 'warning', 
          message: messages[reason] || 'Sesión cerrada' 
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const refreshToken = async () => {
    try {
      // This would be implemented if the backend supports token refresh
      // For now, just check if current token is still valid
      const health = await healthCheck()
      if (health.status === 'error') {
        logout('expired')
        return false
      }
      return true
    } catch (error) {
      console.error('Token refresh error:', error)
      logout('error')
      return false
    }
  }

  const hasRole = (role) => {
    if (!auth || !auth.role) return false
    return auth.role === role || auth.role === 'admin'
  }

  const canAccess = (resource) => {
    const permissions = {
      'kitchen': ['staff', 'admin', 'kitchen'],
      'delivery': ['staff', 'admin', 'delivery'],
      'admin': ['admin'],
      'analytics': ['admin', 'manager']
    }
    
    const userRole = auth?.role || 'staff'
    return permissions[resource]?.includes(userRole) || false
  }

  const value = { 
    auth, 
    login, 
    logout, 
    refreshToken,
    hasRole,
    canAccess,
    loading,
    connectionStatus,
    isAuthenticated: !!auth.token,
    user: auth?.user || auth?.id || 'Staff',
    role: auth?.role || 'staff',
    tenantId: auth?.tenant_id
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function RequireRole({ role, roles, children }) {
  const { auth, loading } = useAuth()
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        background: '#f8fafc'
      }}>
        <div className="loading" style={{ width: '32px', height: '32px' }}></div>
      </div>
    )
  }
  
  const actual = auth?.role
  const required = roles || (role ? [role] : [])
  const ok = () => {
    if (!required?.length) return !!actual
    return required.some(r => r === 'staff' ? (actual === 'staff' || actual === 'admin') : actual === r)
  }
  
  if (!ok()) return <div className="container section"><div className="card">Acceso restringido</div></div>
  return children
}
