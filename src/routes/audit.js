import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const requested = Number(req.query.limit || 100);
    const limit = Math.min(Math.max(requested, 1), 300);

    const result = await pool.query(`
      SELECT a.id, a.action, a.entity_type, a.entity_id, a.details,
             a.created_at, u.name AS user_name, u.email AS user_email
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.id DESC
      LIMIT $1
    `, [limit]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible cargar el historial de auditoría." });
  }
});

export default router;
