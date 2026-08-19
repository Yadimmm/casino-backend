# Casino Royale— Backend 🔐

Backend del laboratorio web de privacidad y ciberseguridad **Casino Zero Trust**, desarrollado como proyecto final de Desarrollo WEB Profesional en UTD.

## ¿Qué es?

Una API REST construida con Node.js y Express que demuestra cómo los sitios web capturan datos de los usuarios. Incluye motor de fingerprinting, sistema de consentimiento, geolocalización por IP, derechos ARCO y autenticación JWT.

## Tecnologías

- **Node.js** + **Express** — servidor y API REST
- **Prisma ORM** — acceso a base de datos con consultas parametrizadas
- **PostgreSQL** (Neon) — base de datos en la nube
- **JWT** + **bcrypt** — autenticación segura
- **Helmet** — cabeceras de seguridad HTTP
- **express-rate-limit** — límite de peticiones
- **geoip-lite** — geolocalización por IP (local, sin APIs externas)
- **WebSocket** — comunicación en tiempo real (Sala de Vigilancia)
- **cookie-parser** — manejo de cookies httpOnly

## Módulos principales

| Módulo | Descripción |
|---|---|
| Motor de huella | Reconocimiento de dispositivos por fingerprint SHA-256 |
| Consentimiento | Middleware que protege todas las rutas sensibles |
| Datos pasivos | Captura y almacenamiento de 11 señales del navegador |
| Expediente | Cruza datos capturados contra catálogo de riesgos |
| Permisos | Registro de permisos con métrica `ms_decision` |
| Geolocalización | Ciudad derivada desde IP sin pedir permiso |
| ARCO | Acceso, Rectificación, Cancelación y Oposición funcionales |
| Bitácora | Línea de tiempo de eventos por sesión |
| Autenticación | Registro y login con JWT + bcrypt |
| Sala de Vigilancia | Eventos en tiempo real vía WebSocket |

## Correr en local

**Requisitos:** Node.js 18+, cuenta en Neon (PostgreSQL)

```bash
# Clonar el repositorio
git clone https://github.com/Yadimmm/casino-backend.git
cd casino-backend

# Instalar dependencias
npm install

# Crear el archivo de variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Neon y JWT

# Ejecutar migraciones
npx prisma migrate deploy

# Iniciar el servidor
node --watch src/server.js
```

El servidor corre en `http://localhost:3000`.

## Despliegue

Backend desplegado en **Render** detrás de **Cloudflare**.

> ⚠️ El plan gratuito de Render duerme tras 15 minutos de inactividad. La primera petición puede tardar ~50 segundos en despertar el servicio.

## Seguridad

El sistema implementa defensa en profundidad con 8 capas:
Cloudflare WAF → Helmet → CORS restrictivo → Rate limiting → Middleware de consentimiento → Listas blancas → Prisma ORM (consultas parametrizadas) → JWT con bcrypt.

Se realizó un análisis de penetración (pentesting) desde Kali Linux con **11 vectores evaluados, 11 protegidos** y 1 hallazgo corregido durante las pruebas.
