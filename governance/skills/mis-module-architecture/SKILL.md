---
name: mis-module-architecture
description: Guía de arquitectura y estructura canónica de módulos de negocio en MIS Host. Usar para crear nuevos módulos, agregar reportes de negocio (cod_rep) y mantener la separación estricta entre constantes, modelos, utils (mappers puros), servicios y vistas.
---

# Arquitectura Canónica de Módulos — MIS Host

En **MIS Host (Financiera Confianza)**, cada módulo de negocio encapsula su funcionalidad respetando una división estricta de responsabilidades según `governance/docs/development/module-guide.md`.

---

## 1. Estructura de Directorios Canónica

```text
src/app/pages/modules/<modulo>/
  ├── <modulo>.routes.ts                  # Configuración de rutas (lazy loading)
  ├── constantes/                         # Códigos de reporte backend y endpoints
  │   └── <modulo>.constants.ts
  ├── models/                             # DTOs backend y contratos TypeScript de dominio
  │   └── <modulo>.models.ts
  ├── utils/                              # Funciones puras de cálculo y mapeo (con tests)
  │   ├── <modulo>.mappers.ts
  │   └── <modulo>.mappers.spec.ts
  ├── services/                           # Fachada de datos reactiva con Signals
  │   ├── <modulo>.service.ts
  │   └── <modulo>.service.spec.ts
  ├── ui/                                 # Componentes visuales reutilizables del módulo
  │   └── <modulo>-resumen-card.component.ts
  └── components/ (o items/)              # Vistas completas y pantallas del módulo
      └── principal/
          ├── principal.component.ts
          └── principal.component.html
```

---

## 2. Responsabilidades por Capa

1. **`constantes/`**:
   - Almacena códigos de reporte (`COD_REP = 'REP_...'`), URLs base de API y tamaños de página por defecto.
   - Prohibido quemar URLs absolutas o credenciales aquí.
2. **`models/`**:
   - Separa claramente el contrato recibido del backend (`*Dto`) de la estructura que consume la vista (`*Item`).
   - Esto blinda la interfaz gráfica ante cambios de nombres en el backend.
3. **`utils/`**:
   - Funciones 100% puras (sin llamadas HTTP ni inyecciones de Angular).
   - Realizan formateo de moneda (`Intl.NumberFormat`), cálculo de totales, agrupación o parseo de fechas.
   - Obligatorio: Cada función pura debe tener su correspondiente archivo `.spec.ts` con cobertura completa.
4. **`services/`**:
   - Fachada reactiva con `@Injectable({ providedIn: 'root' })`.
   - Utiliza `inject(HttpClient)`.
   - Maneja el estado mediante señales privadas (`_items`, `_cargando`, `_error`) expuestas como `asReadonly()`.
5. **`ui/`**:
   - Componentes "tontos" (dumb/presentational components).
   - Reciben datos por `input()` y emiten eventos por `output()`.
   - No inyectan servicios de backend directamente.
6. **`components/`**:
   - Contenedores inteligentes de página (smart components).
   - Inyectan el servicio del módulo, orquestan las acciones de los filtros y conectan las señales a la vista.

---

## 3. Reglas de Aislamiento y Gobernanza

- **Aislamiento de `core`**: `src/app/core/` no debe importar nada dentro de `pages/`.
- **Aislamiento de `shared`**: `src/app/shared/` no debe importar nada dentro de `pages/modules/`.
- **Enrutamiento perezoso**: Siempre utilizar `loadComponent` o `loadChildren` en las rutas para no degradar el bundle inicial.

---

## 4. Flujo para Crear un Nuevo Módulo

1. **Generación automática**:
   Ejecutar el script utilitario:
   ```bash
   node governance/scripts/crear-modulo.mjs mi-modulo --title "Mi Módulo"
   ```
2. **Enlazar la ruta**:
   Registrar en `src/app/app.routes.ts`:
   ```typescript
   {
     path: 'mi-modulo',
     loadChildren: () =>
       import('./pages/modules/mi-modulo/mi-modulo.routes').then(m => m.MI_MODULO_ROUTES),
   }
   ```
3. **Validar arquitectura**:
   ```bash
   node governance/scripts/validar-gobernanza.mjs
   ```
4. **Ejecutar pruebas del nuevo módulo**:
   ```bash
   node governance/scripts/ejecutar-pruebas.mjs unit
   ```
