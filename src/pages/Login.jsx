import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getTenantId, setTenantId } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedSede, setSelectedSede] = useState(() => {
    const current = getTenantId()
    if (current === 'tenant_pq_barranco') return 'barranco'
    if (current === 'tenant_pq_puruchuco') return 'puruchuco'
    if (current === 'tenant_pq_villamaria') return 'villa-maria'
    if (current === 'tenant_pq_jiron') return 'jiron'
    return 'barranco'
  })
  const nav = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()

  const SEDE_OPTIONS = [
    { id: 'barranco', label: 'Sede Barranco (UTEC)', tenant: 'tenant_pq_barranco' },
    { id: 'puruchuco', label: 'Sede Puruchuco', tenant: 'tenant_pq_puruchuco' },
    { id: 'villa-maria', label: 'Sede Villa María', tenant: 'tenant_pq_villamaria' },
    { id: 'jiron', label: 'Sede Jirón', tenant: 'tenant_pq_jiron' },
  ]

  useEffect(() => {
    const current = getTenantId()
    if (!current) {
      const defaultTenant = SEDE_OPTIONS.find(s => s.id === selectedSede)?.tenant || 'tenant_pq_barranco'
      setTenantId(defaultTenant)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(ev) {
    ev.preventDefault()
    setLoading(true)
    setMsg('')
    
    const fd = new FormData(ev.currentTarget)
    const username = fd.get('username')?.trim()
    const password = fd.get('password')
    
    // Obtener el tenant_id de la sede seleccionada
    const selectedOption = SEDE_OPTIONS.find(s => s.id === selectedSede)
    const tenant_id = selectedOption?.tenant || getTenantId() || 'tenant_pq_barranco'
    
    // Asegurarse de que el tenant_id esté actualizado en localStorage
    setTenantId(tenant_id)
    
    const payload = { username, password, tenant_id }
    const jsonPayload = JSON.stringify(payload)
    
    console.log('🔍 Login Debug:')
    console.log('  - Selected Sede:', selectedSede)
    console.log('  - Tenant ID:', tenant_id)
    console.log('  - Payload Object:', payload)
    console.log('  - JSON String:', jsonPayload)
    console.log('  - Parsed back:', JSON.parse(jsonPayload))
    
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
        timeout: 10000, // 10 second timeout
        tenantId: tenant_id, // Asegurar que se envíe en headers también
        headers: {
          'X-Tenant-Id': tenant_id // Enviar explícitamente en headers
        }
      })
      
      console.log('✅ Login response:', res)
      console.log('  - Token:', res.token || res.access_token)
      console.log('  - Role:', res.role)
      console.log('  - Tenant ID:', res.tenant_id)
      
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
      console.error('❌ Login error:', e)
      console.error('  - Error message:', e.message)
      console.error('  - Error details:', e)
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
      background: '#f8fafc', 
      display: 'flex', 
      alignItems: 'flex-start', 
      justifyContent: 'center', 
      padding: '3rem 1.25rem 2rem'
    }}>
      <section className="container" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="card" style={{ 
          padding: '2.1rem 2.5rem 1.8rem', 
          boxShadow: '0 16px 40px rgba(15,23,42,0.16)', 
          borderRadius: '1.5rem', 
          background: '#ffffff',
          border: '1px solid rgba(226, 232, 240, 0.9)'
        }}>
          <div style={{ width: '100%' }}>
            <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
              <h1 className="appTitle" style={{ fontSize: '26px', marginBottom: '0.1rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>Papas Queen's</h1>
              <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '0.35rem' }}>Portal Staff</h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                Ingresa tus credenciales para acceder al sistema de gestión
              </p>
            </header>

            <form
              onSubmit={onSubmit}
              className="list"
              style={{
                gap: '1.2rem',
                width: '100%',
                maxWidth: '380px',
                margin: '0 auto',
                boxSizing: 'border-box',
              }}
            >
              <div style={{
                marginBottom: '0.75rem',
                padding: '0.75rem 0.85rem',
                borderRadius: '0.9rem',
                background: 'rgba(15,23,42,0.02)',
                border: '1px solid rgba(148,163,184,0.3)'
              }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '12px', color: '#0f172a', fontWeight: 600 }}>
                  Indica de qué sede eres staff
                </p>
                <select
                  className="input"
                  value={selectedSede}
                  disabled={loading}
                  onChange={e => {
                    const value = e.target.value
                    setSelectedSede(value)
                    const opt = SEDE_OPTIONS.find(s => s.id === value)
                    if (opt) {
                      setTenantId(opt.tenant)
                      console.log('🏢 Sede cambiada a:', opt.label, '- Tenant:', opt.tenant)
                    }
                  }}
                  style={{ fontSize: '13px', paddingInline: '0.65rem' }}
                >
                  {SEDE_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                  Tenant: {SEDE_OPTIONS.find(s => s.id === selectedSede)?.tenant || 'N/A'}
                </p>
              </div>

              <div style={{ marginBottom: '0.1rem' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Usuario
                </label>
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <input 
                  className="input" 
                  name="username" 
                  placeholder="Ej: admin_staff" 
                  required 
                  style={{
                    paddingLeft: '3rem',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                  disabled={loading}
                />
              </div>
              
              <div style={{ marginTop: '0.25rem' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Contraseña
                </label>
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
                  style={{
                    paddingLeft: '3rem',
                    paddingRight: '3rem',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
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
