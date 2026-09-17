# MIS Host

Frontend de Financiera Confianza: Angular 22 zoneless, PrimeNG 21 y Tailwind CSS v4.
Organizado por funcionalidades, con señales para estado y RxJS para transporte.

## Arranque

Usar Node compatible con Angular 22 y la versión npm indicada en `package.json`.
El CI usa Node 22; el lockfile es la fuente de versiones instaladas.

```bash
npm ci
npm start
```

La aplicación local abre en http://localhost:4200. Consulta el
[setup](governance/docs/development/setup.md) antes de configurar entornos.
No agregar credenciales, identidades reales ni tokens al código o fixtures.

## Compatibilidad legacy

El backend Ant se consume por Winder mediante `core/winder/instances/Mod*Service`.
OAuth, Winder, strands, códigos, parámetros y semántica de vacíos están congelados
durante esta consolidación frontend. No inventar endpoints REST ni tratar todos
los HTTP 500 como vacío: utilizar el adaptador de cada contrato.

## Verificar cambios

```bash
npm run verify                         # estático; no compila ni demuestra comportamiento
npm test                               # unitarias con Vitest
npm run build:prod                     # producción + control del bundle
npm run e2e                            # Playwright, desktop y mobile con backend mockeado
npm run verify:ci -- --con-e2e          # cadena completa local
npm run inventario                     # regenerar cuando cambian rutas o pruebas
npm run test:scaffold                  # regresiones del generador, sin dependencias Angular
```

El workflow [CI](.github/workflows/ci.yml) está versionado. Su existencia no
significa que un commit tenga checks verdes: consultar su ejecución en GitHub.
Límites y proceso según riesgo en
[compuertas de calidad](governance/docs/development/quality-gates.md).

## Documentación

- [Entrada y onboarding](governance/docs/README.md)
- [Contratos y linaje](governance/docs/data/README.md)
- [Convenciones canónicas](governance/docs/development/conventions.md)
- [Guía de reportes](governance/docs/development/report-creation-guide.md)
- [Inventario de pruebas](governance/docs/development/test-inventory.md)
- [Roles de revisión](governance/agents/README.md)

El generador `npm run module:create -- <nombre> --cod-rep <código>` crea una
estructura de ejemplo, no un contrato validado: adaptar DTO y campos antes de
registrar la ruta. `--dry-run` permite inspeccionarlo sin escribir.
