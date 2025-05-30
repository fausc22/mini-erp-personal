# 🛠️ Scripts y Comandos de Desarrollo

Guía completa de comandos útiles para el desarrollo y mantenimiento del Mini ERP Personal.

## 📦 Gestión de Dependencias

### Instalación inicial
```bash
# Instalar todas las dependencias
npm install

# Instalar dependencias específicas que podrían faltar
npm install bcryptjs jsonwebtoken dayjs
npm install @types/bcryptjs @types/jsonwebtoken --save-dev

# Limpiar e instalar desde cero
rm -rf node_modules package-lock.json
npm install
```

### Actualizar dependencias
```bash
# Ver dependencias desactualizadas
npm outdated

# Actualizar dependencias menores
npm update

# Actualizar Next.js a la última versión
npm install next@latest

# Actualizar Ant Design
npm install antd@latest
```

## 🗄️ Comandos de Base de Datos

### Prisma - Gestión del Schema
```bash
# Generar cliente de Prisma después de cambios en schema
npx prisma generate

# Aplicar cambios del schema a la base de datos
npx prisma db push

# Crear una nueva migración
npx prisma migrate dev --name agregar-campo-usuario

# Aplicar migraciones en producción
npx prisma migrate deploy

# Resetear base de datos (CUIDADO: borra todos los datos)
npx prisma migrate reset

# Ver el estado de las migraciones
npx prisma migrate status

# Abrir Prisma Studio para ver/editar datos
npx prisma studio
```

### Respaldo y Restauración
```bash
# Crear respaldo de la base de datos (PostgreSQL)
pg_dump -U usuario -h localhost -p 5432 mini_erp_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar desde respaldo
psql -U usuario -h localhost -p 5432 -d mini_erp_db < backup_20240101_120000.sql

# Respaldo solo del schema
pg_dump -U usuario -h localhost -p 5432 --schema-only mini_erp_db > schema_backup.sql
```

## 🚀 Comandos de Desarrollo

### Servidor de desarrollo
```bash
# Iniciar en modo desarrollo
npm run dev

# Iniciar en modo desarrollo con puerto específico
npm run dev -- -p 3001

# Iniciar con debugging habilitado
NODE_OPTIONS='--inspect' npm run dev
```

### Build y producción
```bash
# Crear build de producción
npm run build

# Iniciar servidor de producción
npm run start

# Analizar el bundle size
npm run build -- --analyze

# Build estático para exportación
npm run build && npm run export
```

### Linting y formato
```bash
# Ejecutar ESLint
npm run lint

# Arreglar problemas de linting automáticamente
npm run lint -- --fix

# Verificar tipos de TypeScript
npx tsc --noEmit

# Formatear código con Prettier (si está configurado)
npx prettier --write .
```

## 🔧 Scripts de Mantenimiento

### Limpieza de archivos temporales
```bash
# Limpiar archivos de build
rm -rf .next out dist

# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json && npm install

# Limpiar cache de Next.js
rm -rf .next/cache

# Limpiar logs
rm -rf logs/*.log
```

### Verificación del sistema
```bash
# Verificar versiones de dependencias clave
node --version
npm --version
npx prisma --version

# Verificar conexión a base de datos
npx prisma db pull

# Verificar configuración de TypeScript
npx tsc --showConfig

# Verificar configuración de Next.js
npx next info
```

## 📊 Monitoreo y Debugging

### Logs de desarrollo
```bash
# Ver logs de la aplicación en tiempo real
tail -f logs/app.log

# Ver logs de errores
tail -f logs/error.log

# Ver logs con filtro
grep "ERROR" logs/app.log

# Limpiar logs antiguos
find logs/ -name "*.log" -mtime +30 -delete
```

### Performance y análisis
```bash
# Analizar bundle size
npm run build -- --analyze

# Generar reporte de dependencias
npm ls --depth=0

# Verificar vulnerabilidades de seguridad
npm audit

# Arreglar vulnerabilidades automáticamente
npm audit fix
```

## 🐳 Docker (Opcional)

### Comandos básicos de Docker
```bash
# Construir imagen
docker build -t mini-erp-personal .

# Ejecutar contenedor
docker run -p 3000:3000 mini-erp-personal

# Ejecutar con variables de entorno
docker run -p 3000:3000 --env-file .env.local mini-erp-personal

# Ver contenedores activos
docker ps

# Detener contenedor
docker stop <container-id>
```

### Docker Compose
```bash
# Levantar servicios (app + db)
docker-compose up -d

# Ver logs de todos los servicios
docker-compose logs -f

# Detener servicios
docker-compose down

# Reconstruir servicios
docker-compose up --build
```

## 🚀 Deploy en Railway

### Preparación para deploy
```bash
# Verificar que el build funciona
npm run build

# Verificar variables de entorno
cat .env.example

# Crear commit para deploy
git add .
git commit -m "Deploy: descripción de cambios"
git push origin main
```

### Variables de entorno para Railway
```bash
# Configurar en Railway Dashboard:
DATABASE_URL=postgresql://...  # Se configura automáticamente
JWT_SECRET=tu-clave-secreta-muy-segura
NEXTAUTH_SECRET=otra-clave-secreta
NODE_ENV=production
```

### Comandos de Railway CLI (opcional)
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login en Railway
railway login

# Vincular proyecto local
railway link

# Deploy manual
railway up

# Ver logs
railway logs

# Abrir en navegador
railway open
```

## 🧪 Testing (Para implementar)

### Configuración de tests
```bash
# Instalar Jest y testing utilities
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm test -- --watch

# Ejecutar tests con cobertura
npm test -- --coverage
```

## 📱 PWA - Comandos específicos

### Generación de iconos
```bash
# Usar herramienta online o instalar pwa-asset-generator
npm install -g pwa-asset-generator

# Generar iconos desde una imagen base
pwa-asset-generator logo.png public/icons --index public/manifest.json
```

### Verificación PWA
```bash
# Instalar lighthouse CLI
npm install -g lighthouse

# Auditar PWA
lighthouse http://localhost:3000 --view

# Verificar service worker
curl http://localhost:3000/sw.js
```

## 📋 Checklist de Deploy

```bash
# 1. Verificar build local
npm run build

# 2. Verificar migraciones de DB
npx prisma migrate status

# 3. Verificar variables de entorno
echo $DATABASE_URL

# 4. Ejecutar tests (si están configurados)
npm test

# 5. Verificar linting
npm run lint

# 6. Crear commit y push
git add .
git commit -m "Release v1.0.0"
git push origin main

# 7. Verificar deploy en Railway
# (automático después del push)

# 8. Verificar funcionamiento en producción
curl https://tu-app.railway.app/api/health
```

## 🔄 Automatización con Scripts NPM

Agregar a `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:reset": "prisma migrate reset",
    "clean": "rm -rf .next out node_modules",
    "fresh-install": "npm run clean && npm install",
    "type-check": "tsc --noEmit",
    "analyze": "ANALYZE=true npm run build",
    "backup-db": "pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql"
  }
}
```

## 🆘 Solución de Problemas Comunes

### Error de conexión a base de datos
```bash
# Verificar conectividad
pg_isready -h localhost -p 5432

# Verificar configuración
echo $DATABASE_URL

# Regenerar cliente Prisma
npx prisma generate
```

### Error de build
```bash
# Limpiar cache
rm -rf .next
npm run build

# Verificar TypeScript
npx tsc --noEmit
```

### Error de dependencias
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Verificar versiones
npm ls
```

### Error de permisos en Linux/Mac
```bash
# Arreglar permisos de npm
sudo chown -R $(whoami) ~/.npm

# Usar npx en lugar de global installs
npx prisma studio
```

## 📝 Logs útiles para debugging

```bash
# Crear directorio de logs
mkdir -p logs

# Log de la aplicación
console.log('[INFO]', message) >> logs/app.log

# Log de errores
console.error('[ERROR]', error) >> logs/error.log

# Log de base de datos
echo "[DB] $(date): $query" >> logs/db.log
```

---

**Tip**: Guarda estos comandos en un archivo `scripts.sh` para acceso rápido:

```bash
#!/bin/bash
# Funciones útiles para desarrollo

function dev_setup() {
    npm install
    npx prisma generate
    npx prisma db push
}

function clean_build() {
    rm -rf .next node_modules
    npm install
    npm run build
}

function backup_db() {
    pg_dump $DATABASE_URL > "backup_$(date +%Y%m%d_%H%M%S).sql"
    echo "Backup creado exitosamente"
}

# Uso: source scripts.sh && dev_setup
```