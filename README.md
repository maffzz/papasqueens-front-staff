# Papas Queen's - Frontend Staff 🥔👑

Este proyecto es el **frontend de staff / administración** de Papas Queen's, construido con **React + Vite**. Permite que cocina, reparto y administradores gestionen pedidos, menú, personal y analítica de la operación. 🚀

---

## 1. Stack y dependencias principales 🧱

- **React 18** (`react`, `react-dom`).
- **React Router 6** (`react-router-dom`) para el enrutamiento SPA.
- **Vite** como bundler y dev server.
- **Leaflet** (`leaflet`) para funcionalidades de mapa (tracking de repartidores, etc. si se habilita).

> 📦 Ver `package.json` para la lista completa de dependencias.

---

## 2. Integración con el backend 🧬

Este frontend de staff está diseñado para consumir **todos los microservicios del backend** desplegados en AWS a través de API Gateway:

- **`orders-svc`** 🧾 – gestión del ciclo de vida de pedidos.
- **`kitchen-svc`** 👩‍🍳 – cola de cocina, menú y staff interno.
- **`delivery-svc`** 🛵 – asignación y seguimiento de entregas.
- **`analytics-svc`** 📊 – dashboards y métricas operativas.
- **`register`** 🔐 – login de staff.

Toda la comunicación HTTP se realiza a través de `src/api/client.js`, que encapsula:

- Base URL del API Gateway: `https://id8sfymfb7.execute-api.us-east-1.amazonaws.com/dev`.
- Headers de autenticación y multi-tenant (`Authorization`, `X-Tenant-Id`, `X-User-Id`, `X-User-Email`, `X-User-Type`).
- Manejo de timeouts (30s por defecto) y reintentos (`retryApi`).
- Utilidades para precios, distancias (haversine) y duración estimada.

> 🧩 Este frontend es el consumidor "principal" de la mayoría de endpoints del backend: cocina, delivery, administración y analytics.

---

## 3. Páginas y flujo principal 📄

Las rutas se definen en `src/App.jsx` usando `Routes` y `RequireRole` para proteger secciones por rol.

- **`/` – Login (`Login.jsx`)** 🔐
  - Pantalla de inicio de sesión para staff, delivery y admin.
  - Usa el endpoint `POST /auth/staff/login` del microservicio `register`.

- **`/dashboard` – Panel general (`Dashboard.jsx`)** 📊
  - Vista rápida del estado del sistema: pedidos activos, métricas clave, atajos a cocina/delivery.
  - Consume endpoints de `orders-svc` y `analytics-svc`.

- **`/kitchen` – Cocina (`Kitchen.jsx`)** 👩‍🍳
  - Muestra la cola de pedidos en preparación.
  - Permite aceptar y empaquetar pedidos.
  - Interactúa con `kitchen-svc` (por ejemplo `GET /kitchen/queue`, `POST /kitchen/orders/{order_id}/accept`, `POST /kitchen/orders/{order_id}/pack`) y refleja estados de `orders-svc`.

- **`/delivery` – Delivery (`Delivery.jsx`)** 🛵
  - Pantalla para coordinar repartidores y entregas.
  - Puede mostrar asignaciones, tracking de repartidores, estados de cada entrega.
  - Habla con `delivery-svc` (asignación, estado, tracking, riders) y se apoya en datos de `orders-svc`.

- **`/admin/menu` – Administración de menú (`AdminMenu.jsx`)** 📜
  - Permite listar, crear, editar y eliminar productos del menú.
  - Consume endpoints de `kitchen-svc` sobre `MenuItems` (`GET /menu`, `POST /menu`, `PATCH /menu/{id_producto}`, `DELETE /menu/{id_producto}`).

- **`/admin/staff` – Administración de staff (`AdminStaff.jsx`)** 👥
  - Gestión de personal: alta, baja, cambios de estado.
  - Usa endpoints de `kitchen-svc` para staff (`POST /staff`, `PATCH /staff/{id_staff}`, `GET /staff`) y se relaciona con la tabla `Staff` en DynamoDB.

- **`/admin/analytics` – Analytics avanzado (`AdminAnalytics.jsx`)** 📈
  - Muestra métricas agregadas de pedidos, tiempos de preparación, desempeño de repartidores y staff.
  - Consume endpoints de `analytics-svc` (`/analytics/orders`, `/analytics/employees`, `/analytics/delivery`, `/analytics/dashboard`, `/analytics/workflow-kpis`).

> 🔐 El componente `RequireRole` asegura que solo usuarios con los roles adecuados (`staff`, `delivery`, `admin`) accedan a cada ruta.

---

## 4. Cliente de API y utilidades (`src/api/client.js`) 🔌

Funciones clave:

- `api(path, opts)`
  - Wrapper general de `fetch` con:
    - Headers de autenticación y tenant.
    - Soporte de `timeout` y abort controller.
    - Manejo de 401/403 (limpia sesión y redirige a `/login`).
    - Parseo robusto de errores (JSON o texto).

- `retryApi(path, options, retries, delay)`
  - Reintenta automáticamente solicitudes fallidas (salvo errores de autenticación).

- `healthCheck()`
  - Verifica disponibilidad del backend llamando a `/health`.

- Utilidades de sesión:
  - `getAuthData`, `setAuthData`, `clearAuthData`.

- Utilidades de presentación:
  - `formatPrice`, `formatPriceEnhanced`, `haversine`, `formatDuration`.

---

## 5. Mejoras de estructura propuestas ✨

Estas mejoras **no están implementadas todavía**, pero son recomendaciones claras para evolucionar este frontend de staff:

1. **Separar vistas por dominio de negocio** 🧩
   - Crear subcarpetas bajo `src/pages` como:
     - `pages/kitchen/*` – componentes específicos de la cola de cocina.
     - `pages/delivery/*` – vistas y componentes de rutas / tracking.
     - `pages/admin/*` – menú, staff y analytics.
   - Facilita mantener y escalar cada área sin mezclar responsabilidades.

2. **Extraer hooks personalizados para datos** 🔄
   - Crear hooks como `useKitchenQueue`, `useDeliveries`, `useAdminMenu`, `useAnalyticsDashboard` dentro de `src/hooks/`.
   - Encapsular ahí las llamadas a `api`/`retryApi` y el manejo de loading/error.
   - Beneficio: las páginas se vuelven más declarativas, centradas en UI.

3. **Normalizar manejo de errores y toasts** 🔔
   - Definir una pequeña capa de helpers (`handleApiError`, `useApiToast`) que:
     - Reciba un error y muestre mensajes consistentes con el `ToastProvider`.
     - Evite repetir try/catch y lógica de mensajes en cada página.

4. **Componentizar layouts y tarjetas reutilizables** 🧱
   - Extraer componentes tipo `Card`, `Section`, `StatusBadge`, `Table` reutilizables.
   - Reducir duplicación de estilos inline y centralizar tipografía / colores en `styles.css`.

5. **Mejorar soporte offline y estados vacíos** 📶
   - Añadir estados claros para:
     - "Sin pedidos en cola" en cocina.
     - "No hay entregas activas" en delivery.
     - Mensajes amigables cuando `healthCheck` detecte que el backend está caído.

6. **Testing ligero de componentes críticos** ✅
   - Introducir pruebas básicas (ej. con Vitest/React Testing Library) al menos para:
     - `Login` (flujo de login correcto / error).
     - `Kitchen` (render de pedidos, acciones principales).
     - `Delivery` (render de lista de entregas y estados).

7. **Uso opcional de Leaflet para mapa de operaciones** 🗺️
   - Reutilizar `leaflet` para un **mapa operativo** en `Delivery` o `Dashboard`:
     - Ver repartidores en tiempo real.
     - Ver zonas de reparto o calor de pedidos.
   - Esto puede alinear visualmente con el mapa ya usado en el frontend de clientes.

---

## 6. Cómo ejecutar el frontend staff 🚀

Desde `frontend/staff`:

```bash
npm install
npm run dev
```

Luego abrir en el navegador la URL que indique Vite (por defecto `http://localhost:5174/`).

> ✅ Asegúrate de tener el backend desplegado y accesible en la URL configurada en `API_BASE` para que las llamadas funcionen correctamente.
