import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const shipsResult = await pool.query(
      `SELECT id, name, eta, dock, status, containers
       FROM ships
       ORDER BY id DESC`
    );

    const activeCranes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM cranes WHERE status = 'Activa'`
    );

    const yards = await pool.query(
      `SELECT id, name, capacity, occupied,
              ROUND((occupied::numeric / capacity::numeric) * 100, 0)::int AS percentage
       FROM yards
       ORDER BY id`
    );

    const containerRecords = await pool.query(`SELECT COUNT(*)::int AS total FROM containers`);

    const alerts = await pool.query(
      `SELECT id, level, message, created_at
       FROM alerts
       WHERE active = TRUE
       ORDER BY id DESC
       LIMIT 5`
    );

    const ships = shipsResult.rows;
    const containerTotal = ships.reduce((sum, ship) => sum + Number(ship.containers || 0), 0);
    const avgYard = yards.rowCount
      ? Math.round(yards.rows.reduce((sum, y) => sum + Number(y.percentage), 0) / yards.rowCount)
      : 0;

    res.json({
      metrics: {
        shipsInPort: ships.length,
        containers: containerTotal,
        activeCranes: activeCranes.rows[0]?.total || 0,
        movementsToday: 512,
        averageDispatchHours: 1.8,
        yardOccupancy: avgYard,
        containerRecords: containerRecords.rows[0]?.total || 0
      },
      arrivals: [...ships]
        .sort((a, b) => a.eta.localeCompare(b.eta))
        .slice(0, 5),
      alerts: alerts.rows,
      yards: yards.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible cargar el dashboard." });
  }
});

export default router;
