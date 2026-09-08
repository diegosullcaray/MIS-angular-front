# Rendimiento

Todo reporte de rendimiento debe indicar entorno, navegador, red, fecha de corte, flujo medido y commit.

- [Comparación con el sistema legado](./legacy-comparison.md) — las tres causas de degradación identificadas
- [Incidentes de rendimiento legacy](./legacy-incidents.md)
- [Responsive y color](./responsive-color.md) — viewports, contraste y tokens claro/oscuro

## Presupuesto de bundle

`angular.json` fija el presupuesto inicial en 1.5 MB de aviso y 2 MB de error, y 6 KB / 8 KB por estilo de componente. El corte lo aplica el builder de Angular; `npm run verify:bundle` además deja el peso registrado en el log del build, para que una regresión de tamaño se vea el día que ocurre.
