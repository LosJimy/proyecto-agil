#  Estrategia de Testing 

## 1. Visión General

Se implementa una estrategia de testing de **3 niveles** para garantizar calidad, confiabilidad y mantenibilidad del sistema:

```
┌─────────────────────────────────────────────────────┐
│  TESTING STRATEGY - PROYECTO PAGIL                  │
├─────────────────────────────────────────────────────┤
│ UNIT TESTS (Cobertura >80%)                      │
│ INTEGRATION TESTS (API endpoints)                │
│ E2E TESTS (Flujos de usuario completos)         │
└─────────────────────────────────────────────────────┘
```

---

## 2. UNIT TESTS (Nivel 1)

### 2.1 Objetivo
- Validar comportamiento individual de cada método
- >80% cobertura de código en clases críticas
- Tests aislados

### 2.2 Servicios a Testear

#### **AuthService**
-  `login()` - casos exitosos
-  `login()` - credenciales inválidas
-  `login()` - JWT_SECRET no definido
-  `login()` - error de conexión con puclaro

#### **MallaService**
-  `obtenerMalla()` - obtención correcta
-  `obtenerMalla()` - no autorizado (401)
-  `obtenerMalla()` - no encontrado (404)
-  `obtenerMalla()` - error de conexión

#### **ProyeccionesService**
-  `crear()` - crear proyección exitosa
-  `crear()` - validación de datos
-  `obtener()` - por ID existente
-  `obtener()` - por ID no existente
-  `actualizar()` - actualización correcta
-  `actualizar()` - ID no existe
-  `eliminar()` - eliminación correcta
-  `eliminar()` - ID no existe

#### **AvanceService**
-  `obtenerAvance()` - datos válidos
-  `obtenerAvance()` - alumno no encontrado

### 2.3 Comando
```bash
npm run test
npm run test:cov  # con cobertura
npm run test:watch  # modo watch
```

---

## 3. INTEGRATION TESTS (Nivel 2)

### 3.1 Objetivo
- Testear endpoints API completos
- Verificar integración con base de datos
- Casos de error + casos de éxito
- Flujos transaccionales

### 3.2 Endpoints a Testear

#### **Auth Module**
- `POST /auth/login` - credenciales válidas (201)
- `POST /auth/login` - credenciales inválidas (401)
- `POST /auth/login` - datos faltantes (400)

#### **Malla Module**
- `GET /malla/malla` - obtener malla (200)
- `GET /malla/malla/disponibles` - cursos disponibles (200)
- `GET /malla/malla/optimizar` - optimización (200)
- Sin token → 401 Unauthorized

#### **Proyecciones Module**
- `POST /proyecciones` - crear (201)
- `GET /proyecciones` - listar (200)
- `GET /proyecciones/:id` - obtener por ID (200)
- `PUT /proyecciones/:id` - actualizar (200)
- `DELETE /proyecciones/:id` - eliminar (200)
- Datos inválidos → 400 Bad Request
- ID inexistente → 404 Not Found

#### **Avance Module**
- `GET /avance/avance` - obtener avance (200)

### 3.3 Comando
```bash
npm run test:e2e
```

---

## 4. E2E TESTS (Nivel 3)

### 4.1 Objetivo
- Simular flujos reales de usuarios
- Testear requisitos funcionales completos
- Prueba de carga mínima

### 4.2 Flujos a Testear

#### **Flujo 1: Autenticación → Proyección**
```
1. Login exitoso → token válido
2. Crear proyección con token
3. Obtener proyección creada
4. Actualizar proyección
5. Eliminar proyección
```

#### **Flujo 2: Consulta de Malla**
```
1. Login exitoso
2. Obtener malla del estudiante
3. Obtener ramos disponibles
4. Obtener optimización de malla
```

#### **Flujo 3: Validaciones de Seguridad**
```
1. Intento sin token → 401
2. Intento con token inválido → 401
3. Acceso a recurso no existente → 404
```

### 4.3 Comando
```bash
npm run test:e2e
```

---

## 5. Requisitos Previos

### Base de Datos
```bash
# Iniciar MongoDB
docker-compose -f docker-compose.dev.yml up -d

# Verificar que está corriendo
docker ps | grep mongodb
```

### Variables de Entorno
```bash
# .env.test (crear para tests)
JWT_SECRET=test-secret-key-12345
MONGO_URI=mongodb://localhost:27017/universidad_test
```

---

## 6. Ejecución de Tests

### Ejecutar Todo
```bash
npm run test                # unit tests
npm run test:cov           # unit tests + cobertura
npm run test:e2e           # integration + e2e tests
```

### Generar Reporte de Cobertura
```bash
npm run test:cov
# Ver reporte en: coverage/index.html
```

### Modo Desarrollo
```bash
npm run test:watch         # watch mode para unit tests
npm run test:debug         # debug mode
```

