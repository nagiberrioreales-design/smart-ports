import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(headers, rows) {
  return [headers.map(csvCell).join(","), ...rows.map(row => row.map(csvCell).join(","))].join("\r\n");
}

router.get("/:type.csv", requireAuth, async (req, res) => {
  try {
    const type = req.params.type;
    let filename = `smart-ports-${type}.csv`;
    let csv;

    if (type === "ships") {
      const r = await pool.query(`SELECT id,name,eta,dock,status,containers,created_at FROM ships ORDER BY id DESC`);
      csv = toCsv(["ID","Buque","ETA","Muelle","Estado","Contenedores","Creado"], r.rows.map(x => [x.id,x.name,x.eta,x.dock,x.status,x.containers,x.created_at]));
    } else if (type === "containers") {
      const r = await pool.query(`SELECT c.id,c.code,c.type,c.status,COALESCE(s.name,'Sin asignar') ship_name,c.created_at FROM containers c LEFT JOIN ships s ON s.id=c.ship_id ORDER BY c.id DESC`);
      csv = toCsv(["ID","Código","Tipo","Estado","Buque","Creado"], r.rows.map(x => [x.id,x.code,x.type,x.status,x.ship_name,x.created_at]));
    } else if (type === "cranes") {
      const r = await pool.query(`SELECT id,code,status FROM cranes ORDER BY id`);
      csv = toCsv(["ID","Grúa","Estado"], r.rows.map(x => [x.id,x.code,x.status]));
    } else if (type === "yards") {
      const r = await pool.query(`SELECT id,name,capacity,occupied,ROUND((occupied::numeric/capacity::numeric)*100,0)::int AS percentage FROM yards ORDER BY id`);
      csv = toCsv(["ID","Patio","Capacidad","Ocupación","Porcentaje"], r.rows.map(x => [x.id,x.name,x.capacity,x.occupied,`${x.percentage}%`]));
    } else if (type === "alerts") {
      const r = await pool.query(`SELECT id,level,message,active,created_at FROM alerts ORDER BY id DESC`);
      csv = toCsv(["ID","Nivel","Mensaje","Activa","Creada"], r.rows.map(x => [x.id,x.level,x.message,x.active,x.created_at]));
    } else {
      return res.status(404).json({ error: "Tipo de reporte no válido." });
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible generar el reporte." });
  }
});

export default router;
