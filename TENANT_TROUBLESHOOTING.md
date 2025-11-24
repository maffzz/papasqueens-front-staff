# Troubleshooting: Solo funciona para Barranco

## 🔍 Diagnóstico

### Paso 1: Verificar qué se está enviando
Abre la consola del navegador (F12) y verás logs como:
```
🔍 Login Debug:
  - Selected Sede: puruchuco
  - Tenant ID: tenant_pq_puruchuco
  - Payload: {username: "...", password: "...", tenant_id: "tenant_pq_puruchuco"}
```

### Paso 2: Verificar el request en Network
1. Abre DevTools > Network
2. Intenta hacer login con otra sede (ej: Puruchuco)
3. Busca el request a `/auth/staff/login`
4. Verifica:
   - **Request Headers**: Debe incluir `X-Tenant-Id: tenant_pq_puruchuco`
   - **Request Payload**: Debe incluir `"tenant_id": "tenant_pq_puruchuco"`

### Paso 3: Verificar la respuesta del backend
Si el request es correcto pero falla, revisa la respuesta:
```
❌ Login error: Error 401
  - Error message: Usuario o contraseña incorrectos
```

## 🐛 Posibles Causas

### 1. Backend solo tiene usuarios en Barranco
**Síntoma**: Error 401 o "Usuario no encontrado" para otras sedes

**Solución**: Crear usuarios en las otras sedes usando el script:
```bash
# Crear usuario en Puruchuco
python create-admin.py tenant_pq_puruchuco juan.perez@papasqueens.com password123 "Juan Pérez"

# Crear usuario en Villa María
python create-admin.py tenant_pq_villa_maria maria.garcia@papasqueens.com password456 "María García"

# Crear usuario en Jirón
python create-admin.py tenant_pq_jiron carlos.ruiz@papasqueens.com password789 "Carlos Ruiz"
```

### 2. Backend no reconoce el tenant_id
**Síntoma**: Error 400 o "Tenant no válido"

**Verificar en el backend**:
- ¿El backend valida que el tenant_id exista?
- ¿Hay una lista de tenants permitidos?
- ¿El backend está configurado para multi-tenant?

### 3. Usuarios tienen tenant_id hardcodeado
**Síntoma**: Login exitoso pero con tenant incorrecto

**Verificar en DynamoDB**:
```
Tabla: Staff
Buscar usuario por email
Verificar campo: tenant_id
```

Si el usuario tiene `tenant_id: "tenant_pq_barranco"` hardcodeado, el backend podría ignorar el tenant_id del request.

### 4. CORS o configuración de API Gateway
**Síntoma**: Error de red o CORS

**Verificar**:
- ¿El endpoint `/auth/staff/login` acepta el header `X-Tenant-Id`?
- ¿Hay configuración CORS que bloquee headers personalizados?

## 🧪 Pruebas Recomendadas

### Test 1: Verificar usuarios en DynamoDB
```bash
# Listar todos los usuarios staff
aws dynamodb scan --table-name Staff --filter-expression "attribute_exists(tenant_id)"
```

### Test 2: Probar con curl
```bash
# Login en Barranco (funciona)
curl -X POST https://gf3ib7ojeb.execute-api.us-east-1.amazonaws.com/dev/auth/staff/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: tenant_pq_barranco" \
  -d '{"username":"admin_staff","password":"password","tenant_id":"tenant_pq_barranco"}'

# Login en Puruchuco (no funciona?)
curl -X POST https://gf3ib7ojeb.execute-api.us-east-1.amazonaws.com/dev/auth/staff/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: tenant_pq_puruchuco" \
  -d '{"username":"admin_staff","password":"password","tenant_id":"tenant_pq_puruchuco"}'
```

### Test 3: Verificar respuesta del backend
Si curl funciona pero el frontend no, el problema está en el frontend.
Si curl tampoco funciona, el problema está en el backend.

## ✅ Soluciones

### Solución 1: Crear usuarios en todas las sedes
El problema más probable es que solo existan usuarios en Barranco.

```python
# create-admin.py
import boto3
import bcrypt
import uuid

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('Staff')

def create_staff(tenant_id, email, password, name, role='admin'):
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    item = {
        'tenant_id': tenant_id,
        'id_staff': f'staff-{uuid.uuid4().hex[:8]}',
        'email': email,
        'password': hashed.decode('utf-8'),
        'name': name,
        'role': role,
        'status': 'activo',
        'created_at': datetime.now().isoformat()
    }
    
    table.put_item(Item=item)
    print(f'✅ Usuario creado: {email} en {tenant_id}')

# Crear usuarios en todas las sedes
create_staff('tenant_pq_barranco', 'admin@barranco.com', 'password123', 'Admin Barranco')
create_staff('tenant_pq_puruchuco', 'admin@puruchuco.com', 'password123', 'Admin Puruchuco')
create_staff('tenant_pq_villa_maria', 'admin@villamaria.com', 'password123', 'Admin Villa María')
create_staff('tenant_pq_jiron', 'admin@jiron.com', 'password123', 'Admin Jirón')
```

### Solución 2: Verificar lógica de autenticación en backend
El backend debe buscar usuarios por `tenant_id` + `email`:

```python
# Lambda: auth/staff/login
def login(event):
    body = json.loads(event['body'])
    tenant_id = body.get('tenant_id')
    username = body.get('username')
    password = body.get('password')
    
    # Buscar usuario en DynamoDB
    response = table.query(
        KeyConditionExpression='tenant_id = :tid AND email = :email',
        ExpressionAttributeValues={
            ':tid': tenant_id,
            ':email': username
        }
    )
    
    if not response['Items']:
        return {'statusCode': 401, 'body': 'Usuario no encontrado'}
    
    # Verificar password...
```

### Solución 3: Usar el mismo usuario en todas las sedes
Si quieres que el mismo usuario pueda acceder a todas las sedes:

```python
# Crear el mismo usuario en todas las sedes
for tenant in ['tenant_pq_barranco', 'tenant_pq_puruchuco', 'tenant_pq_villa_maria', 'tenant_pq_jiron']:
    create_staff(tenant, 'admin@papasqueens.com', 'password123', 'Admin Global', 'admin')
```

## 📊 Indicadores Visuales Agregados

Ahora el formulario muestra:
- El tenant_id actual debajo del selector de sede
- Logs detallados en la consola del navegador
- Información de debug en cada paso del login

## 🎯 Próximo Paso

1. Abre la consola del navegador
2. Selecciona una sede diferente a Barranco
3. Intenta hacer login
4. Copia los logs de la consola y la respuesta del Network
5. Eso nos dirá exactamente dónde está el problema
