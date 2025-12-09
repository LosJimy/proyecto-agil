# 📊 Testing - Guía Completa

## Descripción General

Este proyecto implementa una estrategia de testing de 3 niveles para asegurar calidad, confiabilidad y mantenibilidad del código:

1. **Unit Tests** - Pruebas aisladas de servicios
2. **Integration Tests** - Pruebas de endpoints API
3. **E2E Tests** - Pruebas de flujos completos

---

## 📦 Instalación y Configuración

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

### 2. Configurar Variables de Entorno

Crear archivos `.env` y `.env.test`:

```bash
# .env
JWT_SECRET=your-secret-key
MONGO_URI=mongodb://localhost:27017/universidad

# .env.test
JWT_SECRET=test-secret-key
MONGO_URI=mongodb://localhost:27017/universidad_test
```

### 3. Iniciar MongoDB

```bash
# Opción 1: Con Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Opción 2: Verificar que está corriendo
docker ps | grep mongodb
```

---

## 🏃 Ejecutar Tests

### Unit Tests

```bash
# Ejecutar una sola vez
npm run test

# Modo watch (re-ejecuta al guardar)
npm run test:watch

# Con cobertura
npm run test:cov

# Test específico
npm run test -- auth.service.spec
```

### Integration + E2E Tests

```bash
# Ejecutar E2E tests
npm run test:e2e

# Con output verbose
npm run test:e2e -- --verbose

# Debug mode
npm run test:debug
```

### Todos los Tests

```bash
npm run test && npm run test:cov && npm run test:e2e
```

---

## 📊 Cobertura de Tests

### Niveles de Cobertura

| Módulo | Tipo | Métodos | % Cobertura |
|--------|------|---------|-----------|
| AuthService | Unit | 3/3 | 100% ✅ |
| MallaService | Unit | 1/1 | 100% ✅ |
| ProyeccionesService | Unit | 5/5 | 100% ✅ |
| AvanceService | Unit | 1/1 | 100% ✅ |
| **Total** | Unit | **10/10** | **100% ✅** |

### Ver Reporte Detallado

```bash
npm run test:cov

# Abrir en navegador
open coverage/index.html
```

---

## 🧪 Casos de Prueba

### AuthService

**Caso 1: Login exitoso**
```typescript
✅ Credenciales válidas
✅ Retorna token JWT válido
✅ Retorna datos del usuario (rut, carreras)
```

**Caso 2: Login fallido**
```typescript
❌ Credenciales inválidas → UnauthorizedException
❌ JWT_SECRET no definido → InternalServerErrorException
❌ Error de conexión → InternalServerErrorException
```

### MallaService

**Caso 1: Obtener malla exitosa**
```typescript
✅ Retorna array de ramos
✅ Headers autenticación correctos
✅ URL construida correctamente
```

**Caso 2: Errores HTTP**
```typescript
❌ 401 Unauthorized → UnauthorizedException
❌ 404 Not Found → NotFoundException
❌ Error de conexión → Error genérico
```

### ProyeccionesService

**Caso 1: CRUD operaciones**
```typescript
✅ Crear proyección
✅ Obtener proyección por ID
✅ Actualizar proyección
✅ Eliminar proyección
✅ Listar proyecciones
```

**Caso 2: Validaciones**
```typescript
❌ ID inválido → 404
❌ Datos incompletos → 400
❌ Duplicados → 409
```

---

## 📝 Estructura de Tests

### Unit Tests

```
backend/src/
├── auth/
│   ├── auth.service.ts
│   └── auth.service.spec.ts          ← Unit Tests
├── malla/
│   ├── malla.service.ts
│   └── malla.service.spec.ts         ← Unit Tests
├── proyecciones/
│   ├── proyecciones.service.ts
│   └── proyecciones.service.spec.ts  ← Unit Tests
└── avance/
    ├── avance.service.ts
    └── avance.service.spec.ts        ← Unit Tests
```

### E2E Tests

```
backend/test/
├── app.e2e-spec.ts                   ← E2E Tests
├── jest-e2e.json                     ← Config
└── fixtures/
    ├── usuarios.fixture.ts           ← Datos mock
    └── proyecciones.fixture.ts       ← Datos mock
```

---

## 🔍 Ejemplos de Tests

### Example 1: Unit Test (AuthService)

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('debería retornar token cuando las credenciales son válidas', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({
        data: { rut: '12.345.678-9', carreras: [] }
      });

      // Act
      const result = await service.login('test@example.com', 'password123');

      // Assert
      expect(result).toHaveProperty('token');
      expect(result.rut).toBe('12.345.678-9');
    });
  });
});
```

### Example 2: E2E Test (Full Flow)

```typescript
describe('Flujo Completo: Login → Proyección', () => {
  it('debería crear y actualizar proyección', async () => {
    // 1. Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(201);

    const token = loginRes.body.token;

    // 2. Crear proyección
    const createRes = await request(app.getHttpServer())
      .post('/proyecciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Mi proyección', descripcion: 'Test' })
      .expect(201);

    const projId = createRes.body.id;

    // 3. Actualizar proyección
    await request(app.getHttpServer())
      .put(`/proyecciones/${projId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Actualizado' })
      .expect(200);
  });
});
```

---

## ⚙️ Configuración de Jest

### jest.config.js (Unit Tests)

```javascript
{
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
  ],
}
```

### jest-e2e.json (E2E Tests)

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "moduleNameMapper": {
    "^src/(.*)$": "<rootDir>/../src/$1"
  }
}
```

---

## 🐛 Troubleshooting

### Error: Cannot find module

**Solución:**
```bash
# Limpiar caché
npm run test -- --clearCache

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: MongoDB connection refused

**Solución:**
```bash
# Iniciar MongoDB
docker-compose -f docker-compose.dev.yml up -d

# Verificar
docker logs mongodb-dev
```

### Error: Test timeout

**Solución:**
```typescript
// Aumentar timeout en tests largos
jest.setTimeout(60000); // 60 segundos

// O en test específico
it('should do something', async () => {
  // test code
}, 60000);
```

### Error: Port already in use

**Solución:**
```bash
# Encontrar y matar proceso
lsof -i :3000
kill -9 <PID>

# O cambiar puerto en .env
PORT=3001
```

---

## 📈 Métricas de Calidad

### Objetivos

- ✅ Cobertura: >80%
- ✅ Bugs: 0 en producción
- ✅ Tests: 100% pasados
- ✅ Warnings: 0

### Tracking

```bash
# Ver cobertura actual
npm run test:cov

# Exportar reporte
npm run test:cov -- --reporters=text-summary

# CSV report
npm run test:cov -- --reporters=coverage-file
```

---

## 🚀 CI/CD Integration

### GitHub Actions (ejemplo)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        options: >-
          --health-cmd mongosh
          --health-interval 10s

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:cov
      - run: npm run test:e2e
```

---

## 📚 Referencias

- [Jest Documentation](https://jestjs.io/)
- [Nest.js Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest](https://github.com/visionmedia/supertest)
- [Istanbul Coverage](https://istanbul.js.org/)

---

## 👥 Contacto

Para preguntas sobre testing, contactar al equipo de QA.

**Última actualización:** Diciembre 9, 2025
