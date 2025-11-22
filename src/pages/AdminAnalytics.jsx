import React, { useEffect, useState } from 'react'
import { api, formatPrice } from '../api/client'
import { useToast } from '../context/ToastContext'

export default function AdminAnalytics() {
  const [orders, setOrders] = useState(null)
  const [employees, setEmployees] = useState(null)
  const [delivery, setDelivery] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [kpis, setKpis] = useState(null)
  const { showToast } = useToast()

  async function load() {
    try { setOrders(await api('/analytics/orders')) } catch (e) { console.warn('orders analytics error', e) }
    try { setEmployees(await api('/analytics/employees')) } catch (e) { console.warn('employees analytics error', e) }
    try { setDelivery(await api('/analytics/delivery')) } catch (e) { console.warn('delivery analytics error', e) }
    try { setDashboard(await api('/analytics/dashboard')) } catch (e) { console.warn('dashboard analytics error', e) }
    try { setKpis(await api('/analytics/workflow-kpis')) } catch (e) { console.warn('kpis analytics error', e) }
  }
  useEffect(() => { load() }, [])

  function percent(part, total) {
    if (!total || total <= 0) return 0
    return Math.round((part / total) * 100)
  }

  const totalOrders = orders?.total_pedidos || 0
  const avgOrderTimeMin = orders?.tiempo_promedio || 0
  const estadoDist = orders?.distribucion_estados || {}

  const totalDeliveries = delivery?.total_entregas || 0
  const avgDeliveryTimeMin = delivery?.tiempo_promedio || 0

  const totalEmployees = Array.isArray(employees) ? employees.length : 0

  return (
    <main className="container section">
      <h1 className="appTitle" style={{ color:'#03592e', marginBottom: '1rem' }}>Admin · Analytics</h1>

      {/* Resumen principal */}
      <section className="grid" style={{ gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        <div className="card" style={{ padding:'1rem 1.25rem' }}>
          <div style={{ fontSize:'12px', color:'#6b7280', marginBottom:'.25rem' }}>Órdenes totales</div>
          <div style={{ fontSize:'28px', fontWeight:700, color:'#03592e' }}>{totalOrders}</div>
          <div style={{ fontSize:'12px', color:'#6b7280', marginTop:'.25rem' }}>Tiempo promedio: {avgOrderTimeMin.toFixed ? avgOrderTimeMin.toFixed(1) : avgOrderTimeMin} min</div>
        </div>
        <div className="card" style={{ padding:'1rem 1.25rem' }}>
          <div style={{ fontSize:'12px', color:'#6b7280', marginBottom:'.25rem' }}>Entregas</div>
          <div style={{ fontSize:'28px', fontWeight:700, color:'#0369a1' }}>{totalDeliveries || '—'}</div>
          <div style={{ fontSize:'12px', color:'#6b7280', marginTop:'.25rem' }}>Tiempo promedio: {avgDeliveryTimeMin?.toFixed ? avgDeliveryTimeMin.toFixed(1) : avgDeliveryTimeMin || 0} min</div>
        </div>
        <div className="card" style={{ padding:'1rem 1.25rem' }}>
          <div style={{ fontSize:'12px', color:'#6b7280', marginBottom:'.25rem' }}>Colaboradores activos</div>
          <div style={{ fontSize:'28px', fontWeight:700, color:'#16a34a' }}>{totalEmployees}</div>
          <div style={{ fontSize:'12px', color:'#6b7280', marginTop:'.25rem' }}>Incluye cocina, despacho y delivery</div>
        </div>
      </section>

      {/* Distribución de estados de órdenes + top métricas */}
      <section className="grid" style={{ gridTemplateColumns:'minmax(0,1.2fr) minmax(0,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        <div className="card" style={{ padding:'1rem 1.25rem' }}>
          <h2 className="appTitle" style={{ fontSize:'18px', marginBottom:'.5rem' }}>Estados de órdenes</h2>
          {!orders ? (
            <div style={{ fontSize:'13px', color:'#9ca3af' }}>Sin datos</div>
          ) : (
            <ul className="list">
              {Object.keys(estadoDist).length === 0 && (
                <li style={{ fontSize:'13px', color:'#9ca3af' }}>No hay estados registrados aún.</li>
              )}
              {Object.entries(estadoDist).map(([estado, count]) => {
                const pct = percent(count, totalOrders)
                return (
                  <li key={estado} className="card" style={{ padding:'.5rem .75rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.25rem', fontSize:'13px' }}>
                      <span style={{ textTransform:'capitalize' }}>{estado.replace(/_/g,' ')}</span>
                      <span>{count} ({pct}%)</span>
                    </div>
                    <div style={{ position:'relative', height:6, background:'#e5e7eb', borderRadius:999 }}>
                      <div
                        style={{
                          position:'absolute',
                          left:0,
                          top:0,
                          bottom:0,
                          width:`${pct}%`,
                          borderRadius:999,
                          background:'#22c55e',
                          transition:'width .3s ease',
                        }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="card" style={{ padding:'1rem 1.25rem' }}>
          <h2 className="appTitle" style={{ fontSize:'18px', marginBottom:'.5rem' }}>Resumen financiero</h2>
          {!dashboard ? (
            <div style={{ fontSize:'13px', color:'#9ca3af' }}>Sin datos</div>
          ) : (
            <div className="list" style={{ fontSize:'13px' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span>Ingresos totales</span>
                <span>{formatPrice(dashboard.total_ingresos || 0)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span>Ticket promedio</span>
                <span>{formatPrice(dashboard.ticket_promedio || 0)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span>Órdenes por día (últimos 7 días)</span>
                <span>{dashboard.ordenes_ultimos_7_dias || '—'}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* KPIs de workflow y responsables */}
      <section className="card" style={{ marginTop: '0.5rem', padding:'1rem 1.25rem' }}>
        <h2 className="appTitle" style={{ fontSize:'18px', marginBottom:'.75rem' }}>KPIs de workflow</h2>
        {!kpis ? (
          <div style={{ fontSize:'13px', color:'#9ca3af' }}>Sin datos de workflow aún.</div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns:'minmax(0,1.2fr) minmax(0,1fr)', gap:'1rem' }}>
            <div className="card" style={{ padding:'.75rem 1rem' }}>
              <strong style={{ fontSize:'13px' }}>Tiempos por etapa (min)</strong>
              <ul className="list" style={{ marginTop:'.5rem' }}>
                {Object.entries(kpis.timings || {}).map(([k,v]) => (
                  <li key={k} className="card" style={{ padding:'.4rem .6rem', fontSize:'12px', display:'flex', justifyContent:'space-between' }}>
                    <div style={{ textTransform:'capitalize' }}>{k.replace(/_/g,' ')}</div>
                    <div>
                      avg {Number(v.avg_min||0).toFixed(1)} · p50 {Number(v.p50_min||0).toFixed(1)} · p95 {Number(v.p95_min||0).toFixed(1)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ padding:'.75rem 1rem' }}>
              <strong style={{ fontSize:'13px' }}>Top responsables</strong>
              <div className="grid" style={{ gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:'.5rem', marginTop:'.5rem' }}>
                {['accepted_by','packed_by','delivered_by'].map(key => (
                  <div key={key} className="card" style={{ padding:'.4rem .5rem', fontSize:'12px' }}>
                    <div style={{ textTransform:'capitalize', marginBottom:'.25rem', fontWeight:600 }}>{key.replace('_',' ')}</div>
                    <ul className="list">
                      {Object.entries((kpis.responsables||{})[key] || {}).map(([id, count]) => (
                        <li key={id} style={{ display:'flex', justifyContent:'space-between' }}>
                          <span>{id}</span>
                          <span>{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
