import React, { useEffect, useState } from 'react'
import { api, getTenantId } from '../api/client'
import { useToast } from '../context/ToastContext'
import AppLayout from '../components/AppLayout'

export default function AdminStaff() {
  const [staff, setStaff] = useState([])
  const [msg, setMsg] = useState('')
  const { showToast } = useToast()

  async function load() { try { const data = await api('/staff'); setStaff(Array.isArray(data)?data:(data.items||[])) } catch { setStaff([]) } }
  useEffect(() => { load() }, [])

  async function create(ev) {
    ev.preventDefault()
    const fd = new FormData(ev.currentTarget)
    const role = (fd.get('role') || 'staff').toLowerCase()
    const payload = {
      id_staff: fd.get('id_staff'),
      tenant_id: getTenantId(),
      name: fd.get('name'),
      role,
      email: fd.get('email'),
      status: 'activo'
    }
    const validRole = ['staff','delivery','admin']
    if (!payload.id_staff || !payload.tenant_id || !payload.name || !payload.email || !validRole.includes(payload.role)) {
      setMsg('Datos inválidos'); showToast({ type:'warning', message:'Completa ID, tenant, nombre, email y rol válido' }); return
    }
    try { await api('/staff', { method:'POST', body: JSON.stringify(payload) }); setMsg('Staff creado'); showToast({ type:'success', message:'Staff creado' }); load(); ev.currentTarget.reset() } catch { setMsg('Error creando staff'); showToast({ type:'error', message:'Error creando staff' }) }
  }

  async function update(id) {
    const name = prompt('Nuevo nombre')
    const role = prompt('Nuevo rol (staff/delivery/admin)')
    const validRole = ['staff','delivery','admin']
    if (role && !validRole.includes(role)) { showToast({ type:'warning', message:'Rol inválido' }); return }
    if (!name && !role) return
    try { await api(`/staff/${encodeURIComponent(id)}`, { method:'PATCH', body: JSON.stringify({ name, role }) }); setMsg('Staff actualizado'); showToast({ type:'success', message:'Staff actualizado' }); load() } catch { setMsg('Error actualizando staff'); showToast({ type:'error', message:'Error actualizando staff' }) }
  }

  return (
    <AppLayout title="👥 Personal">

      <div className="card" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '1.5rem' }}>
        <h2 className="appTitle" style={{ marginBottom: '1rem', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ➕ Crear colaborador
        </h2>
        <form onSubmit={create} className="list">
          <input className="input" name="id_staff" placeholder="ID staff" required />
          <input className="input" name="name" placeholder="Nombre" required />
          <input className="input" name="email" type="email" placeholder="Email" required />
          <select className="input" name="role" defaultValue="staff" required>
            <option value="staff">staff</option>
            <option value="delivery">delivery</option>
            <option value="admin">admin</option>
          </select>
          <button className="btn primary" type="submit">Crear</button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '1.5rem' }}>
        <h2 className="appTitle" style={{ marginBottom: '1rem', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📋 Listado de colaboradores
        </h2>
        <div className="list">
          {staff.map(s => {
            const role = (s.role || s.rol || 'staff').toLowerCase()
            const roleIcon = role === 'admin' ? '👑' : role === 'delivery' ? '🚚' : '👨‍🍳'
            const roleColor = role === 'admin' ? '#dc2626' : role === 'delivery' ? '#0369a1' : '#03592e'
            return (
              <div className="card" key={s.id_staff} style={{ 
                borderLeft: `4px solid ${roleColor}`,
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '20px' }}>{roleIcon}</span>
                      <strong style={{ fontSize: '16px' }}>{s.name || s.nombre}</strong>
                      <small style={{ color: '#64748b' }}>(ID: {s.id_staff})</small>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      📧 {s.email}
                    </div>
                    <div style={{ 
                      marginTop: '0.5rem',
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: `${roleColor}20`,
                      color: roleColor,
                      textTransform: 'capitalize'
                    }}>
                      {role}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'.5rem' }}>
                    <button className="btn" onClick={() => update(s.id_staff)}>✏️ Editar</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: '.5rem', color:'#666' }}>{msg}</div>
      </div>
    </AppLayout>
  )
}
