# Guía de Despliegue en Vercel - TicoHabitat 🚀

Este documento detalla los pasos exactos para configurar y desplegar **TicoHabitat** en la plataforma **Vercel** de forma segura, estable y lista para usuarios reales.

---

## 💾 1. Migración de Base de Datos (Indispensable)

Debido a que Vercel es una infraestructura **serverless y efímera**, el archivo local de SQLite (`dev.db`) se restablece a su estado inicial constantemente. Para persistir los datos de forma robusta, debes migrar a un proveedor de base de datos en la nube (como **Supabase** o **Neon PostgreSQL**, ambos con capas gratuitas de $0).

### Pasos para migrar a PostgreSQL:

1.  **Cambiar el proveedor en Prisma:**
    Edita tu archivo [`prisma/schema.prisma`](file:///c:/Users/Cristian/Documents/GitHub/ticohabitat/prisma/schema.prisma) para que use `postgresql`:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
2.  **Obtener tu Connection String:**
    *   **Supabase:** Crea un proyecto, ve a *Settings > Database > Connection String* y copia la URL de tipo `URI` (ej. `postgresql://postgres:contraseña@db.supabase.co:5432/postgres`).
    *   **Neon:** Crea un proyecto en Neon.tech y copia la URL de conexión directa.
3.  **Configurar Variables de Entorno en Vercel:**
    Crea la variable de entorno `DATABASE_URL` con tu connection string (ver sección 2).
4.  **Ejecutar Migración Inicial:**
    En tu máquina local, una vez que configures la variable `DATABASE_URL` en tu archivo `.env` apuntando a tu nueva base de datos externa, ejecuta el comando para crear las tablas y sembrar al administrador principal:
    ```bash
    npx prisma migrate dev --name init_production
    ```
    *Esto creará la estructura en la nube y automáticamente sembrará al administrador principal `lleguele.grecia@gmail.com`.*

---

## 🔑 2. Variables de Entorno en Vercel

Configura las siguientes variables de entorno en la sección *Settings > Environment Variables* de tu proyecto en Vercel:

| Variable | Tipo | Descripción | Ejemplo de Valor |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Obligatoria** | URL de conexión de tu base de datos externa (PostgreSQL). | `postgresql://postgres:pass@aws-0-sa-east-1.pooler.supabase.co:6543/postgres?pgbouncer=true` |
| `NODE_ENV` | *Automática* | Configurada automáticamente por Vercel para ocultar herramientas de depuración. | `production` |

---

## ⚙️ 3. Configuración del Proyecto en Vercel

Configura las siguientes opciones en la consola de Vercel durante el proceso de importación:

*   **Framework Preset:** `Next.js`
*   **Build Command (Comando de Compilación):**
    Dado que Prisma requiere generar el cliente antes de compilar Next.js, debes configurar este comando personalizado en Vercel:
    ```bash
    npx prisma generate && npx prisma migrate deploy && next build
    ```
    *Nota: Si prefieres realizar las migraciones desde tu consola local, puedes simplificar el comando a: `npx prisma generate && next build`.*
*   **Root Directory:** `./`

---

## 🖼️ 4. Análisis de Almacenamiento de Imágenes

### ¿Cómo se manejan las imágenes actualmente?
Todas las imágenes de TicoHabitat se manejan de la siguiente manera:
1.  **Reducción Client-Side:** Las fotos cargadas por los usuarios (anuncios, comprobantes SINPE y logos de agencias) son procesadas en el navegador mediante un elemento `<canvas>`, optimizándolas a una resolución máxima de 900x900px con calidad JPG al 75%.
2.  **Almacenamiento Base64:** Se convierten en cadenas de texto **Base64** y se almacenan directamente en la base de datos (columnas `receiptUrl`, `url` de imágenes y `agencyLogo`).
3.  **Persistencia en Vercel:** **SÍ FUNCIONA.** Al estar integradas en el texto de la base de datos, las imágenes persistirán de forma ilimitada siempre y cuando la base de datos sea externa (Supabase/Neon). No se pierden al reciclarse el servidor de Vercel.

### Recomendación de Escalabilidad a Mediano Plazo:
Aunque el sistema de Base64 es idóneo para iniciar con $0 de costo en servidores y almacenamiento externo, si la plataforma escala a miles de propiedades, el peso de la base de datos crecerá rápidamente. 
En una etapa madura, se aconseja migrar a **Vercel Blob** (el almacenamiento de objetos nativo de Vercel) o un bucket de **AWS S3** para subir archivos binarios reales y guardar solo las URLs de texto en la base de datos.

---

## 🚀 5. Primer Despliegue en 3 Pasos

1.  **Conecta tu repositorio:** Vincula tu repositorio de GitHub a tu cuenta de Vercel.
2.  **Sube tus Variables de Entorno:** Pega tu `DATABASE_URL` de Supabase o Neon.
3.  **Haz clic en "Deploy":** Vercel compilará y publicará tu sitio en menos de 2 minutos.

*¡Tu portal TicoHabitat estará en línea y listo para recibir clientes reales!*
