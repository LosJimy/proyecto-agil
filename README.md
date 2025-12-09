# Sistema de Proyección Académica - UCN

## 🚀 Características
- Visualización de avance curricular
- Proyección optimizada automática
- Creación y edición de proyecciones personalizadas
- Alertas de restricciones académicas
- Detección de ramos en situación crítica

## 🛠️ Tecnologías
- **Backend:** NestJS + TypeScript
- **Frontend:** Next.js + React + Tailwind CSS
- **Base de Datos:** MongoDB
- **Autenticación:** JWT + Passport
- **Containerización:** Docker

## 📦 Instalación

### Prerequisitos
- Node.js 20+
- Docker & Docker Compose
- MongoDB Compass (opcional)

### Desarrollo
```bash
# Clonar repositorio
git clone [tu-repo]

# Instalar dependencias
cd backend && npm install
cd ../frontend && npm install

# Levantar servicios
docker-compose -f docker-compose.dev.yml up
```

### Producción
```bash
docker-compose up --build
```

## 🧪 Testing
```bash
# Backend
cd backend
npm test                    # Ejecutar tests
npm test -- --coverage      # Ver cobertura
npm test -- --watch         # Modo watch

# Frontend
cd frontend
npm test
```

## 📊 Arquitectura
[Incluir diagrama de arquitectura]

## 👥 Equipo
- **Scrum Master:** Valentina Lopez
- **Desarrolladores:** Benjamin Erazo, Clerians Márquez

