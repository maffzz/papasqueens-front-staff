const API_BASE = 'https://z9ojkmcicl.execute-api.us-east-1.amazonaws.com/dev'

function getAuth() { try { return JSON.parse(localStorage.getItem('auth') || '{}') } catch { return {} } }
function setAuth(a) { localStorage.setItem('auth', JSON.stringify(a || {})) }
function getTenantId() { try { return localStorage.getItem('tenantId') || (import.meta && import.meta.env && import.meta.env.VITE_TENANT_ID) || '' } catch { return '' } }
function setTenantId(id) { try { if (id) localStorage.setItem('tenantId', id); else localStorage.removeItem('tenantId') } catch {} }

async function api(path, opts = {}) {
  const auth = getAuth()
  const { token, id, email, type } = auth || {}
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {})
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (id) headers['X-User-Id'] = id
  if (email) headers['X-User-Email'] = email
  if (type) headers['X-User-Type'] = type
  
  const tenant = opts.tenantId || getTenantId()
  if (tenant && !headers['X-Tenant-Id'] && !headers['x-tenant-id']) headers['X-Tenant-Id'] = tenant
  
  let url = `${API_BASE}${path}`
  if (tenant && opts.tenantAsQuery === true) url += (url.includes('?') ? '&' : '?') + `tenant_id=${encodeURIComponent(tenant)}`
  
  const timeout = opts.timeout || 30000 // 30 seconds default timeout
  
  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const res = await fetch(url, Object.assign({}, opts, { headers, signal: controller.signal }))
    
    clearTimeout(timeoutId)
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        try { localStorage.removeItem('auth') } catch {}
        if (typeof window !== 'undefined' && !location.pathname.endsWith('/login')) {
          location.href = '/login'
        }
      }
      
      // Enhanced error handling
      let errorMessage = `Error ${res.status}`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage
      } catch {
        // If JSON parsing fails, try to get text
        try {
          const textError = await res.text()
          errorMessage = textError || errorMessage
        } catch {
          // Use status text as fallback
          errorMessage = res.statusText || errorMessage
        }
      }
      
      throw new Error(errorMessage)
    }
    
    const ct = res.headers.get('content-type') || ''
    return ct.includes('application/json') ? res.json() : res.text()
    
  } catch (error) {
    clearTimeout(timeoutId)
    
    // Handle different error types
    if (error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado tiempo. Intenta de nuevo.')
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Error de conexión. Verifica tu conexión a internet.')
    }
    
    // Re-throw the error
    throw error
  }
}

function formatPrice(n) { 
  try { 
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n) 
  } catch { 
    return `S/ ${n}` 
  } 
}

// Enhanced formatPrice with better error handling
export function formatPriceEnhanced(cents) {
  if (typeof cents !== 'number' || isNaN(cents)) {
    return 'S/ 0'
  }
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(cents)
}

// New utility functions for better auth management
export function clearAuthData() {
  try {
    localStorage.removeItem('auth')
  } catch {}
}

export function getAuthData() {
  return getAuth()
}

export function setAuthData(data) {
  setAuth(data)
}

// Utility function to retry failed requests
export async function retryApi(path, options = {}, retries = 3, delay = 1000) {
  let lastError
  
  for (let i = 0; i < retries; i++) {
    try {
      return await api(path, options)
    } catch (error) {
      lastError = error
      
      // Don't retry on authentication errors
      if (error.message && (error.message.includes('401') || error.message.includes('403'))) {
        throw error
      }
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError
}

// Health check function
export async function healthCheck() {
  try {
    const response = await api('/health', { timeout: 5000 })
    return { status: 'ok', response }
  } catch (error) {
    return { status: 'error', error }
  }
}

// Distancia en metros entre dos coordenadas
function haversine(a, b) {
  if (!a || !b || typeof a.lat !== 'number' || typeof a.lng !== 'number' || typeof b.lat !== 'number' || typeof b.lng !== 'number') return 0
  const R = 6371000
  const toRad = (d) => d * Math.PI / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const la1 = toRad(a.lat), la2 = toRad(b.lat)
  const h = Math.sin(dLat/2)**2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng/2)**2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function formatDuration(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return '—'
  const m = Math.round(seconds / 60)
  if (m < 1) return '<1 min'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), mm = m % 60
  return `${h} h ${mm} min`
}

export { api, getAuth, setAuth, getTenantId, setTenantId, API_BASE, formatPrice, haversine, formatDuration }
