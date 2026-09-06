import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.code, c.type, c.status, c.ship_id,
             s.name AS ship_name, c.created_at
      FROM containers c
      LEFT JOIN ships s ON s.id = c.ship_id
      ORDER BY c.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible cargar los contenedores." });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { code, type = "Estándar", status = "En patio", shipId = null } = req.body || {};
    if (!code?.trim()) {
      return res.status(400).json({ error: "El código del contenedor es obligatorio." });
    }

    const result = await pool.query(`
      INSERT INTO containers (code, type, status, ship_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, code, type, status, ship_id, created_at
    `, [code.trim().toUpperCase(), type, status, shipId || null]);

    const created = result.rows[0];
    const full = await pool.query(`
      SELECT c.id, c.code, c.type, c.status, c.ship_id,
             s.name AS ship_name, c.created_at
      FROM containers c
      LEFT JOIN ships s ON s.id = c.ship_id
      WHERE c.id = $1
    `, [created.id]);

    res.status(201).json(full.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(409).json({ error: "Ya existe un contenedor con ese código." });
    }
    res.status(500).json({ error: "No fue posible registrar el contenedor." });
  }
});

export default router;
