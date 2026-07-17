-- ============================================================================
-- seed_tecnicos_norte.sql - DATOS OPCIONALES (extra demo).
-- 15 técnicos para Casma, Chimbote, Nuevo Chimbote, Santa, Huaraz y Trujillo.
--
-- Orden de ejecución en phpMyAdmin (base oficios_peru):
--   1) schema.sql           (obligatorio: crea tablas + datos base)
--   2) seed_tecnicos_norte.sql   (este archivo, opcional)
--   3) fix_fotos_tecnicos.sql    (opcional: ajusta algunas fotos)
--
-- Contraseña de todos los usuarios tech: 12345678
-- ============================================================================

USE oficios_peru;

-- Usuarios técnicos (IDs 9-23)
INSERT INTO usuarios (id, rol, nombre, email, celular, password_hash, departamento, provincia, distrito) VALUES
(9,  'tech', 'Enrique Salazar Vega',      'enrique.salazar@oficiosperu.pe',   '943112233', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Áncash', 'Santa', 'Chimbote'),
(10, 'tech', 'Anderson Ruiz Palacios',    'anderson.ruiz@oficiosperu.pe',       '944223344', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Áncash', 'Santa', 'Chimbote'),
(11, 'tech', 'Milagros Torres Díaz',      'milagros.torres@oficiosperu.pe',   '945334455', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Áncash', 'Santa', 'Chimbote'),
(12, 'tech', 'Jorge Mendoza Carranza',    'jorge.mendoza@oficiosperu.pe',     '946445566', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Áncash', 'Santa', 'Nuevo Chimbote'),
(13, 'tech', 'Rosa Huamán Delgado',       'rosa.huaman@oficiosperu.pe',       '947556677', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Áncash', 'Santa', 'Nuevo Chimbote'),
(14, 'tech', 'Carlos Inga Ramírez',       'carlos.inga@oficiosperu.pe',       '948667788', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Áncash', 'Santa', 'Nuevo Chimbote'),
(15, 'tech', 'Luis Prado Castillo',       'luis.prado@oficiosperu.pe',        '949778899', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Áncash', 'Casma', 'Casma'),
(16, 'tech', 'Patricia Loayza Yactayo',   'patricia.loayza@oficiosperu.pe',   '950889900', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Áncash', 'Casma', 'Casma'),
(17, 'tech', 'Renzo Aguilar Cáceres',     'renzo.aguilar@oficiosperu.pe',     '951990011', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Áncash', 'Santa', 'Santa'),
(18, 'tech', 'Karla Ramírez Inca',        'karla.ramirez@oficiosperu.pe',     '952101122', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Áncash', 'Santa', 'Santa'),
(19, 'tech', 'Esteban Rivera Núñez',      'esteban.rivera@oficiosperu.pe',    '953212233', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Áncash', 'Huaraz', 'Huaraz'),
(20, 'tech', 'Manuel Cerrón Vega',        'manuel.cerron@oficiosperu.pe',     '954323344', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'Áncash', 'Huaraz', 'Huaraz'),
(21, 'tech', 'Julio Tinoco Aliaga',       'julio.tinoco@oficiosperu.pe',      '955434455', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'La Libertad', 'Trujillo', 'Trujillo'),
(22, 'tech', 'Sofía Pacheco Cama',        'sofia.pacheco@oficiosperu.pe',     '956545566', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'La Libertad', 'Trujillo', 'Trujillo'),
(23, 'tech', 'Diego Vargas Llamoja',      'diego.vargas@oficiosperu.pe',      '957656677', '$2y$10$bm2sHULfqHLsbm.7GUr14.vCiuxxdVUBWmL4MX/A7MJU0LyLTYok.', 'La Libertad', 'Trujillo', 'El Porvenir');

-- Perfiles públicos de técnicos
INSERT INTO tecnicos (id_usuario, id_oficio, especialidad, ciudad, provincia, distrito, descripcion, tags, imagen, valoracion, resenas, online) VALUES
(9,  1, 'Electricista Residencial', 'Chimbote', 'Santa', 'Centro', 'Electricista certificado con 11 años en instalaciones domiciliarias, tableros y pozo a tierra en Chimbote y Nuevo Chimbote.', 'Instalaciones, Tableros, Urgencias', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=600', 4.9, 87, 1),
(10, 2, 'Gasfitero Sanitario', 'Chimbote', 'Santa', 'José Gálvez', 'Gasfitero especializado en fugas, cambio de tuberías PVC y mantenimiento de cisternas en edificios y viviendas del puerto.', 'Fugas, PVC, Cisternas', 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&q=80&w=600', 4.8, 64, 1),
(11, 4, 'Pintor Profesional', 'Chimbote', 'Santa', 'El Chimbador', 'Pintor de interiores y exteriores con acabados látex, esmalte y tratamiento antihumedad para viviendas frente al mar.', 'Látex, Antihumedad, Exteriores', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600', 4.7, 52, 0),
(12, 8, 'Técnico de PCs', 'Nuevo Chimbote', 'Santa', 'Centro', 'Soporte técnico de computadoras y laptops: formateo, limpieza, cambio de disco SSD y recuperación de datos.', 'Laptops, Formateo, SSD', 'https://images.unsplash.com/photo-1597872200969-2b65d5655a70?auto=format&fit=crop&q=80&w=600', 4.9, 118, 1),
(13, 5, 'Soporte Línea Blanca', 'Nuevo Chimbote', 'Santa', 'Villa Marina', 'Reparación de refrigeradoras, lavadoras y cocinas. Diagnóstico multimarca con repuestos originales y garantía.', 'Refrigeradoras, Lavadoras, Repuestos', 'https://images.unsplash.com/photo-1631545806606-4115c4a3c0a8?auto=format&fit=crop&q=80&w=600', 4.8, 73, 1),
(14, 3, 'Carpintero de Melamina', 'Nuevo Chimbote', 'Santa', 'Los Cedros', 'Fabricación e instalación de closets, cocinas y muebles modulares en melamina con bisagras hidráulicas.', 'Melamina, Closets, Cocinas', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600', 4.6, 41, 1),
(15, 1, 'Electricista Industrial', 'Casma', 'Casma', 'Centro', 'Instalaciones eléctricas trifásicas para talleres pesqueros y viviendas. Mantenimiento de tableros y alumbrado público.', 'Trifásico, Industrial, Tableros', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600', 4.9, 95, 1),
(16, 2, 'Gasfitero de Urgencias', 'Casma', 'Casma', 'San Pedro', 'Atención 24 horas para roturas de tubería, destape de desagües y instalación de termos solares en Casma.', 'Urgencias 24h, Desagües, Termos', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=600', 4.8, 58, 0),
(17, 4, 'Pintor Decorativo', 'Santa', 'Santa', 'Centro', 'Acabados decorativos, estuco veneciano y pintura látex para departamentos y locales comerciales en Santa.', 'Estuco Veneciano, Decoración, Látex', 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600', 4.9, 67, 1),
(18, 5, 'Técnico Línea Blanca', 'Santa', 'Santa', 'Nuevo Santa', 'Mantenimiento de equipos de cocina y lavado. Recarga de gas para refrigeradoras y cambio de resistencias.', 'Cocinas, Lavadoras, Recarga Gas', 'https://images.unsplash.com/photo-1631545806606-4115c4a3c0a8?auto=format&fit=crop&q=80&w=600', 4.7, 49, 1),
(19, 8, 'Soporte Informático', 'Huaraz', 'Huaraz', 'Centro', 'Reparación de PCs, instalación de redes WiFi y soporte remoto para oficinas y negocios en Huaraz.', 'Redes WiFi, Hardware, Soporte', 'https://images.unsplash.com/photo-1558002038-1051097df827?auto=format&fit=crop&q=80&w=600', 5.0, 134, 1),
(20, 6, 'Cerrajero 24 Horas', 'Huaraz', 'Huaraz', 'Independencia', 'Apertura de puertas, duplicado de llaves e instalación de cerraduras de seguridad en Huaraz y alrededores.', 'Apertura 24h, Chapas, Seguridad', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600', 4.6, 38, 0),
(21, 7, 'Albañil Maestro', 'Trujillo', 'Trujillo', 'Centro', 'Construcción de muros, losas, tarrajeos y ampliaciones. Experiencia en obras residenciales en Trujillo.', 'Construcción, Tarrajeo, Losas', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600', 4.8, 76, 1),
(22, 1, 'Electricista Domiciliario', 'Trujillo', 'Trujillo', 'La Esperanza', 'Instalaciones eléctricas residenciales, cambio de tomacorrientes, luminarias LED y pozo a tierra.', 'LED, Tomacorrientes, Pozo a Tierra', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=600', 4.9, 102, 1),
(23, 2, 'Gasfitero Domiciliario', 'Trujillo', 'Trujillo', 'El Porvenir', 'Reparación de griferías, instalación de sanitarios y detección de fugas en departamentos y condominios.', 'Grifería, Sanitarios, Fugas', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=600', 4.7, 55, 1);
