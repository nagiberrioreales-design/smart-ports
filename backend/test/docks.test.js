import test from "node:test";
import assert from "node:assert/strict";
import { resolveDockStatus } from "../src/domain/dock-status.js";

test("SCRUM-35 muestra Disponible cuando el muelle está libre", () => {
  assert.equal(resolveDockStatus("Disponible", null), "Disponible");
});

test("SCRUM-35 muestra Ocupado cuando existe un buque activo asignado", () => {
  assert.equal(resolveDockStatus("Disponible", 42), "Ocupado");
});

test("SCRUM-35 respeta el estado de mantenimiento cuando no hay buque activo", () => {
  assert.equal(resolveDockStatus("Mantenimiento", null), "Mantenimiento");
});

test("SCRUM-35 vuelve a Disponible cuando el buque deja de estar activo", () => {
  const occupied = resolveDockStatus("Disponible", 42);
  const released = resolveDockStatus("Disponible", null);

  assert.equal(occupied, "Ocupado");
  assert.equal(released, "Disponible");
});
