-- Datos ficticios para desarrollo. Ejecutar después de schema.sql en una base vacía.
SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

INSERT INTO categories (name, description, color, icon)
VALUES
    ('Evacuación', 'Salidas de emergencia, señalización y puntos de reunión.', '#2E7D32', 'exit_to_app'),
    ('Rutas de circulación', 'Pasillos, escaleras y accesos peatonales.', '#1565C0', 'directions_walk'),
    ('Equipo contra incendio', 'Extintores, mangueras y gabinetes contra incendio.', '#C62828', 'fire_extinguisher'),
    ('Seguridad', 'Riesgos en instalaciones y medidas de protección.', '#EF6C00', 'shield'),
    ('Informativa', 'Avisos, directorios y señalización de orientación.', '#546E7A', 'info');

INSERT INTO users (name, email, password_hash, role)
VALUES
    ('Operador Demo 1', 'operador1@example.com',
     '$2y$12$m6.VQbQNOZTHedo72mDzXOq3404WVrI0Z9osdN2H6uzdDZAi4QIhG', 'operador'),
    ('Operador Demo 2', 'operador2@example.com',
     '$2y$12$xfqiyb54WTJhG1XFxvMioeJ1CbU/PHSWLEmEVO/7o2bJgwZ0M2tJG', 'operador'),
    ('Usuario Demo', 'usuario@example.com',
     '$2y$12$JxIsMIJEQSYysqMJOwIP6OI61TwHBnYDJzKQBN3KQoMcZ2JHwAcqi', 'usuario');

SET @usuario = (SELECT id FROM users WHERE email = 'usuario@example.com');
SET @operador1 = (SELECT id FROM users WHERE email = 'operador1@example.com');
SET @operador2 = (SELECT id FROM users WHERE email = 'operador2@example.com');
SET @evacuacion = (SELECT id FROM categories WHERE name = 'Evacuación');
SET @circulacion = (SELECT id FROM categories WHERE name = 'Rutas de circulación');
SET @incendio = (SELECT id FROM categories WHERE name = 'Equipo contra incendio');
SET @seguridad = (SELECT id FROM categories WHERE name = 'Seguridad');
SET @informativa = (SELECT id FROM categories WHERE name = 'Informativa');

-- Coordenadas aproximadas dentro de Ciudad Universitaria (UAA), ficticias para la demo.
INSERT INTO inspections (
    folio, title, description, category_id, created_by, assigned_to,
    status, priority, building, area, latitude, longitude, review_result, final_condition,
    created_at, assigned_at, started_at, finished_at, cancelled_at, updated_at
)
VALUES
    ('SIG-2026-00001', 'Señal de salida poco visible', 'Un cartel cubre parte de la señal de salida.',
     @evacuacion, @usuario, NULL, 'pendiente', 'media', 'Biblioteca Central', 'Planta baja', 21.9133100, -102.3157400,
     NULL, NULL, '2026-11-10 15:00:00', NULL, NULL, NULL, NULL, '2026-11-10 15:00:00'),
    ('SIG-2026-00002', 'Obstáculo en pasillo', 'Unas cajas reducen el ancho del paso.',
     @circulacion, @usuario, @operador1, 'asignada', 'media', 'Biblioteca Central', 'Pasillo principal', 21.9134200, -102.3158900,
     NULL, NULL, '2026-11-10 15:10:00', '2026-11-10 15:30:00', NULL, NULL, NULL, '2026-11-10 15:30:00'),
    ('SIG-2026-00003', 'Gabinete de extintor dañado', 'La puerta del gabinete se atora al abrir.',
     @incendio, @usuario, @operador2, 'en_proceso', 'alta', 'Edificio de aulas', 'Planta baja', 21.9127600, -102.3169800,
     NULL, NULL, '2026-11-10 16:00:00', '2026-11-10 16:20:00', '2026-11-10 16:40:00', NULL, NULL, '2026-11-10 16:40:00'),
    ('SIG-2026-00004', 'Luminaria apagada en acceso', 'La luminaria del acceso peatonal no enciende.',
     @seguridad, @usuario, @operador1, 'finalizada', 'alta', 'Gimnasio Universitario', 'Acceso peatonal', 21.9150300, -102.3184600,
     'Se sustituyó la luminaria y se verificó su funcionamiento.', 'reemplazada',
     '2026-11-10 17:00:00', '2026-11-10 17:15:00', '2026-11-10 17:45:00', '2026-11-10 18:30:00', NULL, '2026-11-10 18:30:00'),
    ('SIG-2026-00005', 'Directorio desactualizado', 'El directorio señala una ubicación anterior.',
     @informativa, @usuario, NULL, 'cancelada', 'baja', 'Edificio de Rectoría', 'Vestíbulo', 21.9140500, -102.3149700,
     NULL, NULL, '2026-11-11 15:00:00', NULL, NULL, NULL, '2026-11-11 15:25:00', '2026-11-11 15:25:00'),
    ('SIG-2026-00006', 'Señal de punto de reunión deteriorada', 'El texto de la señal perdió contraste.',
     @evacuacion, @usuario, @operador2, 'cancelada', 'media', 'Edificio de aulas', 'Patio exterior', 21.9125900, -102.3172300,
     NULL, NULL, '2026-11-11 16:00:00', '2026-11-11 16:20:00', NULL, NULL, '2026-11-11 16:50:00', '2026-11-11 16:50:00');

SET @i1 = (SELECT id FROM inspections WHERE folio = 'SIG-2026-00001');
SET @i2 = (SELECT id FROM inspections WHERE folio = 'SIG-2026-00002');
SET @i3 = (SELECT id FROM inspections WHERE folio = 'SIG-2026-00003');
SET @i4 = (SELECT id FROM inspections WHERE folio = 'SIG-2026-00004');
SET @i5 = (SELECT id FROM inspections WHERE folio = 'SIG-2026-00005');
SET @i6 = (SELECT id FROM inspections WHERE folio = 'SIG-2026-00006');

-- Rutas ficticias. Los archivos se suben durante la demo.
INSERT INTO evidences (
    inspection_id, uploaded_by, type, file_path, original_name, mime_type,
    size_bytes, description, created_at
)
VALUES
    (@i1, @usuario, 'foto', '/uploads/demo/senal-salida.jpg', 'senal-salida.jpg',
     'image/jpeg', 146820, 'Vista de la señal parcialmente cubierta.', '2026-11-10 15:00:00'),
    (@i3, @operador2, 'foto', '/uploads/demo/gabinete.jpg', 'gabinete.jpg',
     'image/jpeg', 183514, 'Detalle de la puerta del gabinete.', '2026-11-10 16:40:00'),
    (@i4, @operador1, 'documento', '/uploads/demo/revision-luminaria.pdf', 'revision-luminaria.pdf',
     'application/pdf', 48192, 'Registro de la revisión de la luminaria.', '2026-11-10 18:15:00');

INSERT INTO inspection_history (
    inspection_id, changed_by, action, previous_status, new_status, comment, created_at
)
VALUES
    (@i1, @usuario, 'creacion', NULL, 'pendiente', 'Reporte inicial.', '2026-11-10 15:00:00'),
    (@i1, @usuario, 'evidencia', NULL, NULL, 'Se adjuntó una foto de la señal.', '2026-11-10 15:00:00'),
    (@i2, @usuario, 'creacion', NULL, 'pendiente', 'Reporte inicial.', '2026-11-10 15:10:00'),
    (@i2, @operador1, 'asignacion', 'pendiente', 'asignada', 'El operador tomó el reporte.', '2026-11-10 15:30:00'),
    (@i3, @usuario, 'creacion', NULL, 'pendiente', 'Reporte inicial.', '2026-11-10 16:00:00'),
    (@i3, @operador2, 'asignacion', 'pendiente', 'asignada', 'El operador tomó el reporte.', '2026-11-10 16:20:00'),
    (@i3, @operador2, 'cambio_estado', 'asignada', 'en_proceso', 'Comenzó la revisión del gabinete.', '2026-11-10 16:40:00'),
    (@i3, @operador2, 'evidencia', NULL, NULL, 'Se adjuntó una foto del gabinete.', '2026-11-10 16:40:00'),
    (@i4, @usuario, 'creacion', NULL, 'pendiente', 'Reporte inicial.', '2026-11-10 17:00:00'),
    (@i4, @operador1, 'asignacion', 'pendiente', 'asignada', 'El operador tomó el reporte.', '2026-11-10 17:15:00'),
    (@i4, @operador1, 'cambio_estado', 'asignada', 'en_proceso', 'Comenzó la revisión de la luminaria.', '2026-11-10 17:45:00'),
    (@i4, @operador1, 'evidencia', NULL, NULL, 'Se adjuntó el registro de revisión.', '2026-11-10 18:15:00'),
    (@i4, @operador1, 'finalizacion', 'en_proceso', 'finalizada', 'Se verificó la luminaria nueva.', '2026-11-10 18:30:00'),
    (@i5, @usuario, 'creacion', NULL, 'pendiente', 'Reporte inicial.', '2026-11-11 15:00:00'),
    (@i5, @usuario, 'cancelacion', 'pendiente', 'cancelada', 'El usuario detectó un reporte duplicado.', '2026-11-11 15:25:00'),
    (@i6, @usuario, 'creacion', NULL, 'pendiente', 'Reporte inicial.', '2026-11-11 16:00:00'),
    (@i6, @operador2, 'asignacion', 'pendiente', 'asignada', 'El operador tomó el reporte.', '2026-11-11 16:20:00'),
    (@i6, @operador2, 'cancelacion', 'asignada', 'cancelada', 'El operador confirmó que el reporte ya estaba registrado.', '2026-11-11 16:50:00');

COMMIT;
