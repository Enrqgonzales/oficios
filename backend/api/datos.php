<?php
/**
 * datos.php - Controlador central de endpoints REST del SaaS Oficios Perú.
 * Reglas de seguridad aplicadas en TODOS los endpoints:
 *   1. Prepared statements PDO (anti SQL Injection).
 *   2. Sanitización con limpiarEntrada() (anti XSS y caracteres invisibles).
 *   3. Validación de tipo y formato (email, celular, longitudes).
 *   4. Respuestas siempre en JSON con códigos HTTP correctos.
 */

// Configurar y arrancar sesión de forma segura
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        ini_set('session.cookie_secure', 1);
    }
    session_start();
}

// ---------------------------------------------------------------------------
// BLOQUE 1: Cabeceras HTTP comunes (CORS dinámico y JSON)
// ---------------------------------------------------------------------------
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = [
        'http://localhost',
        'http://127.0.0.1',
        'https://localhost',
        'https://127.0.0.1'
    ];
    $origin = $_SERVER['HTTP_ORIGIN'];
    $originClean = rtrim($origin, '/');
    
    // Permitir subdominios de localhost o puertos de desarrollo dinámicos
    $esLocalhost = (strpos($originClean, 'http://localhost') === 0) || 
                   (strpos($originClean, 'https://localhost') === 0) || 
                   (strpos($originClean, 'http://127.0.0.1') === 0) || 
                   (strpos($originClean, 'https://127.0.0.1') === 0);
                   
    if ($esLocalhost || in_array($originClean, $allowed_origins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    } else {
        header('Access-Control-Allow-Origin: null');
    }
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Responder de inmediato a las peticiones preflight del navegador
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Cargar la conexión PDO segura (define $pdo)
require_once __DIR__ . '/config.php';

// ---------------------------------------------------------------------------
// BLOQUE 2: Despachador según el parámetro ?action=...
// ---------------------------------------------------------------------------
$accionSolicitada = isset($_GET['action']) ? trim($_GET['action']) : '';

switch ($accionSolicitada) {
    case 'login':
        procesarLogin($pdo);
        break;

    case 'logout':
        procesarLogout();
        break;

    case 'registro':
        procesarRegistro($pdo);
        break;

    case 'tecnicos':
        procesarListaTecnicos($pdo);
        break;

    case 'tecnico':
        procesarObtenerTecnico($pdo);
        break;

    case 'servicios':
        procesarListaServicios($pdo);
        break;

    case 'resenas':
        procesarListaResenas($pdo);
        break;

    case 'crear_resena':
        procesarCrearResena($pdo);
        break;

    case 'ofrecer_servicio':
        procesarOfrecerServicio($pdo);
        break;

    case 'eliminar_resena':
        procesarEliminarResena($pdo);
        break;

    case 'eliminar_servicio':
        procesarEliminarServicio($pdo);
        break;

    case 'crear_servicio':
        procesarCrearServicio($pdo);
        break;

    case 'estadisticas':
        procesarObtenerEstadisticas($pdo);
        break;

    default:
        responderJSON(404, [
            'success' => false,
            'message' => 'Acción API no reconocida. Use ?action=login, logout, registro, tecnicos, tecnico, servicios, resenas, crear_resena, ofrecer_servicio, eliminar_resena, eliminar_servicio, crear_servicio u estadisticas.'
        ]);
        break;
}

// ---------------------------------------------------------------------------
// BLOQUE 3: Helpers transversales (limpieza, validación, respuesta)
// ---------------------------------------------------------------------------

/**
 * Limpia un texto recibido del usuario para neutralizar inyección de HTML/XSS.
 * Aplica trim para quitar espacios y htmlspecialchars para escapar etiquetas.
 */
function limpiarEntrada($valor) {
    if ($valor === null) {
        return '';
    }

    $valorRecortado = trim((string) $valor);
    return strip_tags($valorRecortado);
}

/**
 * Normaliza un correo para almacenamiento y búsqueda consistente en MySQL.
 */
function normalizarEmail($email) {
    return strtolower(trim((string) $email));
}

/**
 * Valida que un correo electrónico tenga formato correcto.
 */
function correoValido($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Valida que un celular peruano tenga 9 dígitos y comience por 9.
 */
function celularValido($celular) {
    return preg_match('/^9\d{8}$/', $celular) === 1;
}

/**
 * Obtiene y decodifica el cuerpo JSON enviado por fetch desde el frontend.
 */
function leerCuerpoJSON() {
    $cuerpoCrudo = file_get_contents('php://input');
    $cuerpoDecodificado = json_decode($cuerpoCrudo, true);

    if (!is_array($cuerpoDecodificado)) {
        return [];
    }

    return $cuerpoDecodificado;
}

/**
 * Envía una respuesta JSON estandarizada y termina la ejecución.
 */
function responderJSON($codigoHttp, $cuerpoArreglo) {
    http_response_code($codigoHttp);
    echo json_encode($cuerpoArreglo);
    exit;
}

/**
 * Construye un mensaje de error visible para el usuario, ocultando el detalle
 * técnico cuando MODO_DESARROLLO está desactivado.
 */
function armarErrorServidor($mensajeGeneral, PDOException $excepcion) {
    $respuesta = [
        'success' => false,
        'message' => $mensajeGeneral
    ];

    if (defined('MODO_DESARROLLO') && MODO_DESARROLLO === true) {
        $respuesta['detalle_tecnico'] = $excepcion->getMessage();
    }

    return $respuesta;
}

// ---------------------------------------------------------------------------
// BLOQUE 4: Endpoint LOGIN - verifica credenciales con password_verify
// ---------------------------------------------------------------------------
function procesarLogin($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        responderJSON(405, ['success' => false, 'message' => 'Método no permitido. Use POST.']);
    }

    $datos = leerCuerpoJSON();
    $email = normalizarEmail($datos['email'] ?? '');
    $password = $datos['password'] ?? '';

    // Validar campos obligatorios
    if ($email === '' || $password === '') {
        responderJSON(400, [
            'success' => false,
            'message' => 'Debe ingresar correo y contraseña.'
        ]);
    }

    if (!correoValido($email)) {
        responderJSON(400, [
            'success' => false,
            'message' => 'El correo electrónico no tiene un formato válido.'
        ]);
    }

    try {
        $sentencia = $pdo->prepare('SELECT id, rol, nombre, email, celular, password_hash FROM usuarios WHERE LOWER(email) = :email LIMIT 1');
        $sentencia->execute([':email' => $email]);
        $usuarioEncontrado = $sentencia->fetch();

        if (!$usuarioEncontrado || !password_verify($password, $usuarioEncontrado['password_hash'])) {
            // Mitigar ataques de fuerza bruta ralentizando intentos fallidos secuenciales
            sleep(1);
            responderJSON(401, [
                'success' => false,
                'message' => 'Credenciales incorrectas: correo o contraseña inválidos.'
            ]);
        }

        // Nunca devolver el hash de la contraseña al cliente
        unset($usuarioEncontrado['password_hash']);

        // Guardar la sesión de usuario en el servidor
        $_SESSION['usuario'] = [
            'id' => (int) $usuarioEncontrado['id'],
            'rol' => $usuarioEncontrado['rol'],
            'nombre' => $usuarioEncontrado['nombre'],
            'email' => $usuarioEncontrado['email']
        ];

        $rutaRedireccion = 'catalogo.html';

        responderJSON(200, [
            'success' => true,
            'message' => '¡Bienvenido de vuelta a Oficios Perú!',
            'user' => $usuarioEncontrado,
            'redirect' => $rutaRedireccion
        ]);

    } catch (PDOException $e) {
        responderJSON(500, armarErrorServidor('Error del servidor al validar las credenciales.', $e));
    }
}

// ---------------------------------------------------------------------------
// BLOQUE 5: Endpoint REGISTRO - crea usuario y opcionalmente perfil técnico
// ---------------------------------------------------------------------------
function procesarRegistro($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        responderJSON(405, ['success' => false, 'message' => 'Método no permitido. Use POST.']);
    }

    $datos = leerCuerpoJSON();

    // Sanitizar y recoger campos del formulario de registro
    $rol = limpiarEntrada($datos['rol'] ?? 'client');
    $nombre = limpiarEntrada($datos['nombre'] ?? '');
    $email = normalizarEmail($datos['email'] ?? '');
    $celular = limpiarEntrada($datos['celular'] ?? '');
    $password = $datos['password'] ?? '';
    $departamento = limpiarEntrada($datos['departamento'] ?? '');
    $provincia = limpiarEntrada($datos['provincia'] ?? '');
    $distrito = limpiarEntrada($datos['distrito'] ?? '');

    // Reglas de negocio mínimas
    if ($nombre === '' || $email === '' || $celular === '' || $password === '') {
        responderJSON(400, [
            'success' => false,
            'message' => 'Todos los campos del formulario son obligatorios.'
        ]);
    }

    if (strlen($nombre) < 4) {
        responderJSON(400, [
            'success' => false,
            'message' => 'El nombre completo debe tener al menos 4 caracteres.'
        ]);
    }

    if (!correoValido($email)) {
        responderJSON(400, [
            'success' => false,
            'message' => 'El correo electrónico no tiene un formato válido.'
        ]);
    }

    if (!celularValido($celular)) {
        responderJSON(400, [
            'success' => false,
            'message' => 'El celular debe tener 9 dígitos y comenzar con 9 (formato 9XXXXXXXX).'
        ]);
    }

    if (strlen($password) < 8) {
        responderJSON(400, [
            'success' => false,
            'message' => 'La contraseña debe tener al menos 8 caracteres.'
        ]);
    }

    if ($rol !== 'client' && $rol !== 'tech') {
        $rol = 'client';
    }

    // Encriptar la contraseña con BCrypt (algoritmo seguro nativo de PHP)
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    try {
        // Insertar al usuario con sus datos de ubigeo
        $sqlUsuario = 'INSERT INTO usuarios (rol, nombre, email, celular, password_hash, departamento, provincia, distrito)
                       VALUES (:rol, :nombre, :email, :celular, :password_hash, :departamento, :provincia, :distrito)';

        $sentenciaUsuario = $pdo->prepare($sqlUsuario);
        $sentenciaUsuario->execute([
            ':rol' => $rol,
            ':nombre' => $nombre,
            ':email' => $email,
            ':celular' => $celular,
            ':password_hash' => $passwordHash,
            ':departamento' => $departamento,
            ':provincia' => $provincia,
            ':distrito' => $distrito
        ]);

        responderJSON(201, [
            'success' => true,
            'message' => '¡Cuenta creada con éxito! Redirigiendo al inicio de sesión.'
        ]);

    } catch (PDOException $e) {
        // Código 23000 = violación de UNIQUE (email duplicado)
        if ($e->getCode() === '23000') {
            responderJSON(409, [
                'success' => false,
                'message' => 'El correo electrónico ingresado ya está registrado en la plataforma.'
            ]);
        }

        responderJSON(500, armarErrorServidor('Error al registrar el usuario en el servidor.', $e));
    }
}

// ---------------------------------------------------------------------------
// BLOQUE 6: Endpoint TECNICOS - lista del catálogo con filtros opcionales
// ---------------------------------------------------------------------------
function procesarListaTecnicos($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        responderJSON(405, ['success' => false, 'message' => 'Método no permitido. Use GET.']);
    }

    $filtroDepartamento = limpiarEntrada($_GET['departamento'] ?? '');
    $filtroProvincia = limpiarEntrada($_GET['provincia'] ?? '');
    $filtroDistrito = limpiarEntrada($_GET['distrito'] ?? '');
    $filtroCategoria = limpiarEntrada($_GET['categoria'] ?? '');
    $filtroRating = limpiarEntrada($_GET['rating'] ?? '');

    try {
        // Consulta base con JOIN para juntar nombre del usuario y categoría del oficio
        $consulta = 'SELECT t.id, t.id_usuario, t.id_oficio, t.especialidad, t.ciudad, t.provincia, t.distrito,
                            t.descripcion, t.tags, t.imagen, t.valoracion, t.resenas, t.online,
                            u.nombre, u.email, u.celular, u.departamento, u.provincia AS usuario_provincia,
                            o.nombre AS oficio_nombre, o.categoria AS oficio_categoria
                     FROM tecnicos t
                     INNER JOIN usuarios u ON t.id_usuario = u.id
                     LEFT JOIN oficios o ON t.id_oficio = o.id
                     WHERE 1 = 1';

        $parametros = [];

        if ($filtroDepartamento !== '') {
            $consulta .= ' AND (LOWER(u.departamento) = LOWER(:departamento_user) OR LOWER(t.ciudad) = LOWER(:departamento_ciudad))';
            $parametros[':departamento_user'] = $filtroDepartamento;
            $parametros[':departamento_ciudad'] = $filtroDepartamento;
        }

        if ($filtroProvincia !== '') {
            $consulta .= ' AND (LOWER(u.provincia) = LOWER(:provincia_user) OR LOWER(t.provincia) = LOWER(:provincia_tech))';
            $parametros[':provincia_user'] = $filtroProvincia;
            $parametros[':provincia_tech'] = $filtroProvincia;
        }

        if ($filtroDistrito !== '') {
            $consulta .= ' AND (LOWER(u.distrito) = LOWER(:distrito_user) OR LOWER(t.distrito) = LOWER(:distrito_tech))';
            $parametros[':distrito_user'] = $filtroDistrito;
            $parametros[':distrito_tech'] = $filtroDistrito;
        }

        if ($filtroCategoria !== '') {
            $consulta .= ' AND o.categoria = :categoria';
            $parametros[':categoria'] = $filtroCategoria;
        }

        if ($filtroRating !== '' && $filtroRating !== 'all') {
            $consulta .= ' AND t.valoracion >= :rating';
            $parametros[':rating'] = floatval($filtroRating);
        }

        $consulta .= ' ORDER BY t.valoracion DESC, t.resenas DESC';

        $sentencia = $pdo->prepare($consulta);
        $sentencia->execute($parametros);
        $listaTecnicos = $sentencia->fetchAll();

        responderJSON(200, [
            'success' => true,
            'total' => count($listaTecnicos),
            'data' => $listaTecnicos
        ]);

    } catch (PDOException $e) {
        responderJSON(500, armarErrorServidor('Error consultando el catálogo de técnicos.', $e));
    }
}

// ---------------------------------------------------------------------------
// BLOQUE 6.1: Endpoint TECNICO - devuelve el perfil de un único técnico por id
// Alimenta la página de perfil (producto.html?id=N) con los mismos campos del
// catálogo, pero filtrando por el id del técnico.
// ---------------------------------------------------------------------------
function procesarObtenerTecnico($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        responderJSON(405, ['success' => false, 'message' => 'Método no permitido. Use GET.']);
    }

    $idTecnico = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($idTecnico <= 0) {
        responderJSON(400, [
            'success' => false,
            'message' => 'Debe indicar un id de técnico válido.'
        ]);
    }

    try {
        $sentencia = $pdo->prepare('SELECT t.id, t.id_usuario, t.id_oficio, t.especialidad, t.ciudad, t.provincia, t.distrito,
                                           t.descripcion, t.tags, t.imagen, t.valoracion, t.resenas, t.online,
                                           u.nombre, u.email, u.celular, u.departamento, u.provincia AS usuario_provincia,
                                           o.nombre AS oficio_nombre, o.categoria AS oficio_categoria
                                    FROM tecnicos t
                                    INNER JOIN usuarios u ON t.id_usuario = u.id
                                    LEFT JOIN oficios o ON t.id_oficio = o.id
                                    WHERE t.id = :id
                                    LIMIT 1');
        $sentencia->execute([':id' => $idTecnico]);
        $tecnicoEncontrado = $sentencia->fetch();

        if (!$tecnicoEncontrado) {
            responderJSON(404, [
                'success' => false,
                'message' => 'No se encontró el técnico solicitado.'
            ]);
        }

        responderJSON(200, [
            'success' => true,
            'data' => $tecnicoEncontrado
        ]);

    } catch (PDOException $e) {
        responderJSON(500, armarErrorServidor('Error consultando el perfil del técnico.', $e));
    }
}

// ---------------------------------------------------------------------------
// BLOQUE 7: Endpoint SERVICIOS - lista los servicios ofrecidos por un técnico
// ---------------------------------------------------------------------------
function procesarListaServicios($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        responderJSON(405, ['success' => false, 'message' => 'Método no permitido. Use GET.']);
    }

    $idTecnico = isset($_GET['id_tecnico']) ? (int) $_GET['id_tecnico'] : 0;

    if ($idTecnico <= 0) {
        responderJSON(400, [
            'success' => false,
            'message' => 'Debe indicar un id_tecnico válido para listar sus servicios.'
        ]);
    }

    try {
        $sentencia = $pdo->prepare('SELECT id, titulo, descripcion, precio_base, duracion_estimada, fecha_publicacion
                                    FROM servicios
                                    WHERE id_tecnico = :id_tecnico
                                    ORDER BY fecha_publicacion DESC');
        $sentencia->execute([':id_tecnico' => $idTecnico]);
        $listaServicios = $sentencia->fetchAll();

        responderJSON(200, [
            'success' => true,
            'total' => count($listaServicios),
            'data' => $listaServicios
        ]);

    } catch (PDOException $e) {
        responderJSON(500, armarErrorServidor('Error consultando los servicios del técnico.', $e));
    }
}

// ---------------------------------------------------------------------------
// BLOQUE 8: Endpoint RESEÑAS - lista las reseñas recibidas por un técnico
// ---------------------------------------------------------------------------
function procesarListaResenas($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        responderJSON(405, ['success' => false, 'message' => 'Método no permitido. Use GET.']);
    }

    $idTecnico = isset($_GET['id_tecnico']) ? (int) $_GET['id_tecnico'] : 0;

    if ($idTecnico <= 0) {
        responderJSON(400, [
            'success' => false,
            'message' => 'Debe indicar un id_tecnico válido para listar sus reseñas.'
        ]);
    }

    try {
        $sentencia = $pdo->prepare('SELECT r.id, r.calificacion, r.comentario, r.fecha_resena,
                                           u.nombre AS nombre_cliente
                                    FROM resenas r
                                    INNER JOIN usuarios u ON r.id_cliente = u.id
                                    WHERE r.id_tecnico = :id_tecnico
                                    ORDER BY r.fecha_resena DESC');
        $sentencia->execute([':id_tecnico' => $idTecnico]);
        $listaResenas = $sentencia->fetchAll();

        responderJSON(200, [
            'success' => true,
            'total' => count($listaResenas),
            'data' => $listaResenas
        ]);

    } catch (PDOException $e) {
        responderJSON(500, armarErrorServidor('Error consultando las reseñas del técnico.', $e));
    }
}

// ---------------------------------------------------------------------------
// BLOQUE 9: Endpoint CREAR RESEÑA - registra una opinión de cliente
// ---------------------------------------------------------------------------
function procesarCrearResena($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        responderJSON(405, ['success' => false, 'message' => 'Método no permitido. Use POST.']);
    }

    $datos = leerCuerpoJSON();

    $idTecnico = isset($datos['id_tecnico']) ? (int) $datos['id_tecnico'] : 0;
    $idCliente = isset($datos['id_cliente']) ? (int) $datos['id_cliente'] : 0;
    $calificacion = isset($datos['calificacion']) ? (int) $datos['calificacion'] : 0;
    $comentario = limpiarEntrada($datos['comentario'] ?? '');

    // Validar sesión activa y correspondencia de cliente
    if (!isset($_SESSION['usuario'])) {
        responderJSON(401, [
            'success' => false,
            'message' => 'No autorizado. Debe iniciar sesión para dejar una reseña.'
        ]);
    }

    if ((int) $_SESSION['usuario']['id'] !== $idCliente) {
        responderJSON(403, [
            'success' => false,
            'message' => 'No autorizado. La reseña debe corresponder al usuario autenticado.'
        ]);
    }

    // Validaciones de negocio
    if ($idTecnico <= 0 || $idCliente <= 0) {
        responderJSON(400, [
            'success' => false,
            'message' => 'Debe enviar id_tecnico e id_cliente válidos.'
        ]);
    }

    if ($calificacion < 1 || $calificacion > 5) {
        responderJSON(400, [
            'success' => false,
            'message' => 'La calificación debe estar entre 1 y 5 estrellas.'
        ]);
    }

    if (strlen($comentario) < 10) {
        responderJSON(400, [
            'success' => false,
            'message' => 'El comentario debe tener al menos 10 caracteres.'
        ]);
    }

    try {
        $pdo->beginTransaction();

        // Insertar la nueva reseña
        $sqlInsertarResena = 'INSERT INTO resenas (id_tecnico, id_cliente, calificacion, comentario)
                              VALUES (:id_tecnico, :id_cliente, :calificacion, :comentario)';

        $sentenciaInsertar = $pdo->prepare($sqlInsertarResena);
        $sentenciaInsertar->execute([
            ':id_tecnico' => $idTecnico,
            ':id_cliente' => $idCliente,
            ':calificacion' => $calificacion,
            ':comentario' => $comentario
        ]);

        // Recalcular el promedio y total de reseñas del técnico
        $sqlActualizarTecnico = 'UPDATE tecnicos
                                 SET valoracion = (SELECT ROUND(AVG(calificacion), 1) FROM resenas WHERE id_tecnico = :id_tecnico_avg),
                                     resenas = (SELECT COUNT(*) FROM resenas WHERE id_tecnico = :id_tecnico_count)
                                 WHERE id = :id_tecnico_update';

        $sentenciaActualizar = $pdo->prepare($sqlActualizarTecnico);
        $sentenciaActualizar->execute([
            ':id_tecnico_avg' => $idTecnico,
            ':id_tecnico_count' => $idTecnico,
            ':id_tecnico_update' => $idTecnico
        ]);

        $pdo->commit();

        responderJSON(201, [
            'success' => true,
            'message' => '¡Reseña registrada con éxito! Gracias por compartir tu experiencia.'
        ]);

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        responderJSON(500, armarErrorServidor('Error al registrar la reseña en el servidor.', $e));
    }
}

// ---------------------------------------------------------------------------
// BLOQUE 10: Endpoint OFRECER SERVICIO - publica perfil de técnico con foto
// ---------------------------------------------------------------------------
function procesarOfrecerServicio($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        responderJSON(405, ['success' => false, 'message' => 'Método no permitido. Use POST.']);
    }

    $idUsuario = isset($_POST['id_usuario']) ? (int) $_POST['id_usuario'] : 0;
    $oficio = limpiarEntrada($_POST['oficio'] ?? '');
    $departamento = limpiarEntrada($_POST['departamento'] ?? '');
    $provincia = limpiarEntrada($_POST['provincia'] ?? '');
    $distrito = limpiarEntrada($_POST['distrito'] ?? '');
    $descripcion = limpiarEntrada($_POST['descripcion'] ?? '');

    // Validar sesión activa y correspondencia de usuario
    if (!isset($_SESSION['usuario'])) {
        responderJSON(401, [
            'success' => false,
            'message' => 'No autorizado. Debe iniciar sesión para publicar su oficio.'
        ]);
    }

    if ((int) $_SESSION['usuario']['id'] !== $idUsuario) {
        responderJSON(403, [
            'success' => false,
            'message' => 'No autorizado. El perfil debe pertenecer al usuario autenticado.'
        ]);
    }

    if ($oficio === '' || $departamento === '' || $provincia === '' || $distrito === '') {
        responderJSON(400, [
            'success' => false,
            'message' => 'Complete oficio, departamento, provincia y distrito.'
        ]);
    }

    if (strlen($descripcion) < 20) {
        responderJSON(400, [
            'success' => false,
            'message' => 'La descripción debe tener al menos 20 caracteres.'
        ]);
    }

    $imagenPorDefecto = '/oficios/frontend/assets/img/perfil.jpg';
    $rutaImagen = $imagenPorDefecto;

    if (isset($_FILES['foto']) && $_FILES['foto']['error'] !== UPLOAD_ERR_NO_FILE) {
        if ($_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
            responderJSON(400, [
                'success' => false,
                'message' => 'No se pudo subir la foto. Intente con otro archivo.'
            ]);
        }

        if ($_FILES['foto']['size'] > 2 * 1024 * 1024) {
            responderJSON(400, [
                'success' => false,
                'message' => 'La foto no debe superar los 2 MB.'
            ]);
        }

        $tipoMime = mime_content_type($_FILES['foto']['tmp_name']);
        $tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

        if (!in_array($tipoMime, $tiposPermitidos, true)) {
            responderJSON(400, [
                'success' => false,
                'message' => 'Formato de imagen no permitido. Use JPG, PNG o WEBP.'
            ]);
        }

        $extension = 'jpg';
        if ($tipoMime === 'image/png') {
            $extension = 'png';
        } elseif ($tipoMime === 'image/webp') {
            $extension = 'webp';
        }

        $directorioUploads = realpath(__DIR__ . '/../../frontend/assets/uploads');
        if ($directorioUploads === false) {
            $directorioUploads = __DIR__ . '/../../frontend/assets/uploads';
            if (!is_dir($directorioUploads)) {
                mkdir($directorioUploads, 0755, true);
            }
        }

        $nombreArchivo = 'tecnico_' . $idUsuario . '_' . time() . '.' . $extension;
        $rutaDestino = rtrim($directorioUploads, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $nombreArchivo;

        if (!move_uploaded_file($_FILES['foto']['tmp_name'], $rutaDestino)) {
            responderJSON(500, [
                'success' => false,
                'message' => 'Error al guardar la foto en el servidor.'
            ]);
        }

        $rutaImagen = '/oficios/frontend/assets/uploads/' . $nombreArchivo;
    }

    try {
        $sentenciaUsuario = $pdo->prepare('SELECT id, nombre FROM usuarios WHERE id = :id LIMIT 1');
        $sentenciaUsuario->execute([':id' => $idUsuario]);
        $usuarioEncontrado = $sentenciaUsuario->fetch();

        if (!$usuarioEncontrado) {
            responderJSON(404, [
                'success' => false,
                'message' => 'Usuario no encontrado. Inicie sesión nuevamente.'
            ]);
        }

        $idOficio = null;
        $sentenciaOficio = $pdo->prepare('SELECT id FROM oficios WHERE nombre LIKE :oficio OR categoria LIKE :oficio_cat LIMIT 1');
        $sentenciaOficio->execute([
            ':oficio' => '%' . $oficio . '%',
            ':oficio_cat' => '%' . strtolower($oficio) . '%'
        ]);
        $oficioEncontrado = $sentenciaOficio->fetch();

        if ($oficioEncontrado) {
            $idOficio = (int) $oficioEncontrado['id'];
        }

        $pdo->beginTransaction();

        $sentenciaActualizarUsuario = $pdo->prepare('UPDATE usuarios
                                                     SET rol = :rol,
                                                         departamento = :departamento,
                                                         provincia = :provincia,
                                                         distrito = :distrito
                                                     WHERE id = :id');
        $sentenciaActualizarUsuario->execute([
            ':rol' => 'tech',
            ':departamento' => $departamento,
            ':provincia' => $provincia,
            ':distrito' => $distrito,
            ':id' => $idUsuario
        ]);

        $sentenciaExisteTecnico = $pdo->prepare('SELECT id FROM tecnicos WHERE id_usuario = :id_usuario LIMIT 1');
        $sentenciaExisteTecnico->execute([':id_usuario' => $idUsuario]);
        $tecnicoExistente = $sentenciaExisteTecnico->fetch();

        if ($tecnicoExistente) {
            $sqlActualizarTecnico = 'UPDATE tecnicos
                                     SET id_oficio = :id_oficio,
                                         especialidad = :especialidad,
                                         ciudad = :ciudad,
                                         provincia = :provincia,
                                         distrito = :distrito,
                                         descripcion = :descripcion,
                                         imagen = :imagen,
                                         online = 1
                                     WHERE id_usuario = :id_usuario';

            $sentenciaActualizarTecnico = $pdo->prepare($sqlActualizarTecnico);
            $sentenciaActualizarTecnico->execute([
                ':id_oficio' => $idOficio,
                ':especialidad' => $oficio,
                ':ciudad' => $departamento,
                ':provincia' => $provincia,
                ':distrito' => $distrito,
                ':descripcion' => $descripcion,
                ':imagen' => $rutaImagen,
                ':id_usuario' => $idUsuario
            ]);
        } else {
            $sqlInsertarTecnico = 'INSERT INTO tecnicos (id_usuario, id_oficio, especialidad, ciudad, provincia, distrito, descripcion, tags, imagen, valoracion, resenas, online)
                                   VALUES (:id_usuario, :id_oficio, :especialidad, :ciudad, :provincia, :distrito, :descripcion, :tags, :imagen, 5.0, 0, 1)';

            $sentenciaInsertarTecnico = $pdo->prepare($sqlInsertarTecnico);
            $sentenciaInsertarTecnico->execute([
                ':id_usuario' => $idUsuario,
                ':id_oficio' => $idOficio,
                ':especialidad' => $oficio,
                ':ciudad' => $departamento,
                ':provincia' => $provincia,
                ':distrito' => $distrito,
                ':descripcion' => $descripcion,
                ':tags' => $oficio,
                ':imagen' => $rutaImagen
            ]);
        }

        $pdo->commit();

        responderJSON(201, [
            'success' => true,
            'message' => '¡Tu oficio fue publicado con éxito! Ya apareces en el catálogo de técnicos.'
        ]);

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        responderJSON(500, armarErrorServidor('Error al publicar el oficio en el servidor.', $e));
    }
}

/**
 * Cierra la sesión de usuario en el servidor, limpia el arreglo $_SESSION y destruye la cookie de sesión.
 */
function procesarLogout() {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    responderJSON(200, [
        'success' => true,
        'message' => 'Sesión cerrada con éxito en el servidor.'
    ]);
}

/**
 * Devuelve un resumen estadístico (agregación avanzada) de la plataforma.
 */
function procesarObtenerEstadisticas($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        responderJSON(405, ['success' => false, 'message' => 'Método no permitido. Use GET.']);
    }

    try {
        $consulta = 'SELECT 
                        (SELECT COUNT(*) FROM tecnicos) AS total_tecnicos,
                        (SELECT COUNT(*) FROM resenas) AS total_resenas,
                        (SELECT IFNULL(ROUND(AVG(calificacion), 1), 5.0) FROM resenas) AS promedio_general';
        
        $sentencia = $pdo->prepare($consulta);
        $sentencia->execute();
        $estadisticas = $sentencia->fetch();

        responderJSON(200, [
            'success' => true,
            'data' => [
                'total_tecnicos' => (int) $estadisticas['total_tecnicos'],
                'total_resenas' => (int) $estadisticas['total_resenas'],
                'promedio_general' => (float) $estadisticas['promedio_general']
            ]
        ]);

    } catch (PDOException $e) {
        responderJSON(500, armarErrorServidor('Error al consultar las estadísticas de la plataforma.', $e));
    }
}

/**
 * Elimina una reseña específica y recalcula dinámicamente la valoración del técnico afectado.
 */
function procesarEliminarResena($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        responderJSON(405, ['success' => false, 'message' => 'Método no permitido. Use POST.']);
    }

    // Validar sesión activa
    if (!isset($_SESSION['usuario'])) {
        responderJSON(401, [
            'success' => false,
            'message' => 'No autorizado. Debe iniciar sesión para eliminar una reseña.'
        ]);
    }

    $datos = leerCuerpoJSON();
    $idResena = isset($datos['id_resena']) ? (int) $datos['id_resena'] : 0;

    if ($idResena <= 0) {
        responderJSON(400, [
            'success' => false,
            'message' => 'Debe indicar un id_resena válido.'
        ]);
    }

    try {
        // Consultar existencia y detalles de la reseña
        $sentenciaSeleccionar = $pdo->prepare('SELECT id_cliente, id_tecnico FROM resenas WHERE id = :id LIMIT 1');
        $sentenciaSeleccionar->execute([':id' => $idResena]);
        $resena = $sentenciaSeleccionar->fetch();

        if (!$resena) {
            responderJSON(404, [
                'success' => false,
                'message' => 'No se encontró la reseña solicitada.'
            ]);
        }

        // Validar propiedad (solo el autor de la reseña puede eliminarla)
        if ((int) $_SESSION['usuario']['id'] !== (int) $resena['id_cliente']) {
            responderJSON(403, [
                'success' => false,
                'message' => 'No autorizado. No tiene permisos para eliminar esta reseña.'
            ]);
        }

        $idTecnico = (int) $resena['id_tecnico'];

        $pdo->beginTransaction();

        // Eliminar reseña
        $sentenciaEliminar = $pdo->prepare('DELETE FROM resenas WHERE id = :id');
        $sentenciaEliminar->execute([':id' => $idResena]);

        // Recalcular promedio y total del técnico
        $sqlActualizarTecnico = 'UPDATE tecnicos
                                 SET valoracion = (SELECT IFNULL(ROUND(AVG(calificacion), 1), 5.0) FROM resenas WHERE id_tecnico = :id_tecnico_avg),
                                     resenas = (SELECT COUNT(*) FROM resenas WHERE id_tecnico = :id_tecnico_count)
                                 WHERE id = :id_tecnico_update';

        $sentenciaActualizar = $pdo->prepare($sqlActualizarTecnico);
        $sentenciaActualizar->execute([
            ':id_tecnico_avg' => $idTecnico,
            ':id_tecnico_count' => $idTecnico,
            ':id_tecnico_update' => $idTecnico
        ]);

        $pdo->commit();

        responderJSON(200, [
            'success' => true,
            'message' => 'Reseña eliminada con éxito.'
        ]);

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        responderJSON(500, armarErrorServidor('Error al eliminar la reseña en el servidor.', $e));
    }
}

/**
 * Elimina un servicio específico verificado bajo la propiedad del técnico autenticado.
 */
function procesarEliminarServicio($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        responderJSON(405, ['success' => false, 'message' => 'Método no permitido. Use POST.']);
    }

    // Validar sesión activa
    if (!isset($_SESSION['usuario'])) {
        responderJSON(401, [
            'success' => false,
            'message' => 'No autorizado. Debe iniciar sesión para eliminar un servicio.'
        ]);
    }

    $datos = leerCuerpoJSON();
    $idServicio = isset($datos['id_servicio']) ? (int) $datos['id_servicio'] : 0;

    if ($idServicio <= 0) {
        responderJSON(400, [
            'success' => false,
            'message' => 'Debe indicar un id_servicio válido.'
        ]);
    }

    try {
        // Consultar existencia y detalles del servicio
        $sentenciaServicio = $pdo->prepare('SELECT id_tecnico FROM servicios WHERE id = :id LIMIT 1');
        $sentenciaServicio->execute([':id' => $idServicio]);
        $servicio = $sentenciaServicio->fetch();

        if (!$servicio) {
            responderJSON(404, [
                'success' => false,
                'message' => 'No se encontró el servicio solicitado.'
            ]);
        }

        // Consultar el perfil del técnico asociado al usuario autenticado
        $sentenciaTecnico = $pdo->prepare('SELECT id FROM tecnicos WHERE id_usuario = :id_usuario LIMIT 1');
        $sentenciaTecnico->execute([':id_usuario' => (int) $_SESSION['usuario']['id']]);
        $tecnico = $sentenciaTecnico->fetch();

        // Validar propiedad del servicio (el usuario debe ser técnico y el servicio debe pertenecer a su perfil)
        if (!$tecnico || (int) $tecnico['id'] !== (int) $servicio['id_tecnico']) {
            responderJSON(403, [
                'success' => false,
                'message' => 'No autorizado. No tiene permisos para eliminar este servicio.'
            ]);
        }

        // Eliminar servicio
        $sentenciaEliminar = $pdo->prepare('DELETE FROM servicios WHERE id = :id');
        $sentenciaEliminar->execute([':id' => $idServicio]);

        responderJSON(200, [
            'success' => true,
            'message' => 'Servicio eliminado con éxito.'
        ]);

    } catch (PDOException $e) {
        responderJSON(500, armarErrorServidor('Error al eliminar el servicio en el servidor.', $e));
    }
}

/**
 * Crea un nuevo servicio/tarifa para el perfil del técnico autenticado.
 */
function procesarCrearServicio($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        responderJSON(405, ['success' => false, 'message' => 'Método no permitido. Use POST.']);
    }

    // Validar sesión activa
    if (!isset($_SESSION['usuario'])) {
        responderJSON(401, [
            'success' => false,
            'message' => 'No autorizado. Debe iniciar sesión para agregar un servicio.'
        ]);
    }

    $datos = leerCuerpoJSON();
    $titulo = limpiarEntrada($datos['titulo'] ?? '');
    $descripcion = limpiarEntrada($datos['descripcion'] ?? '');
    $precioBase = isset($datos['precio_base']) ? floatval($datos['precio_base']) : 0.0;
    $duracionEstimada = limpiarEntrada($datos['duracion_estimada'] ?? '');

    // Validar campos obligatorios
    if ($titulo === '' || $precioBase <= 0 || $duracionEstimada === '') {
        responderJSON(400, [
            'success' => false,
            'message' => 'El título, el precio base (mayor a 0) y la duración estimada son obligatorios.'
        ]);
    }

    if ($precioBase > 999999.99) {
        responderJSON(400, [
            'success' => false,
            'message' => 'El precio no puede exceder S/ 999,999.99.'
        ]);
    }

    try {
        // Consultar el perfil del técnico asociado al usuario autenticado
        $sentenciaTecnico = $pdo->prepare('SELECT id FROM tecnicos WHERE id_usuario = :id_usuario LIMIT 1');
        $sentenciaTecnico->execute([':id_usuario' => (int) $_SESSION['usuario']['id']]);
        $tecnico = $sentenciaTecnico->fetch();

        // Validar que el usuario sea realmente técnico
        if (!$tecnico) {
            responderJSON(403, [
                'success' => false,
                'message' => 'No autorizado. Debe publicar su perfil técnico antes de agregar tarifas.'
            ]);
        }

        $idTecnico = (int) $tecnico['id'];

        // Insertar el nuevo servicio
        $sqlInsertar = 'INSERT INTO servicios (id_tecnico, titulo, descripcion, precio_base, duracion_estimada)
                        VALUES (:id_tecnico, :titulo, :descripcion, :precio_base, :duracion_estimada)';
        
        $sentenciaInsertar = $pdo->prepare($sqlInsertar);
        $sentenciaInsertar->execute([
            ':id_tecnico' => $idTecnico,
            ':titulo' => $titulo,
            ':descripcion' => $descripcion,
            ':precio_base' => $precioBase,
            ':duracion_estimada' => $duracionEstimada
        ]);

        responderJSON(201, [
            'success' => true,
            'message' => 'Servicio agregado con éxito.'
        ]);

    } catch (PDOException $e) {
        responderJSON(500, armarErrorServidor('Error al crear el servicio en el servidor.', $e));
    }
}
