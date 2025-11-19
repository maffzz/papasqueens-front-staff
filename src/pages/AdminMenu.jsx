import React, { useEffect, useState } from 'react'
import { api, formatPrice, getTenantId } from '../api/client'
import { useToast } from '../context/ToastContext'

export default function AdminMenu() {
  const [items, setItems] = useState([])
  const [msg, setMsg] = useState('')
  const { showToast } = useToast()

  async function load() {
    try { const data = await api('/menu'); setItems(Array.isArray(data) ? data : (data.items || [])) } catch (e) { setItems([]) }
  }
  useEffect(() => { load() }, [])

  async function create(ev) {
    ev.preventDefault()
    const fd = new FormData(ev.currentTarget)
    const payload = {
      tenant_id: getTenantId(),
      nombre: fd.get('nombre'),
      categoria: fd.get('categoria'),
      precio: parseFloat(fd.get('precio')||'0'),
      available: true
    }
    if (!payload.tenant_id || !payload.nombre || !payload.categoria || !(payload.precio > 0)) { setMsg('Datos inválidos'); showToast({ type:'warning', message:'Completa tenant, nombre, categoría y precio > 0' }); return }
    try { await api('/menu', { method:'POST', body: JSON.stringify(payload) }); setMsg('Producto creado'); showToast({ type:'success', message:'Producto creado' }); load(); ev.currentTarget.reset() } catch (e) { setMsg('Error creando producto'); showToast({ type:'error', message:'Error creando producto' }) }
  }

  async function update(id, body) {
    try { await api(`/menu/${encodeURIComponent(id)}`, { method:'PATCH', body: JSON.stringify(body) }); setMsg('Actualizado'); showToast({ type:'success', message:'Producto actualizado' }); load() } catch (e) { setMsg('Error actualizando'); showToast({ type:'error', message:'Error actualizando' }) }
  }
  async function remove(id) {
    if (!confirm('Eliminar producto?')) return;
    try { await api(`/menu/${encodeURIComponent(id)}`, { method:'DELETE' }); setMsg('Eliminado'); showToast({ type:'success', message:'Producto eliminado' }); load() } catch (e) { setMsg('Error eliminando'); showToast({ type:'error', message:'Error eliminando' }) }
  }

  return (
    <main className="container section">
      <h1 className="appTitle" style={{ color:'#03592e' }}>Admin: Menú</h1>

      <div className="card">
        <h2 className="appTitle" style={{ marginBottom: '.5rem' }}>Crear producto</h2>
        <form onSubmit={create} className="list">
          <input className="input" name="nombre" placeholder="Nombre" required />
          <input className="input" name="categoria" placeholder="Categoría" required />
          <input className="input" name="precio" placeholder="Precio (PEN)" required />
          <button className="btn primary" type="submit">Crear</button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 className="appTitle" style={{ marginBottom: '.5rem' }}>Listado</h2>
        <div className="grid" style={{ gridTemplateColumns:'repeat(3, minmax(0,1fr))' }}>
          {items.map(it => (
            <div className="card" key={it.id_producto}>
              {it.image_url && (
                <div style={{ marginBottom: '.5rem' }}>
                  <img
                    src={it.image_url}
                    alt={it.nombre}
                    style={{ width:'100%', height:'140px', objectFit:'cover', borderRadius:'.5rem' }}
                  />
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:600 }}>{it.nombre}</div>
                  <div className="price">{formatPrice(it.precio || 0)}</div>
                </div>
                <div style={{ display:'flex', gap:'.5rem' }}>
                  <button className="btn" onClick={() => update(it.id_producto, { precio: parseFloat(prompt('Nuevo precio', it.precio)||it.precio) })}>$</button>
                  <button className="btn" onClick={() => update(it.id_producto, { nombre: prompt('Nuevo nombre', it.nombre)||it.nombre })}>✎</button>
                  <button className="btn danger" onClick={() => remove(it.id_producto)}>🗑</button>
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
