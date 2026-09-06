import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

async function buildAnalysis() {
  const [yards, cranes, ships, alerts, docks] = await Promise.all([
    pool.query(`SELECT id,name,capacity,occupied,ROUND((occupied::numeric/capacity::numeric)*100,0)::int AS percentage FROM yards ORDER BY id`),
    pool.query(`SELECT status,COUNT(*)::int AS total FROM cranes GROUP BY status`),
    pool.query(`SELECT id,name,eta,dock,status,containers FROM ships ORDER BY eta`),
    pool.query(`SELECT level,COUNT(*)::int AS total FROM alerts WHERE active=TRUE GROUP BY level`),
    pool.query(`SELECT id,code,status,max_containers FROM docks ORDER BY code`)
  ]);

  const highYards = yards.rows.filter(y => Number(y.percentage) >= 80);
  const waitingShips = ships.rows.filter(s => ["Esperando","En tránsito","Nuevo arribo"].includes(s.status));
  const activeCranes = cranes.rows.find(c => c.status === "Activa")?.total || 0;
  const totalCranes = cranes.rows.reduce((sum, c) => sum + Number(c.total), 0) || 1;
  const cranePercent = Math.round((Number(activeCranes) / totalCranes) * 100);
  const dangerAlerts = alerts.rows.find(a => a.level === "danger")?.total || 0;

  let score = 10;
  score += highYards.length * 22;
  score += Math.min(waitingShips.length * 5, 30);
  score += Math.max(0, 75 - cranePercent) * 0.7;
  score += Number(dangerAlerts) * 8;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const level = score >= 70 ? "Alto" : score >= 40 ? "Medio" : "Bajo";
  const recommendations = [];

  highYards.forEach(y => recommendations.push({
    severity: "Alta",
    title: `Reducir ocupación en ${y.name}`,
    detail: `${y.name} está al ${y.percentage}%. Priorizar despachos o redistribuir carga hacia patios con menor ocupación.`
  }));

  if (cranePercent < 75) recommendations.push({
    severity: "Media",
    title: "Aumentar disponibilidad de grúas",
    detail: `Solo ${cranePercent}% de las grúas están activas. Revisar mantenimientos y priorizar equipos para buques en descarga.`
  });

  if (waitingShips.length >= 3) recommendations.push({
    severity: "Media",
    title: "Reorganizar asignación de muelles",
    detail: `Hay ${waitingShips.length} buques en espera o tránsito. Ejecuta la asignación automática para distribuirlos entre muelles disponibles.`
  });

  if (!recommendations.length) recommendations.push({
    severity: "Baja",
    title: "Operación estable",
    detail: "No se detectan condiciones críticas. Mantener monitoreo de patios, grúas y próximos arribos."
  });

  return { score, level, highYards, waitingShips, cranePercent, recommendations, docks: docks.rows };
}

router.get("/", requireAuth, async (_req, res) => {
  try {
    res.json(await buildAnalysis());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible analizar la operación." });
  }
});

router.post("/assign-docks", requireAuth, async (_req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const docksResult = await client.query(`
      SELECT d.id,d.code,d.max_containers
      FROM docks d
      WHERE d.status='Disponible'
        AND NOT EXISTS (
          SELECT 1 FROM ships s
          WHERE s.dock=d.code AND s.status IN ('En puerto','Descargando')
        )
      ORDER BY d.max_containers DESC,d.code
    `);

    const shipsResult = await client.query(`
      SELECT id,name,eta,dock,status,containers
      FROM ships
      WHERE status IN ('Esperando','En tránsito','Nuevo arribo')
      ORDER BY eta,id
    `);

    const freeDocks = [...docksResult.rows];
    const assignments = [];

    for (const ship of shipsResult.rows) {
      if (!freeDocks.length) break;
      let index = freeDocks.findIndex(d => Number(d.max_containers) >= Number(ship.containers || 0));
      if (index < 0) index = 0;
      const dock = freeDocks.splice(index, 1)[0];
      if (ship.dock !== dock.code) {
        await client.query(`UPDATE ships SET dock=$1 WHERE id=$2`, [dock.code, ship.id]);
        assignments.push({ shipId: ship.id, shipName: ship.name, oldDock: ship.dock, dock: dock.code });
      }
    }

    if (assignments.length) {
      await client.query(
        `INSERT INTO alerts (level,message,active) VALUES ('success',$1,TRUE)`,
        [`Optimización completada: ${assignments.length} asignaciones de muelle actualizadas.`]
      );
    }

    await client.query("COMMIT");
    res.json({ assignments, analysis: await buildAnalysis() });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "No fue posible ejecutar la optimización." });
  } finally {
    client.release();
  }
});

export default router;
