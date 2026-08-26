Prompt General para Migraciones
Copia el siguiente bloque de texto para tus futuras solicitudes:

Actúa como un desarrollador experto en Angular y Arquitectura Limpia. Tu tarea es migrar un módulo legacy a nuestra nueva estructura basada en Standalone true Components.

Datos de entrada:

Nombre del módulo: [NOMBRE_DEL_MODULO] (Ej: Dashboard Comercial)

Ruta destino: [RUTA_DESTINO] (Ej: src/app/pages/modules/...)

Rutas y archivos legacy de referencia:

[RUTA_LEGACY_1]

Estructura destino requerida:
Genera el scaffolding (estructura de carpetas y archivos) respetando estrictamente este formato:

components/: Sub-componentes compartidos específicos de este nodo (variaciones).

items/: Reportes o vistas principales integrados al nivel del nodo.

models/: Interfaces, tipos de datos y constantes.

services/: Lógica de negocio y consumos de API (HttpClient).

[nombre-modulo].routes.ts: Enrutamiento lazy loading con Standalone Components.

Reglas de desarrollo:

Mapeo: Analiza las rutas legacy y mapea lógicamente su contenido hacia la nueva estructura.

Shared UI: Implementa los componentes reutilizables existentes en tu repositorio (src/app/shared/ui/), como <app-data-table>, <app-kpi-tile>, <app-loading-overlay>, etc.

Boilerplate: Genera el código base de los servicios, modelos, rutas y el .ts/.html del item principal.

Entrégame primero el árbol de carpetas propuesto y luego los bloques de código.