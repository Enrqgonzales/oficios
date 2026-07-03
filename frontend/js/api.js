/**
 * api.js - Capa de comunicación asíncrona entre el frontend y el backend PHP.
 * Orquesta peticiones fetch hacia datos.php y normaliza las respuestas JSON
 * para que main.js pueda mostrar alertas o redirecciones de forma uniforme.
 */

// ---------------------------------------------------------------------------
// BLOQUE 1: Resolución de la ruta al controlador PHP según la página actual
// ---------------------------------------------------------------------------

/**
 * Calcula la ruta relativa correcta hacia backend/api/datos.php.
 * Desde index.html usa "backend/..."; desde frontend/pages/ usa "../../backend/...".
 */
function obtenerRutaAPI() {
  const rutaActual = window.location.pathname;

  if (rutaActual.includes('/frontend/pages/')) {
    return '../../backend/api/datos.php';
  }

  return 'backend/api/datos.php';
}

// ---------------------------------------------------------------------------
// BLOQUE 2: Motor genérico de peticiones fetch
// ---------------------------------------------------------------------------

/**
 * Ejecuta una petición HTTP y devuelve el JSON parseado del servidor PHP.
 * Propaga respuestas 4xx/5xx si el cuerpo es JSON válido; lanza error si la red falla.
 */
async function realizarPeticion(urlCompleta, metodo, cuerpoDatos) {
  const opciones = {
    method: metodo,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  if (cuerpoDatos !== null && cuerpoDatos !== undefined) {
    opciones.body = JSON.stringify(cuerpoDatos);
  }

  let respuesta;
  try {
    respuesta = await fetch(urlCompleta, opciones);
  } catch (errorRed) {
    throw new Error('No se pudo conectar con el servidor. Verifique que Apache y MySQL estén activos.');
  }

  const texto = await respuesta.text();
  let datosJSON;

  try {
    datosJSON = JSON.parse(texto);
  } catch (errorParseo) {
    throw new Error('El servidor no devolvió JSON válido. Verifique Apache, PHP y la ruta del API.');
  }

  return datosJSON;
}

// ---------------------------------------------------------------------------
// BLOQUE 3: Servicio público ApiService (expuesto en window)
// ---------------------------------------------------------------------------

const ApiService = {

  /**
   * Petición POST genérica hacia una acción del backend.
   */
  async enviarPost(accion, datos) {
    const url = obtenerRutaAPI() + '?action=' + accion;
    return realizarPeticion(url, 'POST', datos);
  },

  /**
   * Petición GET genérica hacia una acción del backend con filtros opcionales.
   */
  async enviarGet(accion, filtros) {
    const parametros = new URLSearchParams();
    parametros.append('action', accion);

    if (filtros) {
      const claves = Object.keys(filtros);
      for (let i = 0; i < claves.length; i++) {
        const clave = claves[i];
        const valor = filtros[clave];
        if (valor && valor !== 'all') {
          parametros.append(clave, valor);
        }
      }
    }

    const url = obtenerRutaAPI() + '?' + parametros.toString();
    return realizarPeticion(url, 'GET', null);
  },

  /**
   * Inicia sesión con correo y contraseña.
   */
  async login(email, password) {
    const correoNormalizado = String(email || '').trim().toLowerCase();
    return this.enviarPost('login', { email: correoNormalizado, password: password });
  },

  /**
   * Cierra la sesión activa en el servidor.
   */
  async logout() {
    return this.enviarPost('logout', null);
  },

  /**
   * Registra un nuevo usuario (cliente o técnico) con datos de ubigeo.
   */
  async registrar(datosUsuario) {
    const datosNormalizados = Object.assign({}, datosUsuario, {
      email: String(datosUsuario.email || '').trim().toLowerCase()
    });
    return this.enviarPost('registro', datosNormalizados);
  },

  /**
   * Obtiene el listado de técnicos del catálogo con filtros opcionales.
   */
  async obtenerTecnicos(filtros) {
    return this.enviarGet('tecnicos', filtros || {});
  },

  /**
   * Obtiene el perfil de un único técnico por su id (para producto.html).
   */
  async obtenerTecnico(idTecnico) {
    return this.enviarGet('tecnico', { id: idTecnico });
  },

  /**
   * Obtiene los servicios publicados por un técnico específico.
   */
  async obtenerServicios(idTecnico) {
    return this.enviarGet('servicios', { id_tecnico: idTecnico });
  },

  /**
   * Obtiene las reseñas recibidas por un técnico específico.
   */
  async obtenerResenas(idTecnico) {
    return this.enviarGet('resenas', { id_tecnico: idTecnico });
  },

  /**
   * Publica una nueva reseña de un cliente hacia un técnico.
   */
  async crearResena(datosResena) {
    return this.enviarPost('crear_resena', datosResena);
  },

  /**
   * Obtiene las estadísticas generales (agregación avanzada) de la plataforma.
   */
  async obtenerEstadisticas() {
    return this.enviarGet('estadisticas', null);
  },

  /**
   * Publica o actualiza el perfil de técnico de un usuario (FormData con foto).
   */
  async ofrecerServicio(formData) {
    const url = obtenerRutaAPI() + '?action=ofrecer_servicio';

    let respuesta;
    try {
      respuesta = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
    } catch (errorRed) {
      throw new Error('No se pudo conectar con el servidor. Verifique que Apache y MySQL estén activos.');
    }

    const texto = await respuesta.text();
    let datosJSON;

    try {
      datosJSON = JSON.parse(texto);
    } catch (errorParseo) {
      throw new Error('El servidor no devolvió JSON válido. Verifique Apache, PHP y la ruta del API.');
    }

    return datosJSON;
  }
};

// ---------------------------------------------------------------------------
// BLOQUE 4: Helpers de UI accesibles para sincronizar respuestas del servidor
// ---------------------------------------------------------------------------

/**
 * Muestra un contenedor de alerta con mensaje e icono según el tipo.
 * El color lo aportan las clases CSS .alert-success / .alert-error (sin estilos en línea).
 * tipoAlerta: 'exito' para verde; cualquier otro valor se muestra como error.
 */
function mostrarAlertaContenedor(contenedor, mensaje, tipoAlerta) {
  if (!contenedor) {
    return;
  }

  const spanMensaje = contenedor.querySelector('span');
  const icono = contenedor.querySelector('i');

  contenedor.style.display = 'flex';
  contenedor.setAttribute('role', 'alert');
  contenedor.setAttribute('aria-live', 'polite');

  if (spanMensaje) {
    spanMensaje.textContent = mensaje;
  }

  if (tipoAlerta === 'exito') {
    contenedor.className = 'alert-success';
    if (icono) {
      icono.className = 'fa-solid fa-circle-check';
    }
  } else {
    contenedor.className = 'alert-error';
    if (icono) {
      icono.className = 'fa-solid fa-circle-exclamation';
    }
  }
}

/**
 * Oculta un contenedor de alerta previamente mostrado.
 */
function ocultarAlertaContenedor(contenedor) {
  if (contenedor) {
    contenedor.style.display = 'none';
  }
}

// ---------------------------------------------------------------------------
// BLOQUE 5: Exportar servicio y helpers al ámbito global window
// ---------------------------------------------------------------------------
window.ApiService = ApiService;
window.ApiUI = {
  mostrarAlerta: mostrarAlertaContenedor,
  ocultarAlerta: ocultarAlertaContenedor
};
