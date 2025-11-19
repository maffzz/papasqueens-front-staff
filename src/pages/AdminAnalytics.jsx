import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'

export default function AdminAnalytics() {
  const [orders, setOrders] = useState(null)
  const [employees, setEmployees] = useState(null)
  const [delivery, setDelivery] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [kpis, setKpis] = useState(null)
  const { showToast } = useToast()
  const [orderId, setOrderId] = useState('')
  const [newStatus, setNewStatus] = useState('')

  async function load() {
    try { setOrders(await api('/analytics/orders')) } catch {}
    try { setEmployees(await api('/analytics/employees')) } catch {}
    try { setDelivery(await api('/analytics/delivery')) } catch {}
    try { setDashboard(await api('/analytics/dashboard')) } catch {}
    try { setKpis(await api('/analytics/workflow-kpis')) } catch {}
  }
  useEffect(() => { load() }, [])

  async function patchOrderStatus(ev) {
    ev.preventDefault()
    if (!orderId || !newStatus) { showToast({ type:'warning', message:'Ingresa ID y nuevo estado' }); return }
    try { await api(`/orders/${encodeURIComponent(orderId)}/status`, { method:'PATCH', body: JSON.stringify({ status: newStatus }) }); showToast({ type:'success', message:'Estado actualizado' }) } catch { showToast({ type:'error', message:'No se pudo actualizar' }) }
  }

  const Card = ({ title, data }) => (
    <div className="card">
      <h3 className="appTitle" style={{ marginBottom: '.5rem' }}>{title}</h3>
      <pre style={{ whiteSpace:'pre-wrap' }}>{data ? JSON.stringify(data, null, 2) : 'Sin datos'}</pre>
    </div>
  )

  return (
    <main className="container section">
      <h1 className="appTitle" style={{ color:'#03592e' }}>Admin: Analytics</h1>
      <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <Card title="Órdenes" data={orders} />
        <Card title="Empleados" data={employees} />
        <Card title="Delivery" data={delivery} />
        <Card title="Dashboard" data={dashboard} />
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 className="appTitle" style={{ marginBottom: '.5rem' }}>KPIs de Workflow</h3>
        {!kpis ? <div>—</div> : (
          <div className="list">
            <div className="card">
              <strong>Tiempos (min)</strong>
              <ul className="list">
                {Object.entries(kpis.timings || {}).map(([k,v]) => (
                  <li key={k} className="card" style={{ display:'flex', justifyContent:'space-between' }}>
                    <div style={{ textTransform:'capitalize' }}>{k.replaceAll('_',' ')}</div>
                    <div>avg: {Number(v.avg_min||0).toFixed(1)} · p50: {Number(v.p50_min||0).toFixed(1)} · p95: {Number(v.p95_min||0).toFixed(1)}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <strong>Responsables (conteo)</strong>
              <div className="grid" style={{ gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:'.5rem' }}>
                {['accepted_by','packed_by','delivered_by'].map(key => (
                  <div key={key} className="card">
                    <div style={{ textTransform:'capitalize', marginBottom:'.25rem' }}>{key.replace('_',' ')}</div>
                    <ul className="list">
                      {Object.entries((kpis.responsables||{})[key] || {}).map(([id, count]) => (
                        <li key={id} className="card" style={{ display:'flex', justifyContent:'space-between' }}>
                          <span>{id}</span><span>{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 className="appTitle" style={{ marginBottom: '.5rem' }}>Actualizar estado de orden</h3>
        <form onSubmit={patchOrderStatus} className="list">
          <input className="input" value={orderId} onChange={e=>setOrderId(e.target.value)} placeholder="ID de orden" />
          <input className="input" value={newStatus} onChange={e=>setNewStatus(e.target.value)} placeholder="Nuevo estado" />
          <button className="btn primary" type="submit">Actualizar</button>
        </form>
      </div>
    </main>
  )
}
