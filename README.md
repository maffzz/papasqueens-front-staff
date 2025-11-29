# 🍟 Papas Queen's - Staff Portal

Sistema de gestión operacional para restaurantes con identidad gastronómica profesional.

## 🎨 Características del Diseño

### Identidad Visual
- **Paleta de colores corporativa**: Verde marca (#03592E), Dorado papas (#FFB800), Naranja comida (#FF6B35)
- **Tipografía moderna**: Inter para contenido + Poppins para títulos
- **Iconografía gastronómica**: 🍟👨‍🍳🚚📦 integrados en toda la interfaz
- **Layout profesional**: Sidebar + TopBar + Content area con navegación fluida

### Componentes Principales
- **Sidebar**: Navegación con iconos temáticos y estados activos
- **TopBar**: Información de sede, estado de conexión y perfil de usuario
- **Cards**: Diseño moderno con hover effects y gradientes
- **Badges**: Estados visuales para pedidos y entregas

## 📦 Módulos del Sistema

### 🏠 Dashboard
Panel principal con acceso rápido a todos los módulos según rol del usuario.

### 👨‍🍳 Kitchen (Cocina)
- Cola de pedidos en tiempo real
- Estados: Pendiente → En preparación → Listo
- Gestión de tiempos de preparación
- Interfaz optimizada para ambiente de cocina

### 🚚 Delivery
- Gestión de entregas activas
- Asignación de repartidores
- Tracking GPS en tiempo real
- Simulación de rutas
- Estados: Listo para entrega → En camino → Entregado

### 📊 Analytics (Admin)
- Métricas de órdenes y entregas
- KPIs de workflow
- Tiempos promedio por etapa
- Top responsables por proceso
- Dashboard financiero

### 🍟 Admin Menu
- Gestión de productos del menú
- Categorías y precios
- Imágenes de productos
- Disponibilidad en tiempo real

### 👥 Admin Staff
- Gestión de colaboradores
- Roles: Admin, Staff (Cocina), Delivery
- Estados y permisos
- Información de contacto

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Estilos**: CSS Variables + Custom Design System
- **Mapas**: Leaflet para tracking GPS
- **API**: REST con autenticación JWT
- **Multi-tenancy**: Soporte para múltiples sedes

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview
```

## 🔐 Autenticación

El sistema usa JWT con multi-tenancy. Cada usuario pertenece a una sede específica:

- `tenant_pq_barranco` - Barranco (UTEC)
- `tenant_pq_puruchuco` - Puruchuco
- `tenant_pq_vmt` - Villa María del Triunfo
- `tenant_pq_jiron` - Jirón de la Unión

## 📱 Roles y Permisos

### Admin
- Acceso completo a todos los módulos
- Gestión de menú y personal
- Analytics y reportes

### Staff (Cocina)
- Dashboard
- Kitchen (gestión de pedidos)
- Visualización de entregas

### Delivery
- Dashboard
- Delivery (gestión de entregas)
- GPS tracking y rutas

## 🎯 Características Destacadas

### Sistema de Notificaciones (Toast)
Feedback visual para todas las acciones del usuario con estados de éxito, error, advertencia e información.

### Tracking GPS en Tiempo Real
- Ubicación automática del dispositivo
- Tracking continuo durante entregas
- Simulación de rutas para testing
- Visualización en mapa interactivo

### Multi-sede (Tenancy)
Cada sede opera de forma independiente con sus propios:
- Pedidos y entregas
- Personal
- Menú (compartido pero con disponibilidad por sede)
- Analytics

### Diseño Responsive
Optimizado para:
- Desktop (1920x1080+)
- Tablet (1024x768)
- Mobile (375x667+)

## 🏗️ Estructura del Proyecto

```
src/
├── api/
│   └── client.js          # Cliente API + helpers
├── components/
│   ├── AppLayout.jsx      # Layout principal
│   ├── Sidebar.jsx        # Navegación lateral
│   ├── TopBar.jsx         # Barra superior
│   └── StaffHeader.jsx    # Header alternativo
├── context/
│   ├── AuthContext.jsx    # Autenticación
│   └── ToastContext.jsx   # Notificaciones
├── hooks/
│   ├── useDeliveryData.js # Hook para delivery
│   └── useKitchenQueue.js # Hook para cocina
├── pages/
│   ├── Login.jsx          # Autenticación
│   ├── Dashboard.jsx      # Panel principal
│   ├── Kitchen.jsx        # Módulo cocina
│   ├── Delivery.jsx       # Módulo delivery
│   ├── AdminAnalytics.jsx # Analytics
│   ├── AdminMenu.jsx      # Gestión menú
│   └── AdminStaff.jsx     # Gestión personal
├── App.jsx                # Router principal
├── main.jsx               # Entry point
└── styles.css             # Sistema de diseño
```

## 🎨 Sistema de Diseño

### Variables CSS
Todas las variables están centralizadas en `styles.css`:
- Colores de marca
- Espaciado consistente
- Sombras profesionales
- Tipografía escalable
- Bordes y radios

### Componentes Reutilizables
- `.btn` con variantes: primary, success, warning, danger, ghost
- `.card` con hover effects
- `.badge` con estados operacionales
- `.input` con focus states
- `.grid` con layouts responsivos

## 📝 Convenciones de Código

- Componentes en PascalCase
- Hooks con prefijo `use`
- Contextos con sufijo `Context`
- Estilos inline solo para valores dinámicos
- CSS classes para estilos estáticos

## 🔄 Flujo de Trabajo

### Pedido Completo
1. **Cliente** → Crea pedido (app móvil/web)
2. **Kitchen** → Acepta y prepara pedido
3. **Kitchen** → Marca como listo
4. **Delivery** → Sistema crea entrega automática
5. **Delivery** → Staff asigna repartidor
6. **Delivery** → Repartidor recoge y entrega
7. **Sistema** → Genera recibo y cierra pedido

### Estados de Pedido
- `pendiente` → Esperando aceptación
- `aceptado` → En cola de cocina
- `en_preparacion` → Cocinándose
- `listo` → Esperando entrega
- `en_camino` → Repartidor en ruta
- `entregado` → Completado

## 🌐 API Endpoints

```
POST   /auth/login              # Login
GET    /orders                  # Lista pedidos
PATCH  /orders/:id/accept       # Aceptar pedido
PATCH  /orders/:id/start        # Iniciar preparación
PATCH  /orders/:id/ready        # Marcar listo
POST   /delivery/assign         # Asignar delivery
POST   /delivery/location       # Actualizar GPS
GET    /delivery/:id/track      # Track delivery
GET    /analytics/*             # Métricas
GET    /menu                    # Productos
GET    /staff                   # Personal
```

## 🐛 Debugging

### Logs del Sistema
El sistema incluye logs detallados en consola para:
- Llamadas API
- Cambios de estado
- Errores de red
- Actualizaciones GPS

### Variables de Entorno
```env
VITE_API_URL=https://api.papasqueens.com
VITE_TENANT_ID=tenant_pq_barranco
```

## 📄 Licencia

Propietario - Papas Queen's © 2024

---

**Desarrollado con 🍟 para Papas Queen's**
