# 🎨 Sistema de Diseño - Papas Queen's Staff Portal

## 📋 Índice
1. [Filosofía de Diseño](#filosofía-de-diseño)
2. [Paleta de Colores](#paleta-de-colores)
3. [Tipografía](#tipografía)
4. [Componentes](#componentes)
5. [Layout](#layout)
6. [Espaciado y Grid](#espaciado-y-grid)
7. [Animaciones](#animaciones)
8. [Responsive Design](#responsive-design)

---

## 🎯 Filosofía de Diseño

### Identidad Visual
El sistema está diseñado para reflejar la **identidad gastronómica de Papas Queen's**, combinando:
- **Profesionalismo corporativo**: Layout estructurado, jerarquía clara
- **Calidez gastronómica**: Colores cálidos, iconografía temática
- **Eficiencia operacional**: Interfaces optimizadas para uso rápido en cocina/delivery

### Principios Clave
1. **Claridad**: Información jerárquica y fácil de escanear
2. **Consistencia**: Componentes reutilizables con comportamiento predecible
3. **Feedback**: Estados visuales claros para todas las acciones
4. **Accesibilidad**: Contraste adecuado, tamaños táctiles óptimos

---

## 🎨 Paleta de Colores

### Colores de Marca
```css
--queens-green: #03592E      /* Verde principal - identidad marca */
--queens-green-dark: #024020 /* Verde oscuro - hover/sombras */
--queens-green-light: #0a7f4a /* Verde claro - gradientes */
--queens-gold: #FFB800        /* Dorado papas - acentos */
--queens-orange: #FF6B35      /* Naranja comida - estados activos */
--queens-red: #DC2626         /* Rojo - alertas/urgente */
```

### Tonos Cálidos Gastronómicos
```css
--warm-cream: #FFF8E7   /* Crema - fondos suaves */
--warm-beige: #F5E6D3   /* Beige - cards especiales */
--warm-brown: #8B4513   /* Marrón - textos secundarios */
--kitchen-steel: #475569 /* Acero cocina - elementos metálicos */
```

### Neutrales con Calidez

Escala de grises con tono cálido (no fríos):
```css
--neutral-50: #FAFAF9   /* Casi blanco */
--neutral-100: #F5F5F4  /* Fondo principal */
--neutral-200: #E7E5E4  /* Bordes suaves */
--neutral-300: #D6D3D1  /* Bordes normales */
--neutral-400: #A8A29E  /* Placeholders */
--neutral-500: #78716C  /* Texto secundario */
--neutral-600: #57534E  /* Texto normal */
--neutral-700: #44403C  /* Texto importante */
--neutral-800: #292524  /* Texto principal */
--neutral-900: #1C1917  /* Texto muy oscuro */
```

### Estados Operacionales
Colores semánticos para estados de pedidos/entregas:
```css
--status-pending: #FFB800    /* Pendiente - dorado */
--status-cooking: #FF6B35    /* En preparación - naranja */
--status-ready: #10B981      /* Listo - verde brillante */
--status-delivery: #3B82F6   /* En camino - azul */
--status-urgent: #EF4444     /* Urgente - rojo */
--status-completed: #10B981  /* Completado - verde */
```

### Uso de Colores

#### Verde Marca (Primary)
- **Sidebar**: Fondo con gradiente
- **Botones primarios**: Acciones principales
- **Títulos**: Headers y secciones importantes
- **Estados activos**: Navegación seleccionada

#### Dorado (Accent)
- **Precios**: Destacar valores monetarios
- **Badges de sede**: Identificación de local
- **Hover effects**: Elementos interactivos
- **Iconos especiales**: Destacar funcionalidades premium

#### Naranja (Active)
- **Estados en proceso**: Pedidos cocinándose
- **Alertas moderadas**: Requieren atención
- **Indicadores de actividad**: Procesos en curso

---

## ✍️ Tipografía

### Familias Tipográficas
```css
--font-primary: 'Inter'   /* Contenido, UI, formularios */
--font-display: 'Poppins' /* Títulos, headers, destacados */
```

### Escala Tipográfica


| Elemento | Tamaño | Peso | Familia | Uso |
|----------|--------|------|---------|-----|
| Display | 32px | 700 | Poppins | Títulos de página principales |
| H1 | 24px | 700 | Poppins | Títulos de sección |
| H2 | 20px | 700 | Poppins | Subtítulos, cards importantes |
| H3 | 18px | 600 | Poppins | Títulos de cards |
| Body Large | 16px | 400 | Inter | Texto destacado |
| Body | 15px (0.9375rem) | 400 | Inter | Texto principal |
| Body Small | 14px | 400 | Inter | Texto secundario |
| Caption | 13px | 500 | Inter | Labels, metadata |
| Tiny | 12px | 500 | Inter | Timestamps, notas |
| Label | 11px | 600 | Inter | Labels de formulario |

### Jerarquía Visual
1. **Títulos de página**: Poppins 32px, color verde marca
2. **Subtítulos**: Poppins 20px, color neutral-800
3. **Texto principal**: Inter 15px, color neutral-800
4. **Texto secundario**: Inter 14px, color neutral-500
5. **Metadata**: Inter 12px, color neutral-400

---

## 🧩 Componentes

### 1. Buttons (Botones)

#### Variantes
```css
.btn                 /* Base: padding, border-radius, transitions */
.btn-primary         /* Verde marca con gradiente */
.btn-secondary       /* Outline verde */
.btn-success         /* Verde brillante */
.btn-warning         /* Dorado */
.btn-danger          /* Rojo */
.btn-ghost           /* Transparente con borde */
```

#### Anatomía
- **Padding**: 0.625rem 1.25rem (10px 20px)
- **Border radius**: 0.5rem (8px)
- **Font weight**: 600
- **Font size**: 0.9375rem (15px)
- **Gap interno**: 0.5rem entre icono y texto
- **Transition**: all 0.2s ease

#### Estados
- **Default**: Color base, sombra suave
- **Hover**: translateY(-1px), sombra más pronunciada
- **Active**: translateY(0), sombra reducida
- **Disabled**: opacity 0.5, cursor not-allowed
- **Loading**: Spinner animado, texto "Procesando..."

#### Ejemplos de Uso

```jsx
// Botón primario con icono
<button className="btn primary">
  ✅ Aceptar pedido
</button>

// Botón de peligro
<button className="btn danger">
  🗑️ Eliminar
</button>

// Botón ghost para acciones secundarias
<button className="btn ghost">
  Cancelar
</button>
```

### 2. Cards (Tarjetas)

#### Anatomía Base
```css
.card {
  background: white;
  border-radius: 0.75rem;      /* 12px */
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #E7E5E4;
  padding: 1.5rem;             /* 24px */
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```

#### Variantes Especiales

**Card con borde de estado**
```jsx
<div className="card" style={{ 
  borderLeft: '4px solid #10B981'  /* Verde = listo */
}}>
  {/* Contenido */}
</div>
```

**Card con gradiente (destacado)**
```jsx
<div className="card" style={{ 
  background: 'linear-gradient(135deg, #03592e 0%, #0a7f4a 100%)',
  color: 'white'
}}>
  {/* Contenido */}
</div>
```

**Card interactiva (clickeable)**
```jsx
<div className="card" style={{ 
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}}>
  {/* Hover: transform: translateY(-2px) */}
</div>
```

### 3. Inputs (Campos de entrada)

#### Anatomía
```css
.input {
  width: 100%;
  padding: 0.75rem 1rem;       /* 12px 16px */
  border: 2px solid #D6D3D1;
  border-radius: 0.5rem;       /* 8px */
  font-size: 0.9375rem;        /* 15px */
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #03592E;
  box-shadow: 0 0 0 3px rgba(3, 89, 46, 0.1);
}
```

#### Estados
- **Default**: Borde neutral-300
- **Focus**: Borde verde marca + ring verde suave
- **Error**: Borde rojo + ring rojo
- **Disabled**: Background neutral-100, cursor not-allowed
- **Placeholder**: Color neutral-400

### 4. Badges (Etiquetas de estado)

#### Anatomía
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;       /* Pill shape */
  font-size: 0.8125rem;        /* 13px */
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}
```

#### Variantes por Estado


| Estado | Background | Color | Uso |
|--------|-----------|-------|-----|
| Pending | rgba(255,184,0,0.15) | #B8860B | Pedidos pendientes |
| Cooking | rgba(255,107,53,0.15) | #C1440E | En preparación |
| Ready | rgba(16,185,129,0.15) | #047857 | Listo para entrega |
| Delivery | rgba(59,130,246,0.15) | #1E40AF | En camino |
| Urgent | rgba(239,68,68,0.15) | #B91C1C | Requiere atención |

#### Ejemplo
```jsx
<span className="badge badge-cooking">
  🔥 En preparación
</span>
```

### 5. Loading Spinner

#### Anatomía
```css
.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(3, 89, 46, 0.2);
  border-radius: 50%;
  border-top-color: #03592E;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

#### Tamaños
- **Small**: 16px × 16px, border 2px
- **Medium**: 20px × 20px, border 3px (default)
- **Large**: 48px × 48px, border 4px

---

## 🏗️ Layout

### Estructura Principal

```
┌─────────────────────────────────────────┐
│           TopBar (70px)                 │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │      Page Content            │
│ (260px)  │      (flex: 1)               │
│          │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

### 1. Sidebar

#### Dimensiones
- **Width**: 260px (desktop), 80px (tablet)
- **Background**: Gradiente verde oscuro a verde marca
- **Z-index**: 100

#### Secciones
1. **Header** (padding: 1.5rem)
   - Logo circular (48px)
   - Nombre marca (Poppins 18px)
   - Subtítulo (Inter 12px)

2. **Navigation** (flex: 1, overflow-y: auto)
   - Secciones con labels
   - Items con iconos + texto
   - Estado activo con borde dorado

3. **Footer** (padding: 1.5rem)
   - Copyright
   - Versión (opcional)

#### Item de Navegación
```css
.sidebar-nav-item {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  color: rgba(255,255,255,0.85);
  transition: all 0.2s ease;
}

.sidebar-nav-item:hover {
  background: rgba(255,255,255,0.1);
  transform: translateX(2px);
}

.sidebar-nav-item.active {
  background: rgba(255,255,255,0.15);
  box-shadow: inset 3px 0 0 #FFB800;
  font-weight: 600;
}
```

### 2. TopBar

#### Dimensiones
- **Height**: 70px
- **Background**: White
- **Border-bottom**: 1px solid neutral-200
- **Z-index**: 50

#### Estructura
```
┌─────────────────────────────────────────────────┐
│ [Título]    [Sede] [Status] [Avatar] [Logout]  │
└─────────────────────────────────────────────────┘
```

#### Elementos


**Sede Badge**
```jsx
<div className="topbar-sede">
  <span>🏪</span>
  <span>Barranco</span>
</div>
```
- Background: warm-cream
- Border: 1px solid queens-gold
- Padding: 0.5rem 1rem
- Border-radius: 0.5rem

**Status Indicator**
```jsx
<div className="topbar-status">
  <div className="topbar-status-dot"></div>
  <span>En línea</span>
</div>
```
- Dot: 8px, verde, con animación pulse
- Texto: Inter 14px, neutral-600

**User Avatar**
```jsx
<div className="topbar-user-avatar">
  JD
</div>
```
- Size: 40px × 40px
- Background: Gradiente verde
- Border-radius: 50%
- Iniciales: Poppins 16px, bold, white

### 3. Page Content

#### Container
```css
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem 1rem;
  background: #F5F5F4;
}
```

#### Max Width
- **Desktop**: 1400px centrado
- **Tablet**: 100% con padding lateral
- **Mobile**: 100% con padding reducido

---

## 📐 Espaciado y Grid

### Sistema de Espaciado (8px base)

```css
--spacing-xs: 0.25rem    /* 4px */
--spacing-sm: 0.5rem     /* 8px */
--spacing-md: 1rem       /* 16px */
--spacing-lg: 1.5rem     /* 24px */
--spacing-xl: 2rem       /* 32px */
--spacing-2xl: 3rem      /* 48px */
```

### Uso de Espaciado

| Contexto | Espaciado |
|----------|-----------|
| Gap entre cards | lg (24px) |
| Padding de cards | lg (24px) |
| Gap entre elementos de formulario | md (16px) |
| Margin entre secciones | xl (32px) |
| Padding de botones | sm + md (8px 16px) |
| Gap entre iconos y texto | sm (8px) |

### Grid System

#### Grid Responsivo
```css
.grid {
  display: grid;
  gap: 1.5rem;
}

/* Auto-fit con mínimo */
.grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

/* Columnas fijas */
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }
```

#### Layouts Comunes

**Dashboard Cards (3 columnas)**
```css
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
gap: 1.5rem;
```

**Sidebar + Content (2 columnas asimétricas)**
```css
grid-template-columns: 1.3fr 1fr;
gap: 1.5rem;
align-items: start;
```

**Analytics (2 columnas con proporción)**
```css
grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
gap: 1.5rem;
```

---

## 🎬 Animaciones

### Transiciones Base
```css
transition: all 0.2s ease;
```

### Animaciones Específicas

#### 1. Hover Lift (Botones, Cards)
```css
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

#### 2. Pulse (Badges urgentes, Status dots)
```css
@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.badge-urgent {
  animation: pulse-badge 2s ease-in-out infinite;
}
```

#### 3. Spin (Loading)
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 0.8s linear infinite;
}
```

#### 4. Fade In (Toasts, Modals)
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

#### 5. Slide In (Sidebar items)
```css
.sidebar-nav-item:hover {
  transform: translateX(2px);
}
```

### Timing Functions
- **ease**: Transiciones generales
- **ease-in-out**: Animaciones suaves
- **linear**: Spinners, rotaciones
- **cubic-bezier(0.4, 0, 0.2, 1)**: Animaciones custom

---

## 📱 Responsive Design

### Breakpoints
