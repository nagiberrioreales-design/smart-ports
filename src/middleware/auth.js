import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token requerido." });
  }

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET || "smart_ports_clave_desarrollo_2026"
    );
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o vencido." });
  }
}


export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "Administrador") {
    return res.status(403).json({ error: "Se requiere rol Administrador." });
  }
  next();
}
