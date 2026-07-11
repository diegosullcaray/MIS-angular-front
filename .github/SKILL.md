---
name: angular-modular
description: Planifica, diseña y estructura proyectos Angular (Standalone, Zoneless) modularmente mediante un protocolo de 5 documentos activos (PRD a Plan de Implementación) antes de codificar.
---
# Angular Modular (Feature-Driven Architecture & Active Documentation)

Este skill guía la planificación, estructuración, diseño y desarrollo de aplicaciones Angular modernas (Standalone Components, Signals, Zoneless) estructuradas de forma modular y limpia (Screaming Architecture / Feature-Driven Design), utilizando un protocolo estricto de documentación activa antes de proceder a la fase de programación.

No debes realizar ningún cambio en el código fuente de la aplicación hasta que el diseño de carpetas del feature y la documentación del plan estén aprobadas por el usuario.

---

## 🗂️ Mapeo del Marco de Documentación Activa (Raíz `/docs_proyecto`)

Debes buscar, crear o actualizar los siguientes archivos en la carpeta `/docs_proyecto` de la raíz del proyecto:

1. **`01_PRD.md` (Product Requirements Document) - Negocio y Producto**
   - **Enfoque Angular**: Define qué problema de negocio resuelve la nueva característica (`feature`) y las reglas de interacción del usuario.
   - Ruta: [01_PRD.md](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/01_PRD.md)
   
2. **`02_UI_UX_APP_FLOW.md` - Frontend y Componentes**
   - **Enfoque Angular**: Define qué rutas de `app.routes.ts` se afectan. Especifica qué componentes *Smart* y *Dumb* (Standalone) se añadirán en `src/app/features/<feature>/components` y cuáles componentes globales/reutilizables de `src/app/shared/ui` se consumirán.
   - Ruta: [02_UI_UX_APP_FLOW.md](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/02_UI_UX_APP_FLOW.md)

3. **`03_TRD.md` (Technical Requirements Document) - Tecnología y Convenciones**
   - **Enfoque Angular**: Define dependencias de npm, configuraciones en `angular.json`, `app.config.ts` (ej. providers globales, Zoneless, Native Federation si aplica) y reglas de acoplamiento de imports (los features no deben importar de otros features directamente).
   - Ruta: [03_TRD.md](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/03_TRD.md)

4. **`04_BACKEND_SCHEMA.md` - Integración de Datos (API y Estado)**
   - **Enfoque Angular**: Detalla las APIs REST/GraphQL que consumirán los servicios (`@Injectable`) en `src/app/features/<feature>/services`. Define las interfaces/tipos (`.models.ts`) y cómo se manejará el estado reactivo utilizando **Signals** (o RxJS si es estrictamente necesario).
   - Ruta: [04_BACKEND_SCHEMA.md](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/04_BACKEND_SCHEMA.md)

5. **`05_IMPLEMENTATION_PLAN.md` - Planificación de Ruta Crítica**
   - **Enfoque Angular**: Secuencia ordenada de tareas detallando qué archivos específicos en `/src/app/features/`, `/src/app/core/` o `/src/app/shared/` se van a crear/modificar.
   - Ruta: [05_IMPLEMENTATION_PLAN.md](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/05_IMPLEMENTATION_PLAN.md)

---

## 🔄 Protocolo de Ejecución (Flujo de Trabajo)

Cuando el usuario solicite una nueva característica o refactorización, debes seguir estrictamente este algoritmo de trabajo:

### Paso 1: Clarificación y Cuestionario de Diseño
Antes de redactar cualquier documento técnico o código, debes detenerte y realizar un cuestionario estructurado al usuario. Formula las siguientes preguntas agrupadas para recabar la información necesaria para los documentos de `/docs_proyecto`:

1. **Para el PRD (`01_PRD.md`)**:
   - ¿Cuál es el objetivo final y valor de negocio que aportará esta nueva funcionalidad?
   - ¿Qué reglas de negocio críticas, límites o validaciones de formularios (Reactive Forms) deben cumplirse?
   - ¿Cuáles son los criterios de aceptación específicos para marcar el requerimiento como completado?
2. **Para UI/UX App Flow (`02_UI_UX_APP_FLOW.md`)**:
   - ¿Qué rutas (`Routes` en Angular) se verán afectadas, creadas o protegidas por Guards (ej. `canActivate`)?
   - ¿Qué componentes nuevos se integrarán dentro del feature en `src/app/features/<feature>/components`?
   - ¿Cómo deben comportarse visualmente los estados asíncronos gestionados por Signals (carga `@defer`, datos vacíos, errores y notificaciones)?
3. **Para TRD (`03_TRD.md`)**:
   - ¿Es necesario instalar o actualizar algún paquete de npm para este desarrollo?
   - ¿Existen directrices de arquitectura específicas (ej. Micro-frontends con Native Federation, estrategias de Change Detection)?
4. **Para Backend Schema (`04_BACKEND_SCHEMA.md`)**:
   - ¿Qué endpoints HTTP del backend se llamarán desde los servicios (`HttpClient`) del feature?
   - ¿Cuáles son las estructuras de datos TypeScript (Interfaces/Types) para los Request y Response?

### Paso 2: Creación/Actualización Secuencial (1 al 5)
Una vez que el usuario proporcione las respuestas o apruebe tus asunciones iniciales, crea o actualiza los archivos en `/docs_proyecto` en el siguiente orden estricto:
1. **`01_PRD.md`**: Detalla los requerimientos del producto y criterios de aceptación.
2. **`02_UI_UX_APP_FLOW.md`**: Mapea el flujo de vistas, *Lazy Loading* de rutas y la jerarquía de componentes del feature.
3. **`03_TRD.md`**: Agrega las nuevas configuraciones, providers en `app.config.ts` y dependencias del sistema.
4. **`04_BACKEND_SCHEMA.md`**: Modela los contratos de la API y los tipos de datos de entrada/salida manejados por Signals.
5. **`05_IMPLEMENTATION_PLAN.md`**: Escribe una ruta crítica detallada con subtareas para cada componente Standalone, modelo, ruta y servicio.

### Paso 3: Aprobación del Plan
- Presenta las actualizaciones realizadas en los 5 documentos al usuario y pídele confirmación explícita sobre el plan diseñado en el `05_IMPLEMENTATION_PLAN.md`.

### Paso 4: Implementación Modular por Fases
- Tras recibir la aprobación del usuario, comienza a codificar dentro de las carpetas `/src/app/features/<feature>` y `/src/app/shared`.
- Genera siempre componentes **Standalone** (`standalone: true`) y evita el uso de `NgModules` a menos que sea estrictamente solicitado.
- A medida que avances en la codificación, mantén actualizado el archivo `05_IMPLEMENTATION_PLAN.md` marcando las tareas completadas (`- [x]`).

### Paso 5: Verificación y Análisis Estático
- Ejecuta pruebas funcionales o revisa la correcta inyección de dependencias (`@Injectable`).
- Propón la ejecución del validador de límites (si existe en el proyecto) para garantizar que el nuevo Feature no importe directamente archivos internos de otro Feature (manteniendo el aislamiento modular).