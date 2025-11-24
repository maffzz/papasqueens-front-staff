# Fix: Login Tenant ID

## 🐛 Problema
El backend no reconocía el tenant_id porque no se estaba enviando correctamente en el request de login.

## ✅ Solución Implementada

### 1. Obtener tenant_id de la sede seleccionada
```javascript
// Antes: Usaba getTenantId() que podía estar desactualizado
let tenant_id = getTenantId()

// Ahora: Obtiene el tenant de la sede seleccionada
const selectedOption = SEDE_OPTIONS.find(s => s.id === selectedSede)
const tenant_id = selectedOption?.tenant || getTenantId() || 'tenant_pq_barranco'
```

### 2. Actualizar localStorage antes del login
```javascript
// Asegurarse de que el tenant_id esté actualizado
setTenantId(tenant_id)
```

### 3. Enviar tenant_id en múltiples lugares
```javascript
const res = await api('/auth/staff/login', { 
  method: 'POST', 
  body: JSON.stringify(payload), // tenant_id en el body
  tenantId: tenant_id,            // tenant_id en opciones
  headers: {
    'X-Tenant-Id': tenant_id      // tenant_id en headers explícito
  }
})
```

## 📋 Payload Enviado

### Body (JSON)
```json
{
  "username": "juan.perez@papasqueens.com",
  "password": "password123",
  "tenant_id": "tenant_pq_barranco"
}
```

### Headers
```
Content-Type: application/json
X-Tenant-Id: tenant_pq_barranco
```

## 🧪 Cómo Probar

1. Seleccionar una sede en el dropdown (ej: "Sede Barranco")
2. Ingresar credenciales
3. Hacer clic en "Ingresar al Sistema"
4. Abrir DevTools > Network > Ver request a `/auth/staff/login`
5. Verificar que el body incluya `tenant_id`
6. Verificar que los headers incluyan `X-Tenant-Id`

## 🔍 Debug

Se agregaron console.log para verificar:
```javascript
console.log('Login payload:', payload)
console.log('Login response:', res)
```

Puedes ver estos logs en la consola del navegador para confirmar que el tenant_id se está enviando correctamente.

## ✅ Resultado Esperado

El backend ahora debe:
- Reconocer el tenant_id correctamente
- Autenticar al usuario en la sede correcta
- Retornar el token con el tenant_id asociado
