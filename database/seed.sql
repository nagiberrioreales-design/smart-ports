-- Datos iniciales de Smart Ports v0.4

INSERT INTO cranes (code, status)
SELECT 'GRUA-' || LPAD(n::text, 2, '0'),
       CASE WHEN n <= 18 THEN 'Activa' ELSE 'Mantenimiento' END
FROM generate_series(1, 22) AS n
ON CONFLICT (code) DO NOTHING;

INSERT INTO yards (name, capacity, occupied)
VALUES
('Patio A', 12000, 8520),
('Patio B', 9000, 7560),
('Patio C', 8000, 4960)
ON CONFLICT (name) DO NOTHING;

INSERT INTO alerts (level, message, active)
SELECT 'warning', 'Mantenimiento programado · Grúa 15', TRUE
WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE message = 'Mantenimiento programado · Grúa 15');

INSERT INTO alerts (level, message, active)
SELECT 'danger', 'Patio B en 84% de ocupación', TRUE
WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE message = 'Patio B en 84% de ocupación');

INSERT INTO alerts (level, message, active)
SELECT 'success', 'Despacho TCJU 456789 completado', TRUE
WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE message = 'Despacho TCJU 456789 completado');

INSERT INTO containers (code, type, status, ship_id)
SELECT 'TCNU-001001', 'Estándar', 'En patio', (SELECT id FROM ships ORDER BY id LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM containers WHERE code='TCNU-001001');

INSERT INTO containers (code, type, status, ship_id)
SELECT 'MSCU-002145', 'Refrigerado', 'En descarga', (SELECT id FROM ships ORDER BY id OFFSET 1 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM containers WHERE code='MSCU-002145');

INSERT INTO containers (code, type, status, ship_id)
SELECT 'CMAU-003821', 'Peligroso', 'En inspección', (SELECT id FROM ships ORDER BY id OFFSET 2 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM containers WHERE code='CMAU-003821');

INSERT INTO containers (code, type, status, ship_id)
SELECT 'OOLU-004512', 'Estándar', 'Despachado', (SELECT id FROM ships ORDER BY id OFFSET 3 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM containers WHERE code='OOLU-004512');

INSERT INTO containers (code, type, status, ship_id)
SELECT 'TGHU-005873', 'Sobredimensionado', 'En patio', NULL
WHERE NOT EXISTS (SELECT 1 FROM containers WHERE code='TGHU-005873');


INSERT INTO docks (code, status, max_containers)
VALUES
('A1','Disponible',1800),('A2','Disponible',1600),('A3','Disponible',1500),('A4','Disponible',1400),
('B1','Disponible',1800),('B2','Disponible',1700),('B3','Disponible',1500),('B4','Disponible',1400),
('C1','Disponible',1600),('C2','Disponible',1500),('C3','Disponible',1400)
ON CONFLICT (code) DO NOTHING;


-- Notificaciones iniciales v0.6
INSERT INTO notifications (level, title, message, is_read)
SELECT 'info', 'Smart Ports v0.6', 'Centro de notificaciones y auditoría habilitados.', FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM notifications
  WHERE title = 'Smart Ports v0.6'
);

INSERT INTO notifications (level, title, message, is_read)
SELECT 'success', 'Base de datos conectada', 'PostgreSQL está almacenando los cambios operativos del sistema.', FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM notifications
  WHERE title = 'Base de datos conectada'
);
