# Oficios Perú

> SaaS intermediario de servicios técnicos de confianza en todo el Perú: conecta
> a clientes con electricistas, gasfiteros, carpinteros, pintores, cerrajeros y
> más, con perfiles verificados, reseñas reales y cobertura por distrito.

Proyecto académico del curso de Desarrollo Web construido sobre un stack
**estricto y sin frameworks de aplicación**: HTML5, CSS3 con metodología BEM,
JavaScript Vanilla, PHP 8 nativo y MySQL con PDO.

---

## 1. Arquitectura — MVC puro sin frameworks

La separación de responsabilidades sigue el patrón **Modelo - Vista - Controlador**
implementado a mano, sin librerías de routing ni ORM:

- **Vista (View)** → `index.html` + `frontend/` (HTML semántico, CSS BEM y JS Vanilla).
- **Controlador (Controller)** → `backend/api/datos.php` (despachador `?action=...`
  que enruta cada petición a su función handler con validaciones y respuesta JSON).
- **Modelo (Model)** → `backend/db/schema.sql` (definición relacional de tablas)
  y consultas SQL ejecutadas mediante prepared statements PDO desde el controlador.

### 1.1 Diagrama de la arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVEGADOR (Cliente)                    │
│  ┌─────────────────┐   ┌─────────────────┐                  │
│  │  HTML5 + BEM    │   │  Vanilla JS     │  fetch() JSON    │
│  │  (Vista)        │◄─►│  (api.js/dom.js)│ ───────────┐     │
│  └─────────────────┘   └─────────────────┘            │     │
└─────────────────────────────────────────────────────────┼───┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVIDOR APACHE  +  PHP 8 NATIVO               │
│                                                             │
│   ┌──────────────────────┐    ┌────────────────────────┐    │
│   │  datos.php           │    │  config.php            │    │
│   │  (Controlador)       │───►│  (Conexión PDO)        │    │
│   │  switch(?action=...) │    │  prepared statements   │    │
│   └──────────────────────┘    └────────────┬───────────┘    │
└────────────────────────────────────────────┼────────────────┘
                                             │
                                             ▼
                          ┌─────────────────────────────────┐
                          │   MySQL 8 — oficios_peru        │
                          │   usuarios, oficios, tecnicos,  │
                          │   servicios, resenas (Modelo)   │
                          └─────────────────────────────────┘
```

### 1.2 Estructura de carpetas

```
OficiosPer--main/
├── index.html              # Punto de entrada (landing pública)
├── README.md               # Este archivo
├── frontend/               # Capa de presentación (Vista)
│   ├── css/
│   │   ├── style.css       # Estilos globales y variables CSS (BEM)
│   │   ├── animations.css  # Keyframes y transiciones
│   │   └── responsive.css  # Media queries y grid responsivo
│   ├── js/
│   │   ├── main.js         # Inicialización y eventos globales
│   │   ├── dom.js          # Manipulación del DOM
│   │   ├── api.js          # Llamadas fetch al backend
│   │   └── ubigeo.js       # Ubigeo Perú (departamentos / provincias / distritos)
│   ├── assets/
│   │   ├── img/            # Imágenes del proyecto
│   │   ├── fonts/          # Fuentes locales (si no se usa CDN)
│   │   └── icons/          # Íconos SVG y sprite sheets
│   └── pages/
│       ├── catalogo.html   # Catálogo de técnicos con filtros
│       ├── login.html      # Inicio de sesión
│       └── registro.html   # Registro de cliente o técnico
├── backend/                # Capa de negocio (Controlador + Modelo)
│   ├── api/
│   │   ├── config.php      # Conexión PDO segura a MySQL
│   │   └── datos.php       # Controlador REST (?action=...)
│   └── db/
│       └── schema.sql      # Esquema + datos semilla
└── docs/                   # Documentación técnica, wireframes y diagramas
```

---

## 2. Stack técnico estricto

- **HTML5** semántico con roles ARIA para accesibilidad.
- **CSS3** con metodología **BEM** (`bloque__elemento--modificador`), variables
  CSS personalizadas y diseño responsivo móvil-first.
- **JavaScript Vanilla** (ES6+): sin React, sin Vue, sin jQuery.
- **PHP 8 nativo**: sin Laravel, sin Symfony, sin Composer.
- **MySQL 8** accedido exclusivamente a través de **PDO** con prepared
  statements (anti SQL Injection).
- Utilidades visuales vía **CDN** (no se instala nada localmente): **Bootstrap 5
  Grid** para la rejilla responsiva, **Tailwind CSS** para clases utilitarias
  puntuales y **Font Awesome 6.5** para los íconos.

> Aclaración honesta: la **lógica de la aplicación no usa frameworks** (no hay
> React/Vue/jQuery en el front ni Laravel/Symfony en el back). Bootstrap,
> Tailwind y Font Awesome se cargan solo por CDN como apoyo de estilos/íconos,
> de modo que se mantiene la restricción del curso de **cero Node.js, npm o
> bundlers**.

---

## 3. Funcionalidades implementadas

- Registro diferenciado para **clientes** y **técnicos especialistas**.
- Inicio de sesión con `password_hash` BCrypt y `password_verify`.
- Catálogo público de técnicos con filtros por **departamento**, **categoría**
  de oficio y **rating mínimo**.
- **Perfil dinámico del técnico** (`producto.html?id=N`): carga vía `fetch()` los
  datos del técnico, su tabla de servicios y sus reseñas reales desde el API.
- Detalle de servicios ofrecidos por cada técnico (precio base y duración).
- Sistema de **reseñas** (1 a 5 estrellas) con recálculo automático del
  promedio y total del técnico vía transacción SQL, publicable desde el perfil.
- Botón **Contactar** que abre WhatsApp (`wa.me`) con el celular del técnico.
- Publicación de oficio por el propio técnico con **subida de foto** (`ofrecer.html`).
- Selección dinámica de ubicación con dataset oficial de **Ubigeo Perú**.

---

## 4. Seguridad implementada

- **Prepared statements PDO** en todas las consultas (anti SQL Injection).
- Sanitización con `trim + strip_tags + htmlspecialchars` para neutralizar XSS.
- Hashing de contraseñas con `password_hash(..., PASSWORD_BCRYPT)`; el hash
  nunca se devuelve al cliente.
- Validación de formato de email (`FILTER_VALIDATE_EMAIL`) y de celular peruano
  (regex `/^9\d{8}$/`).
- Respuestas JSON con códigos HTTP coherentes: `200`, `201`, `400`, `401`,
  `404`, `405`, `409`, `500`.
- Flag `MODO_DESARROLLO` en `config.php` que oculta detalles técnicos del error
  cuando se despliega en producción.

---

## 5. Instrucciones de despliegue local (XAMPP + phpMyAdmin)

Pensado para que el profesor pueda levantar el proyecto en menos de 5 minutos.

### Paso 1 — Requisitos

- **XAMPP** (o WAMP / Laragon) con **Apache** y **MySQL** activos.
- **PHP 8.0** o superior.
- **MySQL 8.0** o superior.
- Navegador moderno (Chrome, Edge o Firefox actualizado).

### Paso 2 — Copiar el proyecto a `htdocs`

1. Descomprimir el ZIP del repositorio.
2. Copiar la carpeta resultante a la ruta de XAMPP:
   ```
   C:\xampp\htdocs\OficiosPeru\
   ```
   (En Linux/macOS sería `/opt/lampp/htdocs/OficiosPeru/`).

### Paso 3 — Encender Apache y MySQL

1. Abrir el panel de control de XAMPP.
2. Hacer clic en **Start** para **Apache**.
3. Hacer clic en **Start** para **MySQL**.

### Paso 4 — Crear e importar la base de datos en phpMyAdmin

1. Navegar a `http://localhost/phpmyadmin`.
2. En el menú lateral, clic en **Nueva** para crear una base.
3. Asignarle el nombre **`oficios_peru`** y el cotejamiento
   **`utf8mb4_unicode_ci`**, y pulsar **Crear**.
4. Con la base seleccionada, ir a la pestaña **Importar**.
5. Elegir el archivo:
   ```
   backend/db/schema.sql
   ```
6. Pulsar **Continuar**. El script crea las tablas e inserta automáticamente
   los datos semilla (8 usuarios, 8 oficios, 5 técnicos, 7 servicios, 5 reseñas).

### Paso 5 — Verificar credenciales de conexión

Abrir `backend/api/config.php` y confirmar que coincida con XAMPP por defecto:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'oficios_peru');
define('DB_USER', 'root');
define('DB_PASS', '');     // XAMPP usa contraseña vacía por defecto
define('DB_PORT', '3306');
```

### Paso 6 — Abrir la aplicación

Visitar en el navegador:

```
http://localhost/OficiosPeru/index.html
```

Y opcionalmente probar la API directamente:

```
http://localhost/OficiosPeru/backend/api/datos.php?action=tecnicos
```

---

## 6. Credenciales de prueba (todos comparten password: `12345678`)

- Técnico: `pedro.huaman@oficiosperu.pe`
- Técnico: `sofia.mendoza@oficiosperu.pe`
- Cliente: `eduardo@hostalesperu.com`
- Cliente: `vanessa.choy@correo.pe`

---

## 7. Endpoints del API REST (`backend/api/datos.php`)

Todos los endpoints viven en el mismo controlador y se discriminan por el
parámetro `?action=`. Las respuestas siempre son JSON.

- `POST datos.php?action=login` — autentica al usuario.
- `POST datos.php?action=registro` — crea una cuenta de cliente.
- `GET  datos.php?action=tecnicos&departamento=&categoria=&rating=` — catálogo
  filtrable de técnicos.
- `GET  datos.php?action=tecnico&id=N` — perfil de un único técnico (usado por
  `producto.html`).
- `GET  datos.php?action=servicios&id_tecnico=N` — servicios de un técnico.
- `GET  datos.php?action=resenas&id_tecnico=N` — reseñas del técnico.
- `POST datos.php?action=crear_resena` — registra una nueva opinión y recalcula
  el promedio del técnico.
- `POST datos.php?action=ofrecer_servicio` — publica/actualiza el perfil de
  técnico (acepta `multipart/form-data` con foto).

### 7.1 Flujo de datos (para la exposición)

Resumen en una frase para explicar la arquitectura en la presentación:

1. La **Vista** (HTML) dispara un evento (submit, click, carga de página).
2. **`main.js`** valida y llama a **`api.js`**, que hace `fetch()` al backend.
3. **`datos.php`** (Controlador) recibe `?action=...`, valida y sanitiza.
4. Ejecuta **PDO con prepared statements** sobre **MySQL** (Modelo).
5. Responde **JSON**; `main.js` pinta el resultado o muestra una alerta.

```
Vista (HTML) → main.js → api.js → fetch() → datos.php → PDO → MySQL → JSON → Vista
```

---

## 8. Documentación del proyecto (`docs/`)

Carpeta reservada para los entregables del curso. Hoy contiene el índice;
los recursos se irán agregando antes de la presentación final.

- [Índice de documentación](docs/README.md)
- Wireframes y bocetos: pendientes de agregar en `docs/`.
- Diagramas de flujo y base de datos: pendientes de agregar en `docs/`.
- Informe técnico (PDF): pendiente de agregar en `docs/`.

---

## 9. Autores

Proyecto académico — Curso de Desarrollo Web.
Lima, Perú — 2026.
