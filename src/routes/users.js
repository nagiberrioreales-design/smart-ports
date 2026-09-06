import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, active, created_at
      FROM users
      ORDER BY id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible cargar los usuarios." });
  }
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role = "Operador" } = req.body || {};
    const roles = ["Administrador", "Operador"];

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Nombre, correo y contraseña son obligatorios." });
    }

    if (!roles.includes(role)) {
      return res.status(400).json({ error: "Rol no válido." });
    }

    if (String(password).length < 4) {
      return res.status(400).json({ error: "La contraseña debe tener mínimo 4 caracteres." });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const result = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id, name, email, role, active, created_at
    `, [name.trim(), email.trim().toLowerCase(), passwordHash, role]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(409).json({ error: "Ya existe un usuario con ese correo." });
    }
    res.status(500).json({ error: "No fue posible crear el usuario." });
  }
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const { role, active } = req.body || {};
    const roles = ["Administrador", "Operador"];

    if (targetId === Number(req.user.id) && active === false) {
      return res.status(400).json({ error: "No puedes desactivar tu propia cuenta." });
    }

    if (role !== undefined && !roles.includes(role)) {
      return res.status(400).json({ error: "Rol no válido." });
    }

    const current = await pool.query(
      "SELECT id, role, active FROM users WHERE id = $1",
      [targetId]
    );

    if (!current.rowCount) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const nextRole = role ?? current.rows[0].role;
    const nextActive = active ?? current.rows[0].active;

    const result = await pool.query(`
      UPDATE users
      SET role = $1, active = $2
      WHERE id = $3
      RETURNING id, name, email, role, active, created_at
    `, [nextRole, nextActive, targetId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No fue posible actualizar el usuario." });
  }
});

export default router;
