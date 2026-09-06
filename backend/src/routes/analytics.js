import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const [shipStatus, containerTypes, containerStatus, craneStatus, yards, alerts] = await Promise.all([
      pool.query(`SELECT status AS label, COUNT(*)::int AS value FROM ships GROUP BY status ORDER BY value DESC`),
      pool.query(`SELECT type AS label, COUNT(*)::int AS value FROM containers GROUP BY type ORDER BY value DESC`),
      pool.query(`SELECT status AS label, COUNT(*)::int AS value FROM containers GROUP BY status ORDER BY value DESC`),
      pool.query(`SELECT status AS label, COUNT(*)::int AS value FROM cranes GROUP BY status ORDER BY value DESC`),
      pool.query(`SELECT name, capacity, occupied, ROUND((occupied::numeric/capacity::numeric)*100,0)::int AS percentage FROM yards ORDER BY id`),
      pool.query(`SELECT COUNT(*)::int AS total FROM alerts WHERE active=TRUE`)
    ]);

    const totalShips = shipStatus.rows.reduce((s, r) => s + Number(r.value), 0);
    const totalContainers = containerTypes.rows.reduce((s, r) => s + Number(r.value), 0);
    const avgYard = yards.rowCount
      ? Math.round(yards.rows.reduce((s, r) => s + Number(r.percentage), 0) / yards.rowCount)
      : 0;

    res.json({
      summary: {
        totalShips,
        containerRecords: totalContainers,
        activeAlerts: alerts.rows[0]?.total || 0,
        averageYardOccupancy: avgYard
      },
      shipStatus: shipStatus.rows,
      containerTypes: containerTypes.rows,
      containerStatus: containerStatus.rows,
      craneStatus: craneStatus.rows,
      yards: yards.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible cargar la analítica." });
  }
});

export default router;
