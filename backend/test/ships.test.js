import test from "node:test";
import assert from "node:assert/strict";
import { validateShipArrival } from "../src/domain/ship-arrival.js";

test("SCRUM-34 acepta un registro completo de llegada", () => {
  const result = validateShipArrival({
    name: "Caribbean Star",
    eta: "14:30",
    dock: "M-01",
    status: "En puerto",
    containers: 320
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.missingFields, []);
  assert.equal(result.data.name, "Caribbean Star");
  assert.equal(result.data.containers, 320);
});

test("SCRUM-34 identifica exactamente los campos obligatorios faltantes", () => {
  const result = validateShipArrival({
    name: "Caribbean Star",
    eta: "",
    dock: "",
    status: "En puerto"
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.missingFields, ["eta", "dock"]);
});

test("SCRUM-34 normaliza espacios y contenedores antes de guardar", () => {
  const result = validateShipArrival({
    name: "  Caribbean Star  ",
    eta: " 14:30 ",
    dock: " M-01 ",
    status: " En puerto ",
    containers: "25"
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.data, {
    name: "Caribbean Star",
    eta: "14:30",
    dock: "M-01",
    status: "En puerto",
    containers: 25
  });
});
