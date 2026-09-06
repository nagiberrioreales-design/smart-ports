import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, level, title, message, is_read, created_at
      FROM notifications
      ORDER BY id DESC
      LIMIT 80
    `);

    const unread = result.rows.filter(item => !item.is_read).length;
    res.json({ unread, items: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible cargar las notificaciones." });
  }
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
      RETURNING id, level, title, message, is_read, created_at
    `, [req.params.id]);

    if (!result.rowCount) {
      return res.status(404).json({ error: "Notificación no encontrada." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible actualizar la notificación." });
  }
});

router.patch("/read-all", requireAuth, async (_req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE");
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible marcar las notificaciones." });
  }
});

export default router;
