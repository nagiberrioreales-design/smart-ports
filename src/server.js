import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";
import authRoutes from "./routes/auth.js";
import shipsRoutes from "./routes/ships.js";
import dashboardRoutes from "./routes/dashboard.js";
import containersRoutes from "./routes/containers.js";
import cranesRoutes from "./routes/cranes.js";
import yardsRoutes from "./routes/yards.js";
import alertsRoutes from "./routes/alerts.js";
import docksRoutes from "./routes/docks.js";
import analyticsRoutes from "./routes/analytics.js";
import reportsRoutes from "./routes/reports.js";
import optimizationRoutes from "./routes/optimization.js";
import usersRoutes from "./routes/users.js";
import auditRoutes from "./routes/audit.js";
import notificationsRoutes from "./routes/notifications.js";
import { pool, checkDatabase, isCloudDatabase } from "./db.js";
import { writeAudit, createNotification } from "./activity.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, "../../frontend");

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", async () => {
    if (!req.path.startsWith("/api/")) return;
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return;
    if (req.path === "/api/auth/login") return;
    if (res.statusCode >= 400) return;

    const cleanBody = { ...(req.body || {}) };
    if ("password" in cleanBody) cleanBody.password = "[PROTEGIDO]";

    await writeAudit(pool, {
      userId: req.user?.id || null,
      action: `${req.method} ${req.path}`,
      entityType: req.path.split("/")[2] || "api",
      details: {
        body: cleanBody,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt
      }
    });

    const path = req.path;
    let notification = null;

    if (req.method === "POST" && path === "/api/ships") {
      notification = {
        level: "success",
        title: "Buque registrado",
        message: `${cleanBody.name || "Un buque"} fue agregado al sistema.`
      };
    } else if (req.method === "POST" && path === "/api/alerts") {
      notification = {
        level: cleanBody.level === "danger" ? "danger" : "warning",
        title: "Nueva alerta",
        message: cleanBody.message || "Se creó una nueva alerta operativa."
      };
    } else if (path.startsWith("/api/cranes/") && req.method === "PATCH") {
      notification = {
        level: "info",
        title: "Estado de grúa actualizado",
        message: `Una grúa cambió su estado a ${cleanBody.status || "nuevo estado"}.`
      };
    } else if (path.startsWith("/api/yards/") && req.method === "PATCH") {
      notification = {
        level: "info",
        title: "Ocupación de patio actualizada",
        message: "Se modificó la ocupación de un patio."
      };
    } else if (req.method === "POST" && path === "/api/users") {
      notification = {
        level: "success",
        title: "Nuevo usuario",
        message: `${cleanBody.name || "Un usuario"} fue creado en Smart Ports.`
      };
    } else if (path.startsWith("/api/users/") && req.method === "PATCH") {
      notification = {
        level: "info",
        title: "Usuario actualizado",
        message: "Se modificaron permisos o estado de una cuenta."
      };
    }

    if (notification) {
      await createNotification(pool, notification);
    }
  });

  next();
});

app.get("/api/health", async (_req, res) => {
  try {
    const db = await checkDatabase();
    res.json({
      ok: true,
      service: "Smart Ports API",
      version: "0.7.0",
      database: isCloudDatabase ? "cloud" : "local",
      databaseTime: db.now
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      service: "Smart Ports API",
      version: "0.7.0",
      database: "unavailable",
      error: error.message
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/ships", shipsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/containers", containersRoutes);
app.use("/api/cranes", cranesRoutes);
app.use("/api/yards", yardsRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/docks", docksRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/optimization", optimizationRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/notifications", notificationsRoutes);

app.use(express.static(frontendPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

async function start() {
  try {
    await initDb();

    app.listen(PORT, () => {
      console.log("\n========================================");
      console.log(" SMART PORTS v0.7 - CLOUD MULTIUSUARIO");
      console.log("========================================");
      const publicUrl = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
      console.log(` Sistema: ${publicUrl}`);
      console.log(` API:     http://localhost:${PORT}/api/health`);
      console.log(` Base de datos: ${isCloudDatabase ? "PostgreSQL Cloud" : "PostgreSQL local"}`);
      console.log(` Usuario inicial: ${process.env.INITIAL_ADMIN_EMAIL || "admin@smartports.com"}`);
      console.log("========================================\n");
    });
  } catch (error) {
    console.error("\nNo fue posible iniciar Smart Ports.");
    console.error(error.message);
    console.error(
      "\nEjecuta primero: npm run setup\n" +
      "y revisa DATABASE_URL (cloud) o backend/.env (local)."
    );
    process.exit(1);
  }
}

start();
