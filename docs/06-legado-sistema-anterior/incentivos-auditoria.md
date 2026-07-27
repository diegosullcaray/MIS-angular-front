# Auditoría de la familia `incentivos` (H-08, Tarea 2.4)

> Documento exigido por el plan (`doc/01-analisis/03-plan-refactorizacion.md`, Tarea 2.4, Paso 1):
> *"Sin este documento la tarea no arranca"*. Generado 2026-07-26.
>
> **Estado: INCOMPLETO A PROPÓSITO.** El plan es explícito en que esta auditoría *"requiere
> participación de negocio. No es una decisión técnica"*. Lo que sigue es la mitad que sí se
> puede resolver con lectura de código (estructura, qué calcula cada módulo, de dónde saca los
> datos). La otra mitad — qué perfiles de usuario usan cada generación hoy, cuál es la vigente
> desde el punto de vista de negocio, y la fecha de retiro de cada una — está marcada
> explícitamente como **pendiente de respuesta de negocio** al final. Tarea 2.4 no debe avanzar a
> sus Pasos 2 en adelante (tests de caracterización, diseño de `ConfiguracionCampania`,
> construcción del módulo unificado) hasta que esas preguntas tengan respuesta.

## Resumen — de 4 generaciones a 3

`incentivos2` ya no existe como módulo Angular: se confirmó "sin ruta activa" (H-08 original) y
se borró en Fase 2 (commit `433c067`, ver `doc/02-bitacora/08-fase1-fase2.md`). Quedan 3 módulos
con ruta activa hoy en `app-routing.module.ts`: `incentivos3`, `incentivos4`, `incentivos-a`.

**Hallazgo que hay que tener presente antes de leer el resto:** el módulo Angular `incentivos4`
y el **namespace de backend** `incentivos4.*` (usado por RPC) **no son la misma cosa** y es fácil
confundirlos:

| | Módulo Angular `incentivos4` | Namespace backend `incentivos4.*` |
|---|---|---|
| Qué es | Ruta `/app/incentivos4`, 650-827 LOC | RPC del protocolo Winder (`incentivos4.resultados4`, `.calculadora4`, `.retencion4`) |
| Estado | **Prototipo sin funcionalidad real** — datos 100% hardcodeados, sin `HttpClient`/`subscribe` en todo el módulo, 3 de sus 4 rutas con plantilla vacía (0 bytes) | **El motor de cálculo activo hoy** — es lo que invoca `incentivos3` para su calculadora y resultados reales (`mod-incentivos3.service.ts`, líneas 23-35) |

Es decir: `incentivos3` (el módulo Angular más grande y más usado) ya delega su cálculo real al
backend `incentivos4.*`, mientras que el módulo Angular *llamado* `incentivos4` es una maqueta de
UI sin relación funcional con ese backend. Cualquier plan de consolidación tiene que tratar esto
como dos preguntas separadas: "¿qué hacemos con el motor de cálculo `incentivos4.*`?" (probablemente
se mantiene, es lo vigente) vs. "¿qué hacemos con la pantalla Angular `incentivos4`?" (parece
código en construcción, abandonado o un spike sin terminar).

---

## `incentivos3` — 4.065 LOC

- **Estructura:** shell + `principal` (dashboard con 4 sub-vistas: perfil, tabla, avances,
  super-plus) + `monetizado` + `calculadora` (+ dialog) + `detalle`/`detalle-2` (+ dialogs) +
  `selector-jer`. Servicios: `incentivos3.service.ts` (orquestación de estado UI),
  `mod-incentivos3.service.ts` (acceso remoto).
- **Modelo de campaña:** SÍ existe, explícito. `model: '2025'|'2026'`, con `changeModel()` en
  `incentivos3.service.ts:88-92`. **Hallazgo:** el botón de UI que permitía cambiar de modelo
  está comentado (`monetizado.component.html:51`) — el sistema quedó fijo en `'2026'` por
  defecto (línea 82). Evidencia de que la transición 2025→2026 ya se dio en la práctica, pero el
  código de soporte al modelo anterior nunca se retiró.
- **Cálculo real:** vive en el backend, namespace `incentivos4.*` para resultados/calculadora
  (`mod-incentivos3.service.ts:23-35`) y namespace legado `incentivos3.*` para pantallas de
  detalle (`getDetail`, `getTasa`, `getProd`, `getCliBanc`). El frontend solo agrega/presenta.
- **Guards:** ninguno a nivel de ruta. La diferenciación por perfil (`STAFF`/`TERRITORIO`/
  `CORREDOR`/`ADMINISTRACION`, mapa `lvlMap` en `incentivos3.service.ts:152-158`) es lógica de
  negocio dentro del servicio, no un guard de Angular Router — cualquier usuario autenticado
  puede navegar a `/app/incentivos3`.
- **Código muerto encontrado:** 3 componentes completos (`Historico`, `Composicion`, `Aportes`)
  declarados y con datos poblados activamente por el servicio, pero **sin ningún consumidor en
  ningún template** — trabajo de backend/estado sin UI. `HistoricoComponent` además tiene un bug
  (`config` nunca se asigna, lanzaría `TypeError` si se renderizara). El ítem "Grupos" (`gru`) en
  avances/calculadora está configurado pero nunca se marca visible para ningún rol — inalcanzable.

## `incentivos4` — 650-827 LOC

- **Estructura:** shell + `principal` (3 sub-vistas: cards, avances, dinamizadores) +
  `calculadora`/`detalle`/`detalle-2` — estas 3 últimas con **plantilla y estilos vacíos (0
  bytes)** y la clase reducida a un `ngOnInit(){}` sin cuerpo.
- **Modelo de campaña:** no existe ningún estado real. "Modelo: 2025-I" es texto plano hardcodeado
  en el HTML (`principal.component.html:25`), no bindeado a ninguna propiedad.
- **Cálculo real:** no existe. Cero llamadas HTTP en todo el módulo (confirmado por grep de
  `HttpClient`/`Observable`/`.subscribe(`). Todos los valores mostrados son literales
  hardcodeados en archivos `*.util.ts` (montos, porcentajes, nombres). `ModIncentivos4Service` es
  una clase vacía, provista pero nunca inyectada en ningún componente.
- **Guards:** ninguno, igual que `incentivos3`.
- **Conclusión técnica** (sin poder afirmar intención de negocio): la evidencia de código apunta
  a un módulo en construcción o un spike de UI abandonado — rutas y wiring completos, contenido y
  cálculo ausentes — no a una generación de negocio ya cerrada y en uso.

## `incentivos-a` — 1.295-2.127 LOC

- **Estructura:** shell + `principal` + `cabecera` (selector de jerarquía) + `monetizacion` +
  `cobertura` + `cobertura-s` (ver hallazgo) + `composicion` + `calculadora` (+ dialog).
- **Modelo de campaña:** no existe. Se diferencia por `tip_cod` (tipo de cargo/jerarquía: 7, 18,
  19...) hardcodeado en `if`/`*ngIf` (`principal.component.ts:41`,
  `calculadora.component.html:108,130`), un eje distinto al de `incentivos3`.
- **Cálculo real:** vive en el backend, pero bajo el namespace **`incentivos2.*`**
  (`mod-incentivos-a.service.ts:21-56`: `incentivos2.lista2`, `.resultados2`, `.calculadora2`,
  `.bancarizados2`, `.cobertura2`, `.detalle2`). **Hallazgo:** esto es evidencia fuerte de que
  `incentivos-a` es el frontend renombrado del viejo `incentivos2` (cuyo módulo Angular ya se
  borró, pero cuya API de backend sigue viva e intacta) — no una "campaña A" nueva y paralela a
  `incentivos3`/`4`. El nombre del servicio remoto nunca se actualizó al renombrar el módulo.
- **Guards:** ninguno.
- **Código muerto encontrado:** `CoberturaSComponent` está declarado pero **nunca usado en ningún
  template** — y su contenido es 100% demo (`Math.random()`, textos "Generado Aleatoriamente
  Demo") compilando en producción sin que nadie lo vea. Variable `profile` leída y nunca usada en
  `principal.component.ts:28`. La fórmula de agregación de bonos está duplicada 4 veces dentro
  del mismo módulo sin una función compartida.

---

## Preguntas para negocio — bloquean el resto de la Tarea 2.4

No se puede avanzar a Paso 2 (tests de caracterización) ni Paso 4 (diseñar
`ConfiguracionCampania`) sin respuesta a esto:

1. **¿Qué perfiles de usuario acceden hoy a cada uno de los 3 módulos?** Ninguno tiene guard de
   ruta — técnicamente cualquier usuario autenticado puede navegar a los 3. ¿Hay una segmentación
   real por equipo/rol que solo negocio conoce (ej. "el equipo comercial usa incentivos3, el
   equipo de banca usa incentivos-a")?
2. **`incentivos3`: ¿el modelo quedó fijo en `'2026'` porque la campaña 2025 ya cerró
   definitivamente, o hay usuarios que todavía necesitan consultar 2025?** Si ya cerró, el código
   de `changeModel()`/soporte a `'2025'` se puede retirar sin más preguntas.
3. **`incentivos4` (el módulo Angular): ¿es trabajo en curso que se va a terminar, un spike
   descartado, o una confusión de nombres con el namespace de backend?** Esto determina si se
   borra directo (como `incentivos2`) o si hay que preguntar a quien lo empezó qué pensaba hacer.
4. **`incentivos-a`: ¿sigue vigente el cálculo de `incentivos2.*` en el backend, o también está
   en transición?** Y si es el renombre de `incentivos2`, ¿por qué se mantuvo el módulo (en vez
   de borrarlo como se hizo con el otro fork de `incentivos2` que sí se confirmó muerto)?
5. **Fecha de retiro prevista de cada generación** (la pregunta que pide el plan textualmente) —
   sin fecha objetivo no se puede planear el Paso 6 (migración con bandera de activación por un
   ciclo de release) ni decidir cuánto esfuerzo vale la pena invertir en unificar vs. simplemente
   esperar a que se apaguen solas.

## Siguiente paso concreto

Compartir este documento con quien tenga la respuesta de negocio (probablemente el área
comercial/incentivos de Financiera Confianza) y esperar las 5 respuestas de arriba antes de
escribir cualquier test de caracterización o tocar código de producción de la familia
`incentivos`.
