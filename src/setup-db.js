import pg from "pg";
import dotenv from "dotenv";
import { adminConnectionConfig, initDb, pool, isCloudDatabase } from "./db.js";

dotenv.config();
const { Client } = pg;

const dbName = process.env.DB_NAME || "smart_ports";

async function setupCloud() {
  try {
    console.log("Modo CLOUD detectado mediante DATABASE_URL.");
    await initDb();
    console.log("Esquema y datos iniciales preparados en PostgreSQL Cloud.");
  } catch (error) {
    console.error("\nERROR DE CONFIGURACIÓN CLOUD");
    console.error(error.message);
    console.error("\nRevisa DATABASE_URL, DB_SSL y que la base remota permita conexiones.");
    process.exitCode = 1;
  } finally {
    try { await pool.end(); } catch {}
  }
}

async function setupLocal() {
  const admin = new Client(adminConnectionConfig());

  try {
    await admin.connect();

    const exists = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (exists.rowCount === 0) {
      const safeName = dbName.replace(/[^a-zA-Z0-9_]/g, "");
      await admin.query(`CREATE DATABASE "${safeName}"`);
      console.log(`Base de datos '${safeName}' creada.`);
    } else {
      console.log(`Base de datos '${dbName}' ya existe.`);
    }

    await admin.end();
    await initDb();
    console.log("Tablas y datos iniciales preparados correctamente.");
  } catch (error) {
    console.error("\nERROR DE CONFIGURACIÓN LOCAL");
    console.error(error.message);
    console.error("\nRevisa backend/.env y confirma que PostgreSQL esté encendido y DB_PASSWORD sea correcta.");
    process.exitCode = 1;
  } finally {
    try { await admin.end(); } catch {}
    try { await pool.end(); } catch {}
  }
}

if (isCloudDatabase) {
  setupCloud();
} else {
  setupLocal();
}
