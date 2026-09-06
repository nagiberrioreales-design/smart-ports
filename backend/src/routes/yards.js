import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, capacity, occupied,
             ROUND((occupied::numeric / capacity::numeric) * 100, 0)::int AS percentage
      FROM yards
      ORDER BY id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible cargar los patios." });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const occupied = Number(req.body?.occupied);
    if (!Number.isFinite(occupied) || occupied < 0) {
      return res.status(400).json({ error: "La ocupación debe ser un número válido." });
    }

    const current = await pool.query("SELECT capacity FROM yards WHERE id=$1", [req.params.id]);
    if (!current.rowCount) {
      return res.status(404).json({ error: "Patio no encontrado." });
    }
    if (occupied > current.rows[0].capacity) {
      return res.status(400).json({ error: "La ocupación no puede superar la capacidad." });
    }

    const result = await pool.query(`
      UPDATE yards SET occupied=$1 WHERE id=$2
      RETURNING id, name, capacity, occupied,
        ROUND((occupied::numeric / capacity::numeric) * 100, 0)::int AS percentage
    `, [occupied, req.params.id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible actualizar el patio." });
  }
});

export default router;
