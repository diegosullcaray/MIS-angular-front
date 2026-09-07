# Scripts de Gobernanza — MIS Host

Colección de scripts utilitarios de Node.js diseñados para estandarizar el ciclo de vida de desarrollo, la arquitectura y el control de calidad en el proyecto **MIS Host** (Financiera Confianza).

Todos los scripts son compatibles tanto en Windows (PowerShell/CMD) como en entornos Linux/macOS y pipelines de CI/CD.

---

## Índice de Scripts

| Script | Propósito | Comando directo |
|---|---|---|
| [`crear-modulo.mjs`](./crear-modulo.mjs) | Genera un módulo de negocio con arquitectura canónica Angular 22 zoneless | `node governance/scripts/crear-modulo.mjs <nombre>` |
| [`ejecutar-pruebas.mjs`](./ejecutar-pruebas.mjs) | Lanzador unificado de pruebas unitarias (Vitest), E2E (Playwright) y gobernanza | `node governance/scripts/ejecutar-pruebas.mjs [comando]` |
| [`validar-gobernanza.mjs`](./validar-gobernanza.mjs) | Auditoría estática de reglas arquitectónicas, aislamiento y convenciones | `node governance/scripts/validar-gobernanza.mjs` |
| [`verificar-bundle.mjs`](./verificar-bundle.mjs) | Verifica que no existan URLs de desarrollo ni correos institucionales en el bundle de producción | `node governance/scripts/verificar-bundle.mjs` |
| [`generar-tokens-paleta.mjs`](./generar-tokens-paleta.mjs) | Genera tokens TypeScript de la paleta corporativa a partir de variables CSS | `node governance/scripts/generar-tokens-paleta.mjs` |

---

## 1. Generador de Módulos (`crear-modulo.mjs`)

Crea automáticamente la estructura completa para un nuevo módulo de negocio en `src/app/pages/modules/<modulo>/` cumpliendo la especificación canónica de `governance/docs/development/module-guide.md`:

```text
src/app/pages/modules/<nombre>/
  ├── <nombre>.routes.ts                  # Rutas lazy load
  ├── constantes/<nombre>.constants.ts    # COD_REP, endpoints, configuración
  ├── models/<nombre>.models.ts           # DTOs backend y contratos frontend
  ├── utils/<nombre>.mappers.ts           # Transformadores puros de datos
  ├── utils/<nombre>.mappers.spec.ts      # Pruebas unitarias de mappers
  ├── services/<nombre>.service.ts        # Servicio reactivo con Signals e inject(HttpClient)
  ├── services/<nombre>.service.spec.ts   # Pruebas unitarias del servicio
  ├── ui/<nombre>-resumen-card.component.ts # Componente reutilizable OnPush
  └── components/principal/
      ├── principal.component.ts         # Contenedor principal OnPush
      └── principal.component.html       # Plantilla con PrimeNG, Tailwind y @if/@for
```

### Ejemplos de uso:
```bash
# Crear un módulo llamado 'auditoria-riesgos'
node governance/scripts/crear-modulo.mjs auditoria-riesgos --title "Auditoría de Riesgos"

# Previsualizar archivos sin crearlos en disco
node governance/scripts/crear-modulo.mjs auditoria-riesgos --dry-run
```

---

## 2. Lanzador de Pruebas (`ejecutar-pruebas.mjs`)

Unifica la ejecución de todas las pruebas del repositorio, facilitando los comandos para los desarrolladores y agentes de IA:

### Comandos disponibles:
```bash
# Ejecutar todas las pruebas unitarias (Vitest)
node governance/scripts/ejecutar-pruebas.mjs unit

# Ejecutar una prueba unitaria específica
node governance/scripts/ejecutar-pruebas.mjs unit src/app/pages/modules/analista/services/analista.service.spec.ts

# Pruebas unitarias en modo observador (watch)
node governance/scripts/ejecutar-pruebas.mjs watch

# Generar reporte de cobertura
node governance/scripts/ejecutar-pruebas.mjs coverage

# Ejecutar pruebas E2E con Playwright
node governance/scripts/ejecutar-pruebas.mjs e2e

# Abrir UI interactiva de Playwright
node governance/scripts/ejecutar-pruebas.mjs e2e:ui

# Ejecutar auditoría de gobernanza arquitectónica
node governance/scripts/ejecutar-pruebas.mjs governance

# Ejecutar suite completa (gobernanza + unitarias)
node governance/scripts/ejecutar-pruebas.mjs all
```

---

## 3. Auditor de Gobernanza (`validar-gobernanza.mjs`)

Analiza estáticamente el código fuente de `src/app/` comprobando:

1. **Aislamiento de capas**:
   - `core` no debe importar páginas ni módulos (`src/app/pages/*`).
   - `shared` no debe importar módulos específicos (`src/app/pages/modules/*`).
2. **Modernización de Signals**:
   - Detección de decoradores legacy `@Input()` y `@Output()` en componentes nuevos (se exige `input()` y `output()`).
3. **Seguridad**:
   - Alerta sobre correos o URLs de desarrollo hardcodeadas en código productivo.

### Ejemplos de uso:
```bash
# Modo auditoría informativa (no rompe el build local)
node governance/scripts/validar-gobernanza.mjs

# Modo CI (falla con código 1 si existen infracciones críticas)
node governance/scripts/validar-gobernanza.mjs --check

# Modo estricto (falla si hay cualquier advertencia o infracción)
node governance/scripts/validar-gobernanza.mjs --strict
```
