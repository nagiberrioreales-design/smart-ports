import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
    }

    const result = await pool.query(
      "SELECT id, name, email, password_hash, role, active FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const user = result.rows[0];

    if (user.active === false) {
      return res.status(403).json({ error: "Esta cuenta está desactivada." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const publicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(
      publicUser,
      process.env.JWT_SECRET || "smart_ports_clave_desarrollo_2026",
      { expiresIn: "8h" }
    );

    return res.json({ token, user: publicUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "No fue posible iniciar sesión." });
  }
});

export default router;
