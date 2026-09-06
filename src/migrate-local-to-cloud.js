import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: ".env.migration" });

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL en backend/.env.migration");
  process.exit(1);
}

const local = new Pool({
  host: process.env.LOCAL_DB_HOST || "localhost",
  port: Number(process.env.LOCAL_DB_PORT || 5432),
  user: process.env.LOCAL_DB_USER || "postgres",
  password: process.env.LOCAL_DB_PASSWORD || "",
  database: process.env.LOCAL_DB_NAME || "smart_ports"
});

const cloud = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: String(process.env.DB_SSL ?? "true").toLowerCase() !== "false"
    ? { rejectUnauthorized: false }
    : false
});

const tables = [
  "users",
  "ships",
  "containers",
  "cranes",
  "yards",
  "alerts",
  "docks",
  "audit_logs",
  "notifications"
];

async function insertRows(client, table, rows) {
  for (const row of rows) {
    const columns = Object.keys(row);
    const values = Object.values(row);
    const names = columns.map(c => `"${c}"`).join(", ");
    const params = values.map((_, i) => `$${i + 1}`).join(", ");
    await client.query(
      `INSERT INTO "${table}" (${names}) VALUES (${params})`,
      values
    );
  }
}

async function resetSequence(client, table) {
  await client.query(`
    SELECT setval(
      pg_get_serial_sequence($1, 'id'),
      COALESCE((SELECT MAX(id) FROM "${table}"), 1),
      EXISTS(SELECT 1 FROM "${table}")
    )
  `, [table]);
}

async function migrate() {
  const cloudClient = await cloud.connect();

  try {
    console.log("Preparando esquema en la base CLOUD...");
    const schemaPath = path.resolve(__dirname, "../../database/schema.sql");
    await cloudClient.query(fs.readFileSync(schemaPath, "utf8"));

    const counts = {};
    for (const table of tables) {
      const result = await local.query(`SELECT * FROM "${table}" ORDER BY id`);
      counts[table] = result.rows.length;
    }

    console.log("\nDatos encontrados en PostgreSQL local:");
    console.table(counts);

    if (process.env.CONFIRM_REPLACE_CLOUD !== "SI") {
      console.error("\nSEGURIDAD: la migración no se ejecutó.");
      console.error("Para reemplazar los datos de la base CLOUD, agrega:");
      console.error("CONFIRM_REPLACE_CLOUD=SI");
      console.error("en backend/.env.migration y vuelve a ejecutar.");
      return;
    }

    await cloudClient.query("BEGIN");
    await cloudClient.query(`
      TRUNCATE TABLE
        notifications,
        audit_logs,
        containers,
        alerts,
        docks,
        yards,
        cranes,
        ships,
        users
      RESTART IDENTITY CASCADE
    `);

    for (const table of tables) {
      const result = await local.query(`SELECT * FROM "${table}" ORDER BY id`);
      console.log(`Migrando ${table}: ${result.rows.length} filas`);
      await insertRows(cloudClient, table, result.rows);
      if (result.rows.length) {
        await resetSequence(cloudClient, table);
      }
    }

    await cloudClient.query("COMMIT");
    console.log("\nMigración completada. La base CLOUD contiene los datos de tu Smart Ports local.");
  } catch (error) {
    try { await cloudClient.query("ROLLBACK"); } catch {}
    console.error("\nERROR DURANTE LA MIGRACIÓN");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    cloudClient.release();
    await local.end();
    await cloud.end();
  }
}

migrate();
