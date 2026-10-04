import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCongestion } from "../src/domain/congestion.js";

test("SCRUM-36 genera alerta cuando el nivel supera el umbral", () => {
  const result = evaluateCongestion({
    zone: "Patio A",
    currentLevel: 85,
    threshold: 80
  });

  assert.equal(result.valid, true);
  assert.equal(result.congested, true);
  assert.equal(result.zone, "Patio A");
  assert.match(result.message, /Patio A/);
});

test("SCRUM-36 identifica congestión severa como danger", () => {
  const result = evaluateCongestion({
    zone: "Acceso Norte",
    currentLevel: 95,
    threshold: 80
  });

  assert.equal(result.congested, true);
  assert.equal(result.level, "danger");
});

test("SCRUM-36 marca la situación como normalizada al bajar del umbral", () => {
  const result = evaluateCongestion({
    zone: "Patio A",
    currentLevel: 60,
    threshold: 80
  });

  assert.equal(result.valid, true);
  assert.equal(result.congested, false);
  assert.match(result.message, /normalizada/);
});

test("SCRUM-36 rechaza datos fuera de rango", () => {
  const result = evaluateCongestion({
    zone: "Patio A",
    currentLevel: 140,
    threshold: 80
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["currentLevel"]);
});
