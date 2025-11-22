import React, { Component } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import StaffHeader from './components/StaffHeader'
import { AuthProvider, RequireRole, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Login from './pages/Login'
import Kitchen from './pages/Kitchen'
import Delivery from './pages/Delivery'
import AdminMenu from './pages/AdminMenu'
import AdminStaff from './pages/AdminStaff'
import AdminAnalytics from './pages/AdminAnalytics'
import Dashboard from './pages/Dashboard'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          background: '#fef2f2', 
          color: '#dc2626',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Ha ocurrido un error</h2>
          <p style={{ marginBottom: '1rem', color: '#7f1d1d' }}>
            {this.state.error?.message || 'Error desconocido'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Recargar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function AppContent() {
  const { loading, auth } = useAuth()
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        gap: '1rem'
      }}>
        <div className="loading" style={{ width: '48px', height: '48px' }}></div>
        <div style={{ color: '#64748b', fontSize: '14px' }}>Cargando sistema...</div>
      </div>
    )
  }
  
  // Si no hay usuario autenticado (sin token), mostramos solo la pantalla de Login
  if (!auth || !auth.token) {
    return <Login />
  }

  // Si hay usuario autenticado, mostramos el layout completo con Dashboard como raíz
  return (
    <>
      <StaffHeader />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RequireRole roles={["staff","delivery","admin"]}><Dashboard /></RequireRole>} />
        <Route path="/kitchen" element={<RequireRole roles={["staff","admin"]}><Kitchen /></RequireRole>} />
        <Route path="/delivery" element={<RequireRole roles={["staff","delivery","admin"]}><Delivery /></RequireRole>} />
        <Route path="/admin/menu" element={<RequireRole role="admin"><AdminMenu /></RequireRole>} />
        <Route path="/admin/staff" element={<RequireRole role="admin"><AdminStaff /></RequireRole>} />
        <Route path="/admin/analytics" element={<RequireRole role="admin"><AdminAnalytics /></RequireRole>} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
