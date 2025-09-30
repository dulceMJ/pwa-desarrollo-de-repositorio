# PWA Act

## Descripción

PWA Act es una Progressive Web App (PWA) para gestionar tareas, diseñada para funcionar online y offline. Permite crear, visualizar y administrar tareas con recordatorios y ubicación GPS, sincronizando datos entre almacenamiento local (IndexedDB) y remoto (MongoDB Atlas). Incluye notificaciones push/locales, vibración y una interfaz responsiva con renderizado del lado del cliente (CSR) y servidor (SSR).

**Implementación**:
- **Frontend**: React, con componentes para splash screen y home, usando hooks para estado y Workbox para Service Worker.
- **Backend**: Node.js con Express, conectado a MongoDB Atlas para CRUD y web-push para notificaciones.
- **PWA**: Soporte offline, instalación nativa, y manifest.json para personalización.
- **Características**: GPS para ubicación, vibración, sincronización automática, notificaciones con acciones.

## Instalación

1. Clonar repositorio:
   ```bash
   git clone https://github.com/dulceMJ/pwa-desarrollo-de-repositorio.git
 
 
2. Instalar dependencias:

    2.1 Frontend:

    ``` bash 
        cd frontpwa
        npm install
    ```

    2.2 Backend:
    ``` bash  
        cd backpwa
        npm install

3. Configurar variables de entorno:

    Crear .env en backpwa
    ``` bash   
        ATLAS_URI=tu_uri_de_mongodb_atlas
        VAPID_MAILTO=mailto:tu_correo@ejemplo.com
        VAPID_PUBLIC_KEY=tu_clave_publica_vapid
        VAPID_PRIVATE_KEY=tu_clave_privada_vapid

4. Construir y ejecutar:

    4.1 Frontend
    ``` bash
        cd frontpwa
        npm run build
    ```

    4.2 Backend:
    cd backpwa
     ``` bash
        node server.js

6. Acceder en http://localhost:5000.

7. Instalar PWA: En Chrome, usar ⋮ > Instalar o agregar a pantalla de inicio en móviles.

## Dependencias

### Frontend (directorio: `frontpwa`)

- **React:** Construcción de la interfaz dinámica.  
- **idb (IndexedDB):** Manejo de almacenamiento local.  
- **Workbox (Service Worker):** Soporte offline y cache de recursos.  
- **react-dom**  
- **react-scripts** (herramientas de desarrollo y build)  

### Backend (directorio: `backpwa`)

- **Express:** Framework para servidor y rutas API.  
- **Mongoose (MongoDB):** Conexión y operaciones con la base de datos.  
- **web-push:** Envío de notificaciones push.  
- **@babel/core, @babel/preset-env, @babel/preset-react:** Transpilación para SSR.  
- **dotenv:** Carga de variables de entorno desde `.env`.  
- **body-parser:** Parsing de cuerpos de solicitudes.  
- **cors:** Manejo de solicitudes cross-origin.  


Nota: Requiere Node.js 22 