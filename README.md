# Smart Ports v0.7

Sistema académico para centralizar y coordinar operaciones portuarias relacionadas con buques, muelles, contenedores, patios, recursos, transporte terrestre, alertas e indicadores.

## Product Goal

En los próximos meses, los operadores y administradores portuarios podrán coordinar desde Smart Ports las operaciones relacionadas con buques, muelles, contenedores, patios, recursos y transporte terrestre, logrando que al menos el 90 % de los flujos operativos evaluados se completen correctamente, evitando conflictos de asignación en las pruebas de aceptación y manteniendo trazabilidad verificable de las operaciones registradas, con el fin de facilitar la toma de decisiones operativas.

> Las metas siguientes corresponden a criterios de aceptación del prototipo académico; no representan métricas observadas en un puerto real.

## Indicadores de resultado

1. Al menos 90 % de los flujos operativos evaluados deben completarse correctamente en las pruebas de aceptación.
2. El 100 % de los casos de prueba de conflicto de asignación de muelles debe impedir dobles asignaciones.
3. El 100 % de las operaciones evaluadas debe conservar trazabilidad verificable de su estado y cambios.
4. El 100 % de los casos de prueba que superen el umbral configurado debe generar la alerta de congestión correspondiente.

## Alcance del prototipo

Smart Ports centraliza el registro y consulta de operaciones, la asignación de recursos, la identificación de conflictos y el apoyo a la toma de decisiones mediante información trazable.

El prototipo académico trabaja principalmente con datos simulados. No realiza control físico directo de buques, grúas o maquinaria ni integración operativa con sistemas reales de autoridades marítimas o aduaneras.

## Scrum Team

- Product Owner: Steven Reyes
- Scrum Master: Henry Berrio
- Developers: Juan González, Leyter López, Milton Ramírez y Santiago Hernández

## Sprint 1

Sprint Goal: al finalizar el Sprint, el operador portuario podrá registrar la llegada de buques, consultar la disponibilidad de los muelles y recibir alertas básicas de congestión para apoyar la coordinación inicial de las operaciones portuarias.

PBI seleccionados:
- SCRUM-34 — Registrar la llegada de un buque — 5 puntos
- SCRUM-35 — Consultar disponibilidad de los muelles — 5 puntos
- SCRUM-36 — Recibir alertas de congestión — 3 puntos

Capacidad comprometida: 13 puntos.

## Calidad y trazabilidad

La Definition of Done incluye criterios de aceptación verificados, revisión de código, pruebas automáticas superadas, ausencia de defectos críticos conocidos, documentación actualizada e integración demostrable.

El repositorio utiliza ramas breves, pull requests y GitHub Actions. La evidencia técnica del Sprint 1 incluye 11 pruebas automáticas aprobadas, 0 fallidas y una revisión de pares independiente registrada en el PR #5.
