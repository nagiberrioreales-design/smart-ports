import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validateShipArrival } from "../domain/ship-arrival.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, eta, dock, status, containers, created_at
       FROM ships
       ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible cargar los buques." });
  }
});

async function assignFreeDock(client, containers = 0) {
  const result = await client.query(`
    SELECT d.code,d.max_containers
    FROM docks d
    WHERE d.status='Disponible'
      AND NOT EXISTS (
        SELECT 1 FROM ships s
        WHERE s.dock=d.code AND s.status IN ('En puerto','Descargando')
      )
    ORDER BY CASE WHEN d.max_containers >= $1 THEN 0 ELSE 1 END,
             d.max_containers ASC,
             d.code
    LIMIT 1
  `, [Number(containers) || 0]);
  return result.rows[0]?.code || null;
}

router.post("/", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const validation = validateShipArrival(req.body || {});

    if (!validation.valid) {
      return res.status(400).json({
        error: "Faltan campos obligatorios.",
        fields: validation.missingFields
      });
    }

    const { name, eta, dock, status, containers } = validation.data;

    await client.query("BEGIN");
    let selectedDock = dock;
    let autoAssigned = false;

    if (dock === "AUTO") {
      selectedDock = await assignFreeDock(client, containers);
      if (!selectedDock) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "No hay muelles disponibles para asignación automática." });
      }
      autoAssigned = true;
    }

    const result = await client.query(
      `INSERT INTO ships (name, eta, dock, status, containers)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, eta, dock, status, containers, created_at`,
      [name, eta, selectedDock, status, containers]
    );

    if (autoAssigned) {
      await client.query(
        `INSERT INTO alerts (level,message,active) VALUES ('success',$1,TRUE)`,
        [`${name} fue asignado automáticamente al muelle ${selectedDock}.`]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ ...result.rows[0], autoAssigned });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "No fue posible registrar el buque." });
  } finally {
    client.release();
  }
});

export default router;
