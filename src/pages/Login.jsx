import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getTenantId, setTenantId } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const nav = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()

  async function onSubmit(ev) {
    ev.preventDefault()
    setLoading(true)
    setMsg('')
    
    const fd = new FormData(ev.currentTarget)
    const username = fd.get('username')?.trim()
    const password = fd.get('password')
    
    let tenant_id = getTenantId()
    if (!tenant_id && typeof username === 'string') {
      const base = username.split('_staff')[0] || username
      tenant_id = base
    }
    
    const payload = { username, password, tenant_id }
    
    // Enhanced validation
    if (!username || !password) {
      setMsg('Por favor, completa todos los campos')
      showToast({ type:'warning', message:'Completa usuario y contraseña' })
      setLoading(false)
      return
    }
    
    if (password.length < 3) {
      setMsg('La contraseña debe tener al menos 3 caracteres')
      showToast({ type:'warning', message:'Contraseña muy corta' })
      setLoading(false)
      return
    }
    
    try {
      const res = await api('/auth/staff/login', { 
        method: 'POST', 
        body: JSON.stringify(payload),
        timeout: 10000 // 10 second timeout
      })
      
      const token = res.token || res.access_token
      const role = res.role || 'staff'
      
      if (!token) {
        throw new Error('No se recibió token de autenticación')
      }
      
      const headersReq = res.headers_required || {}
      const finalTenant = res.tenant_id || tenant_id
      
      if (finalTenant) {
        setTenantId(finalTenant)
      }
      
      login({
        token,
        role,
        user: res.user || username,
        id: res.id_staff || headersReq['X-User-Id'] || username,
        email: headersReq['X-User-Email'],
        type: 'staff',
        tenant_id: finalTenant
      })
      
      setMsg('¡Ingreso correcto! Redirigiendo...')
      showToast({ type:'success', message:'¡Bienvenido al sistema!' })
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        nav('/dashboard')
      }, 1000)
      
    } catch (e) {
      console.error('Login error:', e)
      let errorMsg = 'Error de conexión'
      
      if (e.message.includes('401') || e.message.includes('403')) {
        errorMsg = 'Usuario o contraseña incorrectos'
      } else if (e.message.includes('network') || e.message.includes('fetch')) {
        errorMsg = 'Error de conexión. Verifica tu internet.'
      } else if (e.message) {
        errorMsg = e.message
      }
      
      setMsg(errorMsg)
      showToast({ type:'error', message: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem 1rem'
    }}>
      <section className="container" style={{ maxWidth: 450, margin: '0 auto' }}>
        <div className="card" style={{ 
          padding: '3rem 2.5rem', 
          boxShadow: 'var(--shadow-xl)', 
          borderRadius: '1.5rem', 
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ width: '100%' }}>
            <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                margin: '0 auto 1.5rem',
                background: 'linear-gradient(135deg, #03592E, #0a7f4a)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h1 className="appTitle" style={{ fontSize: '32px', marginBottom: '0.5rem' }}>Papas Queen's</h1>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Portal Staff</h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                Ingresa tus credenciales para acceder al sistema de gestión
              </p>
            </header>

            <form onSubmit={onSubmit} className="list" style={{ gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <input 
                  className="input" 
                  name="username" 
                  placeholder="Usuario" 
                  required 
                  style={{ paddingLeft: '3rem' }}
                  disabled={loading}
                />
              </div>
              
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }}>
                  🏢
                </div>
                <input 
                  className="input" 
                  name="tenant" 
                  placeholder="Tenant (ej: papasqueens)" 
                  defaultValue={getTenantId() || 'papasqueens'}
                  style={{ paddingLeft: '3rem' }}
                  disabled={loading}
                />
              </div>
              
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input 
                  className="input" 
                  name="password" 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña" 
                  required 
                  style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              
              <button 
                className="btn primary" 
                type="submit" 
                style={{ 
                  width: '100%', 
                  height: '3rem', 
                  fontSize: '16px',
                  fontWeight: '600',
                  letterSpacing: '0.5px'
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading" style={{ width: '16px', height: '16px' }}></div>
                    Ingresando...
                  </>
                ) : (
                  'Ingresar al Sistema'
                )}
              </button>
            </form>

            {msg && (
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '14px',
                textAlign: 'center',
                background: msg.toLowerCase().includes('error') || msg.toLowerCase().includes('incorrect') 
                  ? 'rgba(220, 38, 38, 0.1)' 
                  : 'rgba(22, 163, 74, 0.1)',
                color: msg.toLowerCase().includes('error') || msg.toLowerCase().includes('incorrect') 
                  ? '#dc2626' 
                  : '#16a34a',
                border: `1px solid ${msg.toLowerCase().includes('error') || msg.toLowerCase().includes('incorrect') 
                  ? 'rgba(220, 38, 38, 0.2)' 
                  : 'rgba(22, 163, 74, 0.2)'}`
              }}>
                {msg}
              </div>
            )}
            
            <div style={{ 
              marginTop: '2rem', 
              textAlign: 'center',
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              <p>© 2025 Papas Queen's - Sistema de Gestión</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
