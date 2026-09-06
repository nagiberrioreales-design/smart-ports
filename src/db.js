import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hasCloudUrl = Boolean(process.env.DATABASE_URL);

function localConfig(databaseName = process.env.DB_NAME) {
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: databaseName || "smart_ports"
  };
}

function cloudConfig() {
  const useSSL = String(process.env.DB_SSL ?? "true").toLowerCase() !== "false";
  return {
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  };
}

export const isCloudDatabase = hasCloudUrl;
export const pool = new Pool(hasCloudUrl ? cloudConfig() : localConfig());

export async function initDb() {
  const schemaPath = path.resolve(__dirname, "../../database/schema.sql");
  const seedPath = path.resolve(__dirname, "../../database/seed.sql");

  const schema = fs.readFileSync(schemaPath, "utf8");
  const seed = fs.readFileSync(seedPath, "utf8");

  await pool.query(schema);

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@smartports.com";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "1234";
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [adminEmail]);

  if (existing.rowCount === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, active)
       VALUES ($1, $2, $3, $4, TRUE)`,
      ["Administrador", adminEmail, passwordHash, "Administrador"]
    );
  }

  const seedDemo = String(process.env.SEED_DEMO_DATA ?? "true").toLowerCase() !== "false";

  if (seedDemo) {
    const shipCount = await pool.query("SELECT COUNT(*)::int AS total FROM ships");
    if (shipCount.rows[0].total === 0) {
      const ships = [
        ["MSC Seaview", "10:45", "A1", "En tránsito", 830],
        ["Maersk Line", "11:20", "B2", "En puerto", 610],
        ["Evergreen", "12:10", "A3", "Esperando", 720],
        ["COSCO Shipping", "13:30", "C1", "Descargando", 540],
        ["Hapag-Lloyd", "14:15", "B1", "En puerto", 760],
        ["CMA CGM Atlas", "15:00", "A2", "Esperando", 820],
        ["ONE Horizon", "15:45", "C2", "En tránsito", 690],
        ["Yang Ming Star", "16:20", "B3", "En puerto", 840],
        ["ZIM Pacific", "17:05", "A4", "Descargando", 780],
        ["OOCL Aurora", "18:10", "C3", "En tránsito", 710],
        ["Ever Ace", "19:00", "B4", "Esperando", 1400]
      ];

      for (const ship of ships) {
        await pool.query(
          `INSERT INTO ships (name, eta, dock, status, containers)
           VALUES ($1, $2, $3, $4, $5)`,
          ship
        );
      }
    }

    await pool.query(seed);
  }
}

export function adminConnectionConfig() {
  return localConfig("postgres");
}

export async function checkDatabase() {
  const result = await pool.query("SELECT NOW() AS now");
  return result.rows[0];
}
