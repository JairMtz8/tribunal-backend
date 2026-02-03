# 🏛️ Tribunal Para Adolescentes - Backend API

Sistema de gestión jurídica para procesos de adolescentes. Backend desarrollado con Node.js, Express y MySQL.

## 📋 Requisitos

- Node.js >= 14.x
- MySQL >= 8.0
- npm o yarn

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd tribunal-backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
copy .env.example .env

# Editar .env con tus credenciales de MySQL
```

### 4. Crear la base de datos
```sql
-- Ejecutar el script SQL proporcionado en MySQL
CREATE DATABASE IF NOT EXISTS tribunal_para_adolescentes;
-- Ejecutar el resto del schema...
```

### 5. Iniciar el servidor
```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

## 📁 Estructura del Proyecto

```
tribunal-backend/
├── src/
│   ├── config/
│   │   ├── database.js       # Configuración de MySQL pool
│   │   └── constants.js      # Constantes del sistema
│   ├── controllers/          # Lógica de negocio
│   ├── middlewares/          # Middleware (auth, validación, errores)
│   ├── models/              # Interacción con base de datos
│   ├── routes/              # Definición de rutas
│   ├── utils/               # Utilidades (errores, respuestas)
│   └── app.js               # Configuración de Express
├── server.js                # Entry point
├── .env                     # Variables de entorno (NO SUBIR A GIT)
├── .env.example            # Plantilla de variables
└── package.json
```

## 🗄️ Modelo de Datos

### Conceptos Clave

- **Proceso**: Entidad central, un proceso por adolescente
- **Carpetas**: CJ, CJO, CEMCI, CEMS (compartidas entre adolescentes)
- **proceso_carpeta**: Tabla puente que relaciona procesos con carpetas

### Flujo de Carpetas

1. **CJ** (Carpeta Judicial) → Origen de todo
2. **CJO** (Juicio Oral) → Requiere CJ
3. **CEMCI** (Investigación) → Requiere CJ
4. **CEMS** (Ejecución) → Requiere CJ + CJO

## 🔌 API Endpoints

### Health Check
```
GET  /              # Información de la API
GET  /health        # Estado del servidor
```

### Autenticación (TODO)
```
POST /api/auth/login
POST /api/auth/register
```

### Catálogos (TODO)
```
GET  /api/catalogos/roles
GET  /api/catalogos/estados-procesales
GET  /api/catalogos/tipos-medidas
```

## 🛡️ Seguridad

- **Helmet**: Headers HTTP seguros
- **CORS**: Control de orígenes
- **JWT**: Autenticación con tokens
- **bcrypt**: Hashing de contraseñas
- **Prepared Statements**: Prevención de SQL injection

## 📝 Manejo de Errores

Todas las respuestas siguen un formato estándar:

### Éxito
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa",
  "timestamp": "2024-02-02T10:30:00.000Z"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "code": "ERROR_CODE"
  },
  "timestamp": "2024-02-02T10:30:00.000Z"
}
```

## 🧪 Testing (TODO)

```bash
npm test
```

## 📦 Scripts Disponibles

```bash
npm run dev      # Inicia servidor en modo desarrollo
npm start        # Inicia servidor en modo producción
npm test         # Ejecuta tests (TODO)
```

## 🔧 Configuración de Producción

1. Cambiar `NODE_ENV=production`
2. Usar JWT_SECRET seguro (hash largo y aleatorio)
3. Configurar CORS con dominios específicos
4. Configurar HTTPS
5. Implementar rate limiting
6. Configurar logs persistentes

## 👥 Autores

Jair Antonio Martinez Valladares

## 📞 Contacto

1. 7621175937
2. jairmtz762@gmail.com