import React, { useEffect, useState } from 'react'
import { api, getTenantId } from '../api/client'
import { useToast } from '../context/ToastContext'

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
    <main className="container section">
      <h1 className="appTitle" style={{ color:'#03592e' }}>Admin: Staff</h1>

      <div className="card">
        <h2 className="appTitle" style={{ marginBottom: '.5rem' }}>Crear Staff</h2>
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

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 className="appTitle" style={{ marginBottom: '.5rem' }}>Listado</h2>
        <div className="list">
          {staff.map(s => (
            <div className="card" key={s.id_staff}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div><strong>{s.name || s.nombre}</strong> <small>(ID: {s.id_staff})</small></div>
                  <div style={{ color:'#666' }}>Rol: {s.role || s.rol || 'staff'}</div>
                </div>
                <div style={{ display:'flex', gap:'.5rem' }}>
                  <button className="btn" onClick={() => update(s.id_staff)}>Editar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '.5rem', color:'#666' }}>{msg}</div>
      </div>
    </main>
  )
}
