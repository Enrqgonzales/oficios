-- ============================================================================
-- schema.sql - Esquema relacional normalizado del SaaS Oficios Perú.
-- Base de datos MySQL 8.0+ con codificación UTF-8 estricta para tildes y ñ.
-- ============================================================================

-- Crear la base de datos sólo si no existe y posicionarse en ella
CREATE DATABASE IF NOT EXISTS oficios_peru
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE oficios_peru;

-- Limpiar tablas previas en orden inverso para evitar conflictos de llaves
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS resenas;
DROP TABLE IF EXISTS servicios;
DROP TABLE IF EXISTS tecnicos;
DROP TABLE IF EXISTS oficios;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- TABLA 1: usuarios
-- Guarda a TODOS los usuarios del sistema (clientes y técnicos especialistas).
-- El rol determina si el usuario también tendrá un perfil en la tabla tecnicos.
-- ----------------------------------------------------------------------------
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol ENUM('client', 'tech') NOT NULL DEFAULT 'client',
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    celular VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    departamento VARCHAR(60) NULL,
    provincia VARCHAR(60) NULL,
    distrito VARCHAR(60) NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLA 2: oficios
-- Catálogo de categorías de servicios técnicos que ofrece la plataforma.
-- ----------------------------------------------------------------------------
CREATE TABLE oficios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    categoria VARCHAR(50) NOT NULL,
    INDEX idx_oficios_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLA 3: tecnicos (Perfil del Especialista)
-- Relación 1 a 1 con un usuario cuyo rol es 'tech'.
-- Aquí se guardan los datos visibles del catálogo: ciudad, valoración, online.
-- ----------------------------------------------------------------------------
CREATE TABLE tecnicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    id_oficio INT DEFAULT NULL,
    especialidad VARCHAR(100) NOT NULL,
    ciudad VARCHAR(80) NOT NULL DEFAULT 'Lima',
    provincia VARCHAR(80) NOT NULL DEFAULT 'Lima',
    distrito VARCHAR(80) NOT NULL,
    descripcion TEXT NULL,
    tags VARCHAR(255) NULL,
    imagen VARCHAR(255) NULL,
    valoracion DECIMAL(2,1) DEFAULT 5.0,
    resenas INT DEFAULT 0,
    online TINYINT(1) DEFAULT 1,
    CONSTRAINT fk_tecnicos_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_tecnicos_oficio FOREIGN KEY (id_oficio)
        REFERENCES oficios(id) ON DELETE SET NULL,
    INDEX idx_tecnicos_ciudad (ciudad),
    INDEX idx_tecnicos_valoracion (valoracion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLA 4: servicios
-- Listado concreto de servicios que cada técnico ofrece con su precio base.
-- Un técnico puede ofrecer varios servicios (relación 1 a N).
-- ----------------------------------------------------------------------------
CREATE TABLE servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_tecnico INT NOT NULL,
    titulo VARCHAR(120) NOT NULL,
    descripcion TEXT NULL,
    precio_base DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    duracion_estimada VARCHAR(50) DEFAULT NULL,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_servicios_tecnico FOREIGN KEY (id_tecnico)
        REFERENCES tecnicos(id) ON DELETE CASCADE,
    INDEX idx_servicios_tecnico (id_tecnico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLA 5: resenas
-- Opiniones de clientes hacia técnicos: nota (1-5) y comentario.
-- Un cliente puede dejar varias reseñas a distintos técnicos.
-- ----------------------------------------------------------------------------
CREATE TABLE resenas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_tecnico INT NOT NULL,
    id_cliente INT NOT NULL,
    calificacion TINYINT(1) NOT NULL,
    comentario TEXT NULL,
    fecha_resena TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resenas_tecnico FOREIGN KEY (id_tecnico)
        REFERENCES tecnicos(id) ON DELETE CASCADE,
    CONSTRAINT fk_resenas_cliente FOREIGN KEY (id_cliente)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_resenas_tecnico (id_tecnico),
    CONSTRAINT chk_resenas_rango CHECK (calificacion BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATOS SEMILLA
-- ============================================================================

-- Categorías base de oficios disponibles en la plataforma
INSERT INTO oficios (nombre, categoria) VALUES
('Electricista Residencial e Industrial', 'electricidad'),
('Gasfitería Sanitaria y Filtraciones', 'gasfiteria'),
('Carpintería Modular y de Melamina', 'carpinteria'),
('Pintura Profesional y Acabados', 'pintura'),
('Servicio Técnico de Línea Blanca', 'electrodomesticos'),
('Cerrajería 24 Horas', 'cerrajeria'),
('Albañilería y Construcción', 'construccion'),
('Soporte de Cómputo y Laptops', 'tecnologia');

-- Usuarios semilla (contraseña en texto plano para todos: 12345678).
-- El hash BCrypt corresponde a password_hash('12345678', PASSWORD_BCRYPT).
INSERT INTO usuarios (id, rol, nombre, email, celular, password_hash, departamento, provincia, distrito) VALUES
(1, 'tech', 'Pedro Huamán', 'pedro.huaman@oficiosperu.pe', '981234567', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Lima', 'Lima', 'San Miguel'),
(2, 'tech', 'Sofía Mendoza', 'sofia.mendoza@oficiosperu.pe', '987654321', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Lima', 'Lima', 'Miraflores'),
(3, 'tech', 'Marcos Quispe', 'marcos.quispe@oficiosperu.pe', '991122334', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Arequipa', 'Arequipa', 'Yanahuara'),
(4, 'tech', 'Luciana Cárdenas', 'luciana.cardenas@oficiosperu.pe', '955889900', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Lima', 'Lima', 'La Molina'),
(5, 'tech', 'Roberto Díaz', 'roberto.diaz@oficiosperu.pe', '944332211', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Lima', 'Lima', 'Santiago de Surco'),
(6, 'client', 'Eduardo Arrieta', 'eduardo@hostalesperu.com', '985544332', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Lima', 'Lima', 'Miraflores'),
(7, 'client', 'Vanessa Choy', 'vanessa.choy@correo.pe', '977665544', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Lima', 'Lima', 'San Isidro'),
(8, 'client', 'Roberto Alvarado', 'r.alvarado@correo.pe', '966554433', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Lima', 'Lima', 'San Borja');

-- Perfiles públicos de técnicos (especialistas) asociados a sus usuarios
INSERT INTO tecnicos (id_usuario, id_oficio, especialidad, ciudad, provincia, distrito, descripcion, tags, imagen, valoracion, resenas, online) VALUES
(1, 1, 'Electricista', 'Lima', 'Lima', 'San Miguel', 'Ingeniero Técnico Electricista con más de 12 años de trayectoria. Especializado en tendidos eléctricos internos, balance de cargas e instalación de redes pozo a tierra.', 'Instalaciones, Urgencias, Pozo a Tierra', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600', 5.0, 142, 1),
(2, 2, 'Gasfitería Sanitaria', 'Lima', 'Lima', 'Miraflores', 'Técnica certificada de SENCICO. Experta en detección ultrasónica de fugas de agua invisibles, reparación de tuberías de alta presión y mantenimiento general de griferías.', 'Detector Fugas, SENCICO, Grifería Premium', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=600', 4.9, 98, 1),
(3, 3, 'Carpintería & Melamina', 'Arequipa', 'Arequipa', 'Yanahuara', 'Ebanista artesanal y armador de muebles modulares en melamina. Estructuras sólidas a medida, instalación de bisagras hidráulicas y reparación de estructuras de madera fina.', 'Melamina, Diseño a Medida, Ebanistería', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600', 4.8, 76, 1),
(4, 4, 'Pintura e Interiores', 'Lima', 'Lima', 'La Molina', 'Servicios premium de pintura interior y exterior. Aplicación de estuco veneciano, texturados decorativos y tratamiento antihumedad en paredes y techos.', 'Pintura Látex, Estuco Veneciano, Impermeabilización', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600', 4.9, 112, 1),
(5, 5, 'Soporte Línea Blanca', 'Lima', 'Lima', 'Santiago de Surco', 'Mantenimiento y reparación de refrigeradoras, cocinas industriales y lavadoras multimarca con repuestos originales.', 'Electrodomésticos, Línea Blanca, Repuestos', 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=600', 4.7, 84, 0);

-- Servicios concretos publicados por los técnicos (catálogo de tarifas)
INSERT INTO servicios (id_tecnico, titulo, descripcion, precio_base, duracion_estimada) VALUES
(1, 'Instalación de pozo a tierra residencial', 'Incluye varilla de cobre, tratamiento del terreno y certificado de medición.', 480.00, '1 día'),
(1, 'Cambio integral de tablero eléctrico', 'Tablero nuevo con llaves termomagnéticas y diferencial.', 650.00, '6 horas'),
(2, 'Detección ultrasónica de fugas invisibles', 'Sin romper pared, ubicación exacta con equipo profesional.', 220.00, '2 horas'),
(2, 'Cambio completo de grifería de baño', 'Incluye mano de obra y retiro de la grifería antigua.', 180.00, '2 horas'),
(3, 'Mueble de melamina a medida (closet 1.8 m)', 'Estructura de 18 mm, bisagras hidráulicas e instalación.', 950.00, '3 días'),
(4, 'Pintura látex de departamento (60 m²)', 'Dos manos, imprimante incluido, traslado de muebles.', 850.00, '2 días'),
(5, 'Mantenimiento de refrigeradora', 'Limpieza interna, recarga de gas si es necesario y diagnóstico.', 150.00, '1 hora');

-- Reseñas reales de clientes hacia técnicos (sincronizadas con la home)
INSERT INTO resenas (id_tecnico, id_cliente, calificacion, comentario) VALUES
(1, 6, 5, 'Contratamos a Pedro para reformar todo el tablero eléctrico de nuestro hostal en Miraflores. Impecable servicio, transparente y con factura electrónica.'),
(2, 7, 5, 'Sofía resolvió en tiempo récord una filtración que amenazaba con dañar el departamento de abajo. Su honestidad y uso de tecnología ultrasónica me ahorró picar la pared.'),
(3, 8, 5, 'El carpintero Marcos armó y fijó todos los organizadores empotrados de mi oficina. Acabado fino y trato profesional. Definitivamente volveré a buscar técnicos por aquí.'),
(4, 7, 5, 'Luciana dejó como nuevo el departamento, su acabado en estuco veneciano es de otro nivel.'),
(2, 8, 4, 'Excelente diagnóstico, recomendado para emergencias de gasfitería.');
