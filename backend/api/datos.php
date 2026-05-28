<?php
/**
 * datos.php - Controlador central de endpoints REST del SaaS Oficios Perú.
 * Reglas de seguridad aplicadas en TODOS los endpoints:
 *   1. Prepared statements PDO (anti SQL Injection).
 *   2. Sanitización con limpiarEntrada() (anti XSS y caracteres invisibles).
 *   3. Validación de tipo y formato (email, celular, longitudes).
 *   4. Respuestas siempre en JSON con códigos HTTP correctos.
 */

// ---------------------------------------------------------------------------
// BLOQUE 1: Cabeceras HTTP comunes (CORS y JSON)
// ---------------------------------------------------------------------------
header('Access-Control-Allow-Origin: *');
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

    default:
        responderJSON(404, [
            'success' => false,
            'message' => 'Acción API no reconocida. Use ?action=login, registro, tecnicos, tecnico, servicios, resenas, crear_resena u ofrecer_servicio.'
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
    $valorSinEtiquetas = strip_tags($valorRecortado);
    return htmlspecialchars($valorSinEtiquetas, ENT_QUOTES, 'UTF-8');
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
            responderJSON(401, [
                'success' => false,
                'message' => 'Credenciales incorrectas: correo o contraseña inválidos.'
            ]);
        }

        // Nunca devolver el hash de la contraseña al cliente
        unset($usuarioEncontrado['password_hash']);

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
        // Transacción para asegurar consistencia entre usuarios y tecnicos
        $pdo->beginTransaction();

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

        $pdo->commit();

        responderJSON(201, [
            'success' => true,
            'message' => '¡Cuenta creada con éxito! Redirigiendo al inicio de sesión.'
        ]);

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

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
    $filtroCategoria = limpiarEntrada($_GET['categoria'] ?? '');
    $filtroRating = limpiarEntrada($_GET['rating'] ?? '');

    try {
        // Consulta base con JOIN para juntar nombre del usuario y categoría del oficio
        $consulta = 'SELECT t.id, t.id_usuario, t.id_oficio, t.especialidad, t.ciudad, t.distrito,
                            t.descripcion, t.tags, t.imagen, t.valoracion, t.resenas, t.online,
                            u.nombre, u.email, u.celular, u.departamento, u.provincia,
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
        $sentencia = $pdo->prepare('SELECT t.id, t.id_usuario, t.id_oficio, t.especialidad, t.ciudad, t.distrito,
                                           t.descripcion, t.tags, t.imagen, t.valoracion, t.resenas, t.online,
                                           u.nombre, u.email, u.celular, u.departamento, u.provincia,
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

    if ($idUsuario <= 0) {
        responderJSON(400, [
            'success' => false,
            'message' => 'Debe iniciar sesión para publicar su oficio.'
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
                ':distrito' => $distrito,
                ':descripcion' => $descripcion,
                ':imagen' => $rutaImagen,
                ':id_usuario' => $idUsuario
            ]);
        } else {
            $sqlInsertarTecnico = 'INSERT INTO tecnicos (id_usuario, id_oficio, especialidad, ciudad, distrito, descripcion, tags, imagen, valoracion, resenas, online)
                                   VALUES (:id_usuario, :id_oficio, :especialidad, :ciudad, :distrito, :descripcion, :tags, :imagen, 5.0, 0, 1)';

            $sentenciaInsertarTecnico = $pdo->prepare($sqlInsertarTecnico);
            $sentenciaInsertarTecnico->execute([
                ':id_usuario' => $idUsuario,
                ':id_oficio' => $idOficio,
                ':especialidad' => $oficio,
                ':ciudad' => $departamento,
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
