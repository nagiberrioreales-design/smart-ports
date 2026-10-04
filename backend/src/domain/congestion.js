const ZONE_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .-]{2,60}$/;
export const DEFAULT_CONGESTION_THRESHOLD = 80;

export function evaluateCongestion(input = {}) {
  const zone = typeof input.zone === "string" ? input.zone.trim() : "";
  const currentLevel = Number(input.currentLevel);
  const threshold =
    input.threshold === undefined
      ? DEFAULT_CONGESTION_THRESHOLD
      : Number(input.threshold);

  const errors = [];

  if (!ZONE_PATTERN.test(zone)) errors.push("zone");
  if (!Number.isFinite(currentLevel) || currentLevel < 0 || currentLevel > 100) {
    errors.push("currentLevel");
  }
  if (!Number.isFinite(threshold) || threshold < 1 || threshold > 100) {
    errors.push("threshold");
  }

  if (errors.length) {
    return { valid: false, errors };
  }

  const congested = currentLevel >= threshold;
  const level = currentLevel >= Math.min(100, threshold + 10) ? "danger" : "warning";
  const message = congested
    ? `[CONGESTION] Zona=${zone}; nivel=${currentLevel}%; umbral=${threshold}%.`
    : `[CONGESTION] Zona=${zone}; normalizada en ${currentLevel}%.`;

  return {
    valid: true,
    zone,
    currentLevel,
    threshold,
    congested,
    level,
    message
  };
}
