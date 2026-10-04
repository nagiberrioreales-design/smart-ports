export function resolveDockStatus(baseStatus, activeShipId = null) {
  if (activeShipId) return "Ocupado";
  if (baseStatus === "Mantenimiento") return "Mantenimiento";
  return "Disponible";
}
