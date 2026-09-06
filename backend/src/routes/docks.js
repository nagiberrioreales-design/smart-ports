import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.id, d.code, d.status AS base_status, d.max_containers,
             CASE
               WHEN s.id IS NOT NULL THEN 'Ocupado'
               WHEN d.status = 'Mantenimiento' THEN 'Mantenimiento'
               ELSE 'Disponible'
             END AS status,
             s.id AS ship_id,
             s.name AS ship_name
      FROM docks d
      LEFT JOIN LATERAL (
        SELECT id, name
        FROM ships
        WHERE dock = d.code
          AND status IN ('En puerto','Descargando')
        ORDER BY id DESC
        LIMIT 1
      ) s ON TRUE
      ORDER BY d.code
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible cargar los muelles." });
  }
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!["Disponible", "Mantenimiento"].includes(status)) {
      return res.status(400).json({ error: "Estado de muelle no válido." });
    }
    const result = await pool.query(
      `UPDATE docks SET status=$1 WHERE id=$2 RETURNING id, code, status, max_containers`,
      [status, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Muelle no encontrado." });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible actualizar el muelle." });
  }
});

export default router;
