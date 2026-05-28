-- ============================================================================
-- fix_fotos_tecnicos.sql - SCRIPT OPCIONAL de mantenimiento.
-- Corrige URLs de imagen donde el nombre del técnico y la foto no coincidían.
--
-- Ejecutar en phpMyAdmin sobre oficios_peru DESPUÉS de:
--   1) schema.sql  y  2) seed_tecnicos_norte.sql
-- ============================================================================

USE oficios_peru;

-- Renzo Aguilar (hombre, pintor): foto de trabajador/pintor
UPDATE tecnicos t
INNER JOIN usuarios u ON t.id_usuario = u.id
SET t.imagen = 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600'
WHERE u.email = 'renzo.aguilar@oficiosperu.pe';

-- Milagros Torres (mujer, pintora): retrato profesional femenino
UPDATE tecnicos t
INNER JOIN usuarios u ON t.id_usuario = u.id
SET t.imagen = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600'
WHERE u.email = 'milagros.torres@oficiosperu.pe';

-- Rosa Huamán (mujer, línea blanca): técnica en entorno de servicio
UPDATE tecnicos t
INNER JOIN usuarios u ON t.id_usuario = u.id
SET t.imagen = 'https://images.unsplash.com/photo-1631545806606-4115c4a3c0a8?auto=format&fit=crop&q=80&w=600'
WHERE u.email = 'rosa.huaman@oficiosperu.pe';
