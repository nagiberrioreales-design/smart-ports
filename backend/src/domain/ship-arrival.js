export const REQUIRED_SHIP_FIELDS = ["name", "eta", "dock", "status"];

export function validateShipArrival(input = {}) {
  const data = {
    name: typeof input.name === "string" ? input.name.trim() : "",
    eta: typeof input.eta === "string" ? input.eta.trim() : "",
    dock: typeof input.dock === "string" ? input.dock.trim() : "",
    status: typeof input.status === "string" ? input.status.trim() : "",
    containers: Number(input.containers) || 0
  };

  const missingFields = REQUIRED_SHIP_FIELDS.filter((field) => !data[field]);

  return {
    valid: missingFields.length === 0,
    missingFields,
    data
  };
}
