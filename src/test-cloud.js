import dotenv from "dotenv";
import { pool, isCloudDatabase } from "./db.js";

dotenv.config();

try {
  if (!isCloudDatabase) {
    console.error("DATABASE_URL no está configurada. Este test es para PostgreSQL Cloud.");
    process.exitCode = 1;
  } else {
    const result = await pool.query("SELECT current_database() AS database, current_user AS user, NOW() AS now");
    console.log("Conexión CLOUD correcta.");
    console.table(result.rows);
  }
} catch (error) {
  console.error("No fue posible conectar a PostgreSQL Cloud:");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
