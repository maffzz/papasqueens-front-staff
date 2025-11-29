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
    { id: 'barranco', label: 'Sede Barranco (UTEC)', tenant: 'tenant_pq_barranco', icon: '🏪' },
    { id: 'puruchuco', label: 'Sede Puruchuco', tenant: 'tenant_pq_puruchuco', icon: '🏪' },
    { id: 'villa-maria', label: 'Sede Villa María', tenant: 'tenant_pq_villamaria', icon: '🏪' },
    { id: 'jiron', label: 'Sede Jirón', tenant: 'tenant_pq_jiron', icon: '🏪' },
  ]

  useEffect(() => {
    const current = getTenantId()
    if (!current) {
      const defaultTenant = SEDE_OPTIONS.find(s => s.id === selectedSede)?.tenant || 'tenant_pq_barranco'
      setTenantId(defaultTenant)
    }
  }, [])

  async function onSubmit(ev) {
    ev.preventDefault()
    setLoading(true)
    setMsg('')
    
    const fd = new FormData(ev.currentTarget)
    const username = fd.get('username')?.trim()
    const password = fd.get('password')
    
    const selectedOption = SEDE_OPTIONS.find(s => s.id === selectedSede)
    const tenant_id = selectedOption?.tenant || getTenantId() || 'tenant_pq_barranco'
    
    setTenantId(tenant_id)
    
    const payload = { username, password, tenant_id }
    
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
        timeout: 10000,
        tenantId: tenant_id,
        headers: { 'X-Tenant-Id': tenant_id }
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
      
      setTimeout(() => {
        nav('/dashboard')
      }, 1000)
      
    } catch (e) {
      console.error('❌ Login error:', e)
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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, var(--warm-cream) 0%, var(--warm-beige) 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 'var(--spacing-xl)'
    }}>
      <div className="card" style={{ 
        maxWidth: '480px',
        width: '100%',
        padding: 'var(--spacing-2xl)',
        boxShadow: 'var(--shadow-xl)',
        border: '2px solid var(--queens-gold)'
      }}>
        {/* Logo y Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            margin: '0 auto var(--spacing-lg)',
            background: 'white',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)',
            border: '3px solid var(--queens-green)'
          }}>
            <img 
              src="https://tofuu.getjusto.com/orioneat-prod/ynBWKNhowKKGBQatZ-A4--LOGOTIPO.png" 
              alt="Papas Queen's" 
              style={{ width: '85px', height: '85px', objectFit: 'cover' }}
            />
          </div>
          <h1 style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--queens-green)',
            marginBottom: 'var(--spacing-xs)',
            letterSpacing: '0.02em'
          }}>
            Papas Queen's
          </h1>
          <p style={{ 
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--queens-orange)',
            marginBottom: 'var(--spacing-xs)'
          }}>
            Staff Portal
          </p>
          <p style={{ 
            fontSize: '0.875rem',
            color: 'var(--neutral-600)',
            margin: 0
          }}>
            Ingresa tus credenciales para acceder
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {/* Selector de Sede */}
          <div style={{
            padding: 'var(--spacing-md)',
            background: 'var(--warm-cream)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--queens-gold)'
          }}>
            <label style={{ 
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--queens-green)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              🏪 Selecciona tu sede
            </label>
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
                }
              }}
              style={{ 
                fontSize: '0.9375rem',
                fontWeight: 500
              }}
            >
              {SEDE_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.icon} {opt.label}</option>
              ))}
            </select>
          </div>

          {/* Usuario */}
          <div>
            <label style={{ 
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--neutral-700)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              👤 Usuario
            </label>
            <input 
              className="input" 
              name="username" 
              placeholder="Ej: admin_staff" 
              required 
              disabled={loading}
            />
          </div>
          
          {/* Contraseña */}
          <div>
            <label style={{ 
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--neutral-700)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              🔒 Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                className="input" 
                name="password" 
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña" 
                required 
                disabled={loading}
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--neutral-500)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  fontSize: '1.25rem'
                }}
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          
          {/* Botón Submit */}
          <button 
            className="btn btn-primary" 
            type="submit" 
            style={{ 
              width: '100%',
              height: '3rem',
              fontSize: '1rem',
              fontWeight: 700
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading"></div>
                Ingresando...
              </>
            ) : (
              '🍟 Ingresar al Sistema'
            )}
          </button>
        </form>

        {/* Mensaje de estado */}
        {msg && (
          <div style={{ 
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            textAlign: 'center',
            fontWeight: 500,
            background: msg.toLowerCase().includes('error') || msg.toLowerCase().includes('incorrect') 
              ? 'rgba(239, 68, 68, 0.1)' 
              : 'rgba(16, 185, 129, 0.1)',
            color: msg.toLowerCase().includes('error') || msg.toLowerCase().includes('incorrect') 
              ? 'var(--status-urgent)' 
              : 'var(--status-ready)',
            border: `2px solid ${msg.toLowerCase().includes('error') || msg.toLowerCase().includes('incorrect') 
              ? 'var(--status-urgent)' 
              : 'var(--status-ready)'}`
          }}>
            {msg}
          </div>
        )}
        
        {/* Footer */}
        <div style={{ 
          marginTop: 'var(--spacing-xl)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--neutral-500)'
        }}>
          © 2025 Papas Queen's - Sistema de Gestión
        </div>
      </div>
    </div>
  )
}
