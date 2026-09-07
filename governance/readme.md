# Marco de Gobernanza y Desarrollo — MIS Host

Bienvenido al centro de gobernanza, automatización y estándares técnicos de **Financiera Confianza (MIS Host)**.

Esta carpeta contiene las herramientas, directrices y agentes que aseguran la consistencia arquitectónica, calidad de código y velocidad de entrega para el portal administrador basado en **Angular 22 Zoneless**, **PrimeNG 21** y **Tailwind CSS v4**.

---

## Estructura del Directorio de Gobernanza

```text
governance/
  ├── scripts/      # Herramientas y scripts de automatización (scaffolding, testing, auditoría)
  ├── skills/       # Guías técnicas especializadas y directrices de desarrollo (Skills)
  ├── agents/       # Definición y orquestación del equipo de agentes IA (Investigador, Desarrollador, Tester)
  ├── docs/         # Documentación canónica (arquitectura, contratos API, negocio, seguridad)
  └── readme.md     # Este índice general
```

---

## 1. 🛠️ Scripts Utilitarios (`governance/scripts/`)

Scripts Node.js multiplataforma para agilizar tareas repetitivas y garantizar la adhesión a los estándares:

- **[`crear-modulo.mjs`](./scripts/crear-modulo.mjs)**: Genera automáticamente módulos de negocio canónicos en `src/app/pages/modules/` (con rutas lazy, constantes, modelos, mappers puros, servicios con Signals, tarjetas métricas y vistas principales).
  ```bash
  node governance/scripts/crear-modulo.mjs <nombre-modulo> [--title "Título"]
  ```
- **[`ejecutar-pruebas.mjs`](./scripts/ejecutar-pruebas.mjs)**: Lanzador unificado de pruebas unitarias (Vitest), cobertura, modo observador, pruebas E2E (Playwright) y auditorías.
  ```bash
  node governance/scripts/ejecutar-pruebas.mjs [unit|watch|coverage|e2e|all]
  ```
- **[`validar-gobernanza.mjs`](./scripts/validar-gobernanza.mjs)**: Auditor estático de código para verificar aislamiento de capas (`core` y `shared`), adopción de Signals y buenas prácticas de seguridad.
  ```bash
  node governance/scripts/validar-gobernanza.mjs [--check|--strict]
  ```
- **[`verificar-bundle.mjs`](./scripts/verificar-bundle.mjs)**: Asegura que el build de producción no contenga URLs de desarrollo ni correos institucionales.
- **[`generar-tokens-paleta.mjs`](./scripts/generar-tokens-paleta.mjs)**: Sincroniza tokens de CSS con TypeScript para tests de contraste y daltonismo.

👉 Consulta el manual completo en [governance/scripts/README.md](./scripts/README.md).

---

## 2. 🧠 Habilidades y Directrices (`governance/skills/`)

Skills de conocimiento aplicables a desarrolladores humanos y asistentes de IA (Antigravity):

- **[`angular-mis-zoneless`](./skills/angular-mis-zoneless/SKILL.md)**: Arquitectura sin Zone.js, reactividad con Signals (`signal`, `computed`, `input`, `output`), inyección con `inject()` y detección de cambios `OnPush`.
- **[`mis-component-styling`](./skills/mis-component-styling/SKILL.md)**: Estándares visuales con PrimeNG 21 y Tailwind v4, paleta corporativa y los 4 estados de pantalla obligatorios (Carga, Vacío, Error con reintento y Contenido).
- **[`mis-module-architecture`](./skills/mis-module-architecture/SKILL.md)**: Estructura de capas por módulo (`constantes`, `models`, `utils`, `services`, `ui`, `components`) y ciclo de vida para agregar nuevos reportes (`cod_rep`).
- **[`mis-testing-guide`](./skills/mis-testing-guide/SKILL.md)**: Metodología para pruebas unitarias con Vitest (mappers y servicios) y pruebas E2E con Playwright.

---

## 3. 🤖 Pipeline de 3 Agentes de Desarrollo (`governance/agents/`)

Flujo secuencial para atender cualquier requerimiento de manera confiable:

1. **[`01-investigador-requerimientos.md`](./agents/01-investigador-requerimientos.md)** (`investigador_requerimientos`):
   - Investiga la base de código y contratos.
   - Pregunta al usuario para aclarar dudas, columnas o filtros ambiguos antes de escribir código.
   - Emite el plan y la especificación técnica.
2. **[`02-desarrollador-angular.md`](./agents/02-desarrollador-angular.md)** (`desarrollador_angular`):
   - Realiza el scaffolding canónico.
   - Codifica en Angular 22 zoneless con Signals, PrimeNG y Tailwind.
   - Implementa los 4 estados y verifica la compilación.
3. **[`03-tester-qa.md`](./agents/03-tester-qa.md)** (`tester_qa`):
   - Diseña y ejecuta pruebas unitarias con Vitest y pruebas E2E con Playwright.
   - Ejecuta la auditoría de gobernanza arquitectónica y emite el dictamen final.

👉 Consulta la descripción detallada del flujo en [governance/agents/README.md](./agents/README.md).

---

## 4. 📚 Documentación Canónica (`governance/docs/`)

- [Visión del Sistema y Producto](./docs/README.md)
- [Guía de Creación de Módulos](./docs/development/module-guide.md)
- [Convenciones de Desarrollo](./docs/development/conventions.md)
- [Inventario y Estrategia de Pruebas](./docs/development/testing.md)
