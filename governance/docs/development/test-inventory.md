# Inventario de pruebas

## Cifras

Derivadas del código. **No editar a mano**: `npm run inventario` regenera, `npm run inventario:check` verifica.

<!-- generado:inicio pruebas -->
<!-- Generado por governance/scripts/generar-inventario.mjs — 2026-09-11 · commit 3eae138. No editar a mano. -->

- **357** archivos `*.spec.ts` bajo `src/app`.
- **31** suites Playwright bajo `e2e/`.
- Proyectos E2E configurados: `desktop-chromium`, `mobile-chromium`.
<!-- generado:fin -->

## Cómo están construidas

- Los specs unitarios usan **globales de Vitest** (`types: ["vitest/globals"]`): ninguno importa de `'vitest'`.
- Los servicios con `inject()` se prueban con `TestBed` doblando el `Mod*Service` correspondiente; los mapeos de `utils/` se prueban directo, sin `TestBed`.
- Las suites E2E mockean el backend con `page.route()` e inyectan la sesión en `sessionStorage` (`e2e/fixtures/session.ts`): no dependen de Google ni de Ant reales.
- `src/test-setup.ts` garantiza que `localStorage` y `sessionStorage` existan (jsdom no los expone con un documento de origen opaco) y limpia `sessionStorage` antes de cada spec, porque el caché de jerarquía se comparte entre specs del mismo worker. Lo cubre `src/test-setup.spec.ts`.

Metodología completa: [`skills/mis-testing-guide`](../../skills/mis-testing-guide/SKILL.md).

## Cobertura funcional E2E

Login, guards, expiración, cambio de usuario, shell responsive, breadcrumb, Home recientes, configuración, comunicados, errores, reportes, jerarquía, cartera, captaciones, clientes, presupuesto, ESG, incentivos y reportes de actividad diaria y mensual.

## Comandos

```bash
npm test                                              # unitarias
npm run e2e                                           # end-to-end
node governance/scripts/ejecutar-pruebas.mjs coverage  # cobertura
npm run build:prod                                    # build y control de bundle
```

## Brechas conocidas

No afirmar cobertura que no existe:

- **El número de specs no es cobertura de negocio.** Varias pruebas comparten los mismos mocks.
- **41 servicios y utilidades no tienen `.spec.ts` hermano**, sobre todo bajo `reportes/**/services/`. Lo reporta el auditor con `--regla=prueba-vecina`.
- **No hay inventario automatizado de rutas contra menú** ni de `cod_rep` contra servicios.
- **La autorización real no se prueba**: el E2E mockea el backend por diseño. Esa verificación pertenece al backend.
