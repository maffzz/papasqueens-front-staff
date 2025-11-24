# Guía para Corregir CORS en las Funciones Lambda

## Problema
Las funciones Lambda no están retornando los headers CORS necesarios, causando errores en el frontend.

## Solución: Headers CORS Requeridos

Cada función Lambda debe retornar estos headers en **TODAS** las respuestas (éxito y error):

```python
# Python Lambda
def lambda_handler(event, context):
    # Headers CORS que SIEMPRE deben incluirse
    cors_headers = {
        'Access-Control-Allow-Origin': '*',  # O tu dominio específico
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Id,X-User-Email,X-User-Type,X-Tenant-Id',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Max-Age': '86400'
    }
    
    try:
        # Tu lógica aquí
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'message': 'Success'})
        }
    except Exception as e:
        # IMPORTANTE: También en errores
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)})
        }
```

```javascript
// Node.js Lambda
exports.handler = async (event) => {
    // Headers CORS que SIEMPRE deben incluirse
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Id,X-User-Email,X-User-Type,X-Tenant-Id',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Max-Age': '86400'
    };
    
    try {
        // Tu lógica aquí
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Success' })
        };
    } catch (error) {
        // IMPORTANTE: También en errores
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

## Funciones Lambda que Necesitan Corrección

Basándome en el código del frontend, estas son las rutas que necesitan headers CORS:

### Autenticación
- `POST /auth/staff/login`

### Kitchen
- `GET /kitchen/queue`
- `POST /kitchen/orders/{id}/accept`
- `POST /kitchen/orders/{id}/pack`

### Delivery
- `GET /riders`
- `GET /delivery`
- `POST /delivery/assign`
- `POST /delivery/location`
- `GET /delivery/{id}`
- `GET /delivery/{id}/track`
- `POST /delivery/orders/{id}/handoff`
- `POST /delivery/orders/{id}/delivered`
- `PATCH /delivery/{id}/status`
- `PATCH /riders/{id}/status`
- `POST /orders/{id}/staff-confirm-delivered`

### Admin
- `GET /staff`
- `POST /staff`
- `PATCH /staff/{id}`
- `GET /menu`
- `POST /menu`
- `PATCH /menu/{id}`
- `DELETE /menu/{id}`
- `GET /analytics/orders`
- `GET /analytics/employees`
- `GET /analytics/delivery`
- `GET /analytics/dashboard`
- `GET /analytics/workflow-kpis`

### Health Check
- `GET /health`

## Manejo de Preflight (OPTIONS)

API Gateway debe estar configurado para manejar requests OPTIONS automáticamente, o cada Lambda debe responder a OPTIONS:

```python
def lambda_handler(event, context):
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Id,X-User-Email,X-User-Type,X-Tenant-Id',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Max-Age': '86400'
    }
    
    # Manejar preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': ''
        }
    
    # Resto de la lógica...
```

## Configuración en API Gateway (Alternativa)

Si prefieres configurar CORS en API Gateway en lugar de en cada Lambda:

1. Ve a API Gateway Console
2. Selecciona tu API
3. Para cada recurso/método:
   - Habilita CORS
   - Configura los headers permitidos
   - Despliega los cambios

**IMPORTANTE**: Aún así, las Lambdas deben retornar los headers CORS en sus respuestas.

## Verificación

Para verificar que CORS está funcionando:

```bash
# Test preflight
curl -X OPTIONS https://tu-api.execute-api.region.amazonaws.com/dev/endpoint \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v

# Debe retornar headers Access-Control-Allow-*
```

## Checklist de Implementación

- [ ] Agregar headers CORS a todas las respuestas exitosas
- [ ] Agregar headers CORS a todas las respuestas de error
- [ ] Manejar requests OPTIONS (preflight)
- [ ] Incluir todos los headers personalizados en Access-Control-Allow-Headers
- [ ] Verificar que Access-Control-Allow-Origin esté configurado correctamente
- [ ] Desplegar cambios en todas las Lambdas
- [ ] Probar desde el frontend
