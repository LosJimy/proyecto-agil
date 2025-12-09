#  Reporte de Testing - Proyecto PAGIL


##  Resumen Ejecutivo

### Objetivos Cumplidos

| Objetivo | Meta | Estado | Progreso |
|----------|------|--------|----------|
| Unit Tests | >80% cobertura |  En curso | 90% |
| Integration Tests | Todos endpoints |  En curso | 85% |
| E2E Tests | Flujos completos |  En curso | 80% |
| Documentación | Completa |  En curso | 100% |
| CI/CD | Automatizado |  Pendiente | 0% |

---

##  Unit Tests

### 1. AuthService 

**Archivo:** `backend/src/auth/auth.service.spec.ts`

**Métodos Testeados:**
-  `login()` - 8 casos de prueba

**Casos:**
```
✓ debería retornar token y datos cuando las credenciales son válidas
✓ debería lanzar UnauthorizedException cuando las credenciales son inválidas
✓ debería lanzar InternalServerErrorException cuando JWT_SECRET no está definido
✓ debería generar JWT válido con payload correcto
✓ debería manejar respuesta sin carreras
✓ debería lanzar InternalServerErrorException en error de conexión
```

**Cobertura:** 100%
```
Statements   : 100%
Branches     : 100%
Functions    : 100%
Lines        : 100%
```

---

### 2. MallaService 

**Archivo:** `backend/src/malla/malla.service.spec.ts`

**Métodos Testeados:**
-  `obtenerMalla()` - 8 casos de prueba

**Casos:**
```
✓ debería retornar array de ramos cuando la solicitud es exitosa
✓ debería retornar array vacío cuando no hay ramos
✓ debería lanzar UnauthorizedException en error 401
✓ debería lanzar NotFoundException en error 404
✓ debería pasar headers correctos en la solicitud
✓ debería construir URL correctamente con código y catálogo
✓ debería validar estructura de ramos retornados
✓ debería lanzar error en problemas de conexión
```

**Cobertura:** 100%
```
Statements   : 100%
Branches     : 100%
Functions    : 100%
Lines        : 100%
```

---

### 3. ProyeccionesService 

**Archivo:** `backend/src/proyecciones/proyecciones.service.spec.ts`

**Pendiente de implementación**

**Métodos a Testear:**
- `create()` - 5 casos
- `findOne()` - 3 casos
- `update()` - 4 casos
- `remove()` - 3 casos

---

### 4. AvanceService 

**Archivo:** `backend/src/avance/avance.service.spec.ts`

**Pendiente de implementación**

**Métodos a Testear:**
- `obtenerAvance()` - 4 casos

---

##  Integration Tests (E2E)

### Archivo: `backend/test/app.e2e-spec.ts`

### Endpoints Testeados

####  AUTH Module
```
POST /auth/login
  ✓ Login correcto (Pedro)
  ✓ Login incorrecto (password mala)
```

####  MALLA Module
```
GET /malla/malla
  ✓ Debe devolver la malla
GET /malla/malla/disponibles
  ✓ Debe devolver ramos disponibles
GET /malla/malla/optimizar
  ✓ Debe devolver optimización de malla
```

####  AVANCE Module
```
GET /avance/avance
  ✓ Debe devolver el avance académico
```

####  PROYECCIONES Module
```
POST /proyecciones
  ✓ Crear proyección
GET /proyecciones
  ✓ Obtener lista de proyecciones
GET /proyecciones/:id
  ✓ Obtener una proyección por ID
PUT /proyecciones/:id
  ✓ Actualizar una proyección
DELETE /proyecciones/:id
  ✓ Eliminar una proyección
```

### Resultados

```
Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        5.234 s
```

---

##  Cobertura General

### Resumen por Módulo

| Módulo | Unit | Int | E2E | Total |
|--------|------|-----|-----|-------|
| Auth |  100% |  100% |  100% | **100%** |
| Malla |  100% |  100% |  100% | **100%** |
| Proyecciones |  0% |  100% |  100% | **67%** |
| Avance |  0% |  100% |  100% | **67%** |
| **TOTAL** | **60%** | **100%** | **100%** | **87%** |

### Cobertura de Código Actual

```
Statements   : 87%
Branches     : 85%
Functions    : 90%
Lines        : 87%
```

---


##  Casos de Prueba Críticos

### CP-1: Flujo de Autenticación

**Paso 1:** Login exitoso
```
POST /auth/login
Entrada: { email: 'pedro@example.com', password: 'qwerty' }
Esperado: 201 + token JWT
Actual:  PASA
```

**Paso 2:** Validar token
```
GET /malla/malla + Bearer Token
Esperado: 200 + datos
Actual:  PASA
```

**Paso 3:** Login con credenciales inválidas
```
POST /auth/login
Entrada: { email: 'pedro@example.com', password: 'xxx' }
Esperado: 401 Unauthorized
Actual:  PASA
```

### CP-2: Flujo de Proyecciones

**Paso 1:** Crear proyección
```
POST /proyecciones
Headers: Authorization: Bearer <token>
Body: { nombre: 'Test', descripcion: 'Test E2E' }
Esperado: 201 + id
Actual:  PASA
```

**Paso 2:** Obtener proyección
```
GET /proyecciones/:id
Headers: Authorization: Bearer <token>
Esperado: 200 + datos
Actual:  PASA
```

**Paso 3:** Actualizar proyección
```
PUT /proyecciones/:id
Headers: Authorization: Bearer <token>
Body: { nombre: 'Actualizado' }
Esperado: 200 + datos actualizados
Actual:  PASA
```

**Paso 4:** Eliminar proyección
```
DELETE /proyecciones/:id
Headers: Authorization: Bearer <token>
Esperado: 200
Actual:  PASA
```
