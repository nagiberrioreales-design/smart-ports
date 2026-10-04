import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { evaluateCongestion } from "../domain/congestion.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, level, message, active, created_at
      FROM alerts
      ORDER BY active DESC, id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible cargar las alertas." });
  }
});

router.post("/congestion/check", requireAuth, async (req, res) => {
  try {
    const evaluation = evaluateCongestion(req.body || {});

    if (!evaluation.valid) {
      return res.status(400).json({
        error: "Datos de congestión no válidos.",
        fields: evaluation.errors
      });
    }

    const { zone, currentLevel, threshold, congested, level, message } = evaluation;
    const prefix = `[CONGESTION] Zona=${zone};`;

    if (congested) {
      const existing = await pool.query(
        `SELECT id, level, message, active, created_at
         FROM alerts
         WHERE active=TRUE AND message LIKE $1
         ORDER BY id DESC
         LIMIT 1`,
        [`${prefix}%`]
      );

      if (existing.rowCount) {
        const updated = await pool.query(
          `UPDATE alerts
           SET level=$1, message=$2
           WHERE id=$3
           RETURNING id, level, message, active, created_at`,
          [level, message, existing.rows[0].id]
        );

        return res.json({
          zone,
          currentLevel,
          threshold,
          congested,
          alert: updated.rows[0]
        });
      }

      const created = await pool.query(
        `INSERT INTO alerts (level, message, active)
         VALUES ($1, $2, TRUE)
         RETURNING id, level, message, active, created_at`,
        [level, message]
      );

      return res.status(201).json({
        zone,
        currentLevel,
        threshold,
        congested,
        alert: created.rows[0]
      });
    }

    const resolved = await pool.query(
      `UPDATE alerts
       SET active=FALSE
       WHERE active=TRUE AND message LIKE $1
       RETURNING id, level, message, active, created_at`,
      [`${prefix}%`]
    );

    return res.json({
      zone,
      currentLevel,
      threshold,
      congested,
      resolved: resolved.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible evaluar la congestión." });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { level = "warning", message } = req.body || {};
    if (!message?.trim()) {
      return res.status(400).json({ error: "El mensaje de la alerta es obligatorio." });
    }
    if (!["warning", "danger", "success"].includes(level)) {
      return res.status(400).json({ error: "Nivel de alerta no válido." });
    }

    const result = await pool.query(`
      INSERT INTO alerts (level, message, active)
      VALUES ($1, $2, TRUE)
      RETURNING id, level, message, active, created_at
    `, [level, message.trim()]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible crear la alerta." });
  }
});

router.patch("/:id/resolve", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE alerts SET active=FALSE WHERE id=$1
      RETURNING id, level, message, active, created_at
    `, [req.params.id]);

    if (!result.rowCount) {
      return res.status(404).json({ error: "Alerta no encontrada." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible resolver la alerta." });
  }
});

export default router;
