# Revisión del TSP — hallazgos y correcciones

Revisión del documento `UNIVERSIDAD PERUANA DE CIENCIAS APLICADAS.docx` contra el proyecto real (repositorio `MIS-angular-front`) y contra el documento de referencia `Mamani_ZC (1).pdf`.

Los hallazgos están ordenados por severidad. **Crítico** significa que compromete la evaluación del trabajo; **alto**, que un jurado lo va a observar; **medio**, que resta calidad sin invalidar.

---

## 1. Hallazgos críticos

### H-01 · El resumen y el abstract son de otro proyecto

El RESUMEN describe un *modelo operativo de gestión de riesgos tecnológicos basado en ISO 31000, Risk IT de ISACA y la autoevaluación del APO12 de COBIT 5*. El ABSTRACT dice lo mismo en inglés, y el título en inglés es **“Operating Model for IT Risk Management based on the ISO 31000 standard in the financial sector”**.

Nada de eso pertenece a este trabajo. El proyecto es una reingeniería de frontend: arquitectura modular con componentes standalone, carga diferida, señales y ejecución zoneless, evaluada con ISO/IEC 25010.

Las palabras clave (`Technology risks; ISO 31000; Operating Model; Risk IT Framework`) tienen el mismo problema.

**Corrección**: reescribir resumen, abstract, título en inglés y palabras clave. Propuesta en la sección 4 de este documento.

### H-02 · El título no describe lo que el proyecto hace

El título dice **“para la mitigación de latencia de red”**. El propio marco conceptual del documento distingue la latencia de red del comportamiento temporal de la aplicación, y los antecedentes cierran diciendo que la propuesta se orienta a mejorar el rendimiento del frontend “diferenciando la optimización del frontend de la latencia física propia de la infraestructura de red”.

El proyecto no interviene la red: no cambia enlaces, ni proveedores, ni topología. Interviene el bundle inicial, la detección de cambios y el renderizado. Un jurado va a preguntar qué medida de latencia de red se redujo, y no hay ninguna.

**Corrección sugerida del título**:

> Sistema web con arquitectura modular *standalone* para reducir los tiempos de respuesta y renderizado de un sistema de información gerencial en el sector microfinanciero

Si el título ya está registrado y no se puede cambiar, hay que agregar en el alcance un párrafo explícito que delimite “latencia” como latencia percibida por el usuario (comportamiento temporal según ISO/IEC 25010), no latencia de red.

---

## 2. Hallazgos de gestión del proyecto

### H-03 · Falta la mayor parte de las áreas de gestión (alto)

El documento de referencia dedica trece subsecciones a la gestión del proyecto: alcance, hoja de ruta, hitos, matriz de responsabilidades, calidad, adquisiciones, recursos, riesgos, requerimientos, costo, cronograma y gestión del proyecto.

El documento actual solo tiene **cronograma** (tabla de fases) y **costo**. Faltan: EDT y criterios de aceptación, exclusiones, hitos, RACI, plan de calidad, gestión de riesgos, recursos y adquisiciones, e interesados.

Esto es lo más observable del trabajo, porque es un TSP: se evalúa la capacidad profesional de conducir el proyecto, no solo de programar. **Se resuelve con la sección 3.3 del capítulo 3 que se entrega junto a esta revisión.**

### H-04 · Los indicadores de éxito no son medibles (alto)

IE1, IE3 e IE4 se declaran como “documento aprobado”, “sistema desplegado” e “informe que evidencie una mejora”. Un informe que evidencie “una mejora” se cumple con 0,5 %.

Para un proyecto cuyo objetivo general es *mejorar el rendimiento*, el indicador tiene que traer umbral, instrumento y condición de medición.

**Corrección**: reformular IE4 con meta cuantitativa, por ejemplo:

> IE4: Informe comparativo de rendimiento que evidencie, bajo el mismo protocolo de medición (Lighthouse, perfil de escritorio, red simulada, tres corridas por vista), una reducción no menor al X % en el tiempo de carga inicial y no menor al Y % en Total Blocking Time respecto de la línea base del sistema heredado, validado por el área técnica responsable.

Los valores de X e Y los fijan ustedes con la línea base en la mano; el capítulo 3 entregado deja el protocolo de medición listo para producirla.

### H-05 · El cronograma no declara su unidad de tiempo (medio)

La tabla mezcla criterios. “FASE DE INICIO: 01/12/2025 – 16/12/2025 = 16” cuenta días calendario, pero “1.1.1: 01/12/2025 – 05/12/2025 = 5” cuenta días hábiles (del lunes 1 al viernes 5). Con el mismo criterio, 1.1.3 (11/12 a 16/12) serían 4 días hábiles y figura 6.

**Corrección**: declarar el criterio bajo la tabla (“duración en días hábiles, jornada de 8 horas”) y recalcular la columna con un solo criterio. Si se mantiene días calendario, las fases suman coherentemente pero hay que decirlo.

### H-06 · El costo no está trazado contra el cronograma (medio)

El presupuesto está bien calculado —164 780 de subtotales, 10 % de reserva = 16 478, BAC 181 258, IGV 32 626,44, total **S/ 213 884,44**— pero las horas por rol (1 280, 2 560 y 960) no se justifican contra las fases del cronograma. Un jurado suele pedir esa correspondencia.

**Corrección**: agregar la columna de fase o el cálculo de dedicación (por ejemplo, 2 560 h ÷ 8 h ÷ 21 días ≈ 15,2 meses-persona) y explicar el supuesto. Está resuelto en 3.3.8 del capítulo entregado.

---

## 3. Hallazgos de forma y coherencia

| # | Hallazgo | Dónde | Corrección |
|---|---|---|---|
| H-07 | La tabla de contenidos titula el capítulo 3 como “DISEÑO DE LA SOLUCIÓN”, pero el cuerpo lo titula “CAPÍTULO 3: DESARROLLO DEL PROYECTO” | TDC vs. cuerpo | unificar en “CAPÍTULO 3: DESARROLLO DEL PROYECTO”, con 3.1 “Diseño de la solución” |
| H-08 | “COSTO DEL PROYECTO” existe en el cuerpo y no aparece en la tabla de contenidos | TDC | actualizar campo de TDC en Word (clic derecho → Actualizar campos) |
| H-09 | Todos los números de página de la TDC dicen 7 u 8 | TDC | se corrige al actualizar el campo |
| H-10 | El capítulo 1 anuncia “se detalla la planificación de los hitos del proyecto y sus costos asociados”, pero no hay lista de hitos | 1. intro | agregar la lista de hitos (3.3.3) o corregir la frase |
| H-11 | La organización se describe sin nombrarla ni dimensionarla | 1.2 | aceptable por confidencialidad, pero conviene declararlo explícitamente: “por acuerdo de confidencialidad se omite la razón social” |
| H-12 | El problema se sustenta sin línea base numérica | 1.3 | citar las cifras de la línea base del diagnóstico (OE1/IE1); sin ellas, la “degradación considerable” es una afirmación sin respaldo |

---

## 4. Textos de reemplazo propuestos

### 4.1 Resumen

> El presente trabajo de suficiencia profesional presenta la reingeniería del frontend del Sistema de Información Gerencial (MIS) de una entidad microfinanciera, cuya versión heredada fue construida sobre una arquitectura monolítica en Angular 14 con detección de cambios basada en Zone.js y 312 módulos declarados. Esa arquitectura degradaba el comportamiento temporal del sistema al consultar y visualizar grandes volúmenes de información corporativa, con bloqueos perceptibles del hilo principal del navegador.
>
> El objetivo fue implementar un sistema web con arquitectura modular basada en componentes standalone, carga diferida de rutas y recursos, y reactividad granular mediante señales con ejecución zoneless, de modo que se reduzcan los tiempos de carga, respuesta y renderizado sin alterar los contratos de datos del backend.
>
> La solución se implementó sobre Angular 22, PrimeNG 21 y Tailwind CSS v4, conservando el transporte Winder hacia el backend Ant. El sistema resultante eliminó por completo los módulos declarados (0 NgModules), organiza 12 módulos de negocio con carga diferida —253 paquetes diferidos frente a un paquete inicial de 249,08 kB de transferencia— y suma 356 archivos de prueba unitaria y 30 suites end-to-end ejecutadas en dos perfiles de dispositivo. Adicionalmente se incorporó un marco de gobierno del dato y seis compuertas de verificación automatizada que protegen la arquitectura, los contratos y la documentación del sistema.
>
> La evaluación se realizó bajo el modelo de calidad ISO/IEC 25010:2023, con foco en la característica de eficiencia de desempeño.
>
> **Palabras clave**: arquitectura modular; componentes standalone; carga diferida; señales; zoneless; eficiencia de desempeño; ISO/IEC 25010.

### 4.2 Título y abstract en inglés

> **Modular Standalone Web Architecture to Reduce Response and Rendering Times in a Microfinance Management Information System**
>
> This professional proficiency work presents the frontend re-engineering of the Management Information System (MIS) of a microfinance institution, whose legacy version was built on a monolithic Angular 14 architecture with Zone.js-based change detection and 312 declared modules. That architecture degraded the system's time behaviour when querying and displaying large volumes of corporate information, causing perceptible blocking of the browser's main thread.
>
> The goal was to implement a web system with a modular architecture based on standalone components, deferred loading of routes and resources, and granular reactivity through signals with zoneless execution, reducing loading, response and rendering times without altering the backend data contracts.
>
> The solution was implemented on Angular 22, PrimeNG 21 and Tailwind CSS v4, preserving the Winder transport towards the Ant backend. The resulting system removed declared modules entirely (0 NgModules), organises 12 business modules with deferred loading —253 lazy chunks against an initial bundle of 249.08 kB transfer size— and includes 356 unit test files and 30 end-to-end suites executed on two device profiles. A data governance framework and six automated verification gates were also incorporated. The evaluation followed the ISO/IEC 25010:2023 quality model, focusing on performance efficiency.
>
> **Keywords**: modular architecture; standalone components; lazy loading; signals; zoneless; performance efficiency; ISO/IEC 25010.

---

## 5. Qué se entrega junto a esta revisión

- **`capitulo-3.md`** — el capítulo 3 completo, redactado sobre el sistema real y con la estructura del documento de referencia (diseño de la solución en cinco arquitecturas, desarrollo, gestión del proyecto, validación e interpretación).
- **`UNIVERSIDAD PERUANA DE CIENCIAS APLICADAS - Cap3.docx`** — copia del documento original con el capítulo 3 ya insertado y con los estilos de Word del documento. El archivo original **no se modificó**.

### Lo que ustedes tienen que completar

El capítulo incluye marcadores `[MEDIR]` en los puntos donde hace falta una medición de campo que no se puede derivar del repositorio:

| Marcador | Qué falta | Cómo obtenerlo |
|---|---|---|
| Línea base del sistema heredado | LCP, FCP, TBT, CLS y tiempo de carga por vista en Angular 14 | Lighthouse sobre el entorno del sistema heredado, tres corridas por vista, mismo perfil de red |
| Medición del sistema propuesto | los mismos indicadores sobre el sistema nuevo | Lighthouse sobre el entorno de certificación, mismo protocolo |
| Acta de aceptación | firmas de jefatura y especialistas (IE1, IE2, IE4) | gestión interna |

**No se inventó ninguna cifra de rendimiento.** Todas las cifras que aparecen sin marcador son verificables ejecutando los comandos que el propio capítulo indica.
