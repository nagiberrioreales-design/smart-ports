import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query("SELECT id, code, status FROM cranes ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible cargar las grúas." });
  }
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = ["Activa", "Mantenimiento"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Estado de grúa no válido." });
    }

    const result = await pool.query(
      "UPDATE cranes SET status=$1 WHERE id=$2 RETURNING id, code, status",
      [status, req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Grúa no encontrada." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible actualizar la grúa." });
  }
});

export default router;
