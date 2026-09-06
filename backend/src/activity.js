export async function writeAudit(db, {
  userId = null,
  action,
  entityType = "system",
  entityId = null,
  details = null
}) {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        userId,
        action,
        entityType,
        entityId ? String(entityId) : null,
        details ? JSON.stringify(details) : null
      ]
    );
  } catch (error) {
    console.error("No fue posible guardar auditoría:", error.message);
  }
}

export async function createNotification(db, {
  level = "info",
  title,
  message
}) {
  try {
    await db.query(
      `INSERT INTO notifications (level, title, message, is_read)
       VALUES ($1, $2, $3, FALSE)`,
      [level, title, message]
    );
  } catch (error) {
    console.error("No fue posible guardar notificación:", error.message);
  }
}
