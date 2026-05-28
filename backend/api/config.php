<?php
/**
 * config.php - Configuración y conexión segura a MySQL mediante PDO.
 * Este archivo se incluye desde datos.php para obtener una instancia $pdo lista
 * para ejecutar consultas con prepared statements (anti inyección SQL).
 */

// ---------------------------------------------------------------------------
// BLOQUE 1: Bandera de entorno
// ---------------------------------------------------------------------------
// En desarrollo mostramos detalle técnico de errores para depurar fácil.
// En producción cambiar a false para no exponer información sensible.
define('MODO_DESARROLLO', true);

// ---------------------------------------------------------------------------
// BLOQUE 2: Credenciales de la base de datos (XAMPP / WAMP / Laragon)
// ---------------------------------------------------------------------------
define('DB_HOST', 'localhost');
define('DB_NAME', 'oficios_peru');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PORT', '3306');
define('DB_CHAR', 'utf8mb4');

// ---------------------------------------------------------------------------
// BLOQUE 3: Construcción del DSN y opciones de seguridad de PDO
// ---------------------------------------------------------------------------
$cadenaConexion = 'mysql:host=' . DB_HOST
    . ';dbname=' . DB_NAME
    . ';port=' . DB_PORT
    . ';charset=' . DB_CHAR;

// Opciones recomendadas para PDO seguro:
// - ERRMODE_EXCEPTION   : lanza excepciones al fallar una consulta (manejable).
// - FETCH_ASSOC         : devuelve filas como arrays asociativos (más limpio).
// - EMULATE_PREPARES off: usa prepared statements REALES del motor MySQL.
$opcionesPDO = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false
];

// ---------------------------------------------------------------------------
// BLOQUE 4: Intento de conexión con manejo de excepciones explicable
// ---------------------------------------------------------------------------
try {
    $pdo = new PDO($cadenaConexion, DB_USER, DB_PASS, $opcionesPDO);
} catch (PDOException $e) {
    // Si el motor no responde, devolvemos JSON estándar 500.
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(500);

    $respuestaError = [
        'success' => false,
        'message' => 'No fue posible conectar con la base de datos. Verifique que MySQL esté activo.'
    ];

    // Sólo en desarrollo mostramos el detalle técnico
    if (MODO_DESARROLLO) {
        $respuestaError['detalle_tecnico'] = $e->getMessage();
    }

    echo json_encode($respuestaError);
    exit;
}
