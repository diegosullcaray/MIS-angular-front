# Defectos detectados al reparar la suite de tests

> Subproducto de la Tarea 1.3 del [plan](../01-analisis/03-plan-refactorizacion.md).
> **Ninguno se ha corregido.** Cada uno está congelado por un test de caracterización que
> documenta el comportamiento actual. Corregirlos hará fallar su test — eso es lo correcto:
> obliga a actualizarlo conscientemente.

---

## Por qué aparecen ahora

La suite tenía 25 specs en rojo que **nunca se habían ejecutado**: eran plantillas del CLI que
declaraban el componente sin proveer sus dependencias, así que fallaban en el `TestBed` antes
de llegar a tocar el componente.

Al proveer las dependencias (`src/testing/mocks.util.ts`), 21 de esos 25 pasaron a verde de
inmediato. Los 4 restantes siguieron fallando — pero ya no por el andamiaje del test, sino
porque **el componente revienta de verdad**.

---

## D-01 — `RevaComponent.ngOnInit()` lanza siempre

**Archivo:** `modules/reportes/legacy/comercial/rda/sectorista/reva/reva.component.ts:21`

```typescript
export class RevaComponent implements OnInit {
    ngOnInit(): void {
        throw new Error('Method not implemented.');
    }
```

El componente está enrutado en `rda-sectorista-routing.module.ts` con el título
**"REVA Comercial"**. Es el esqueleto que genera el IDE al implementar `OnInit`, publicado sin
rellenar. La pantalla revienta en cuanto se abre.

**Decisión pendiente:** implementar la pantalla o retirar la ruta. No hay una tercera opción.

---

## D-02 — `ReportCrsV6Component` usa un campo cuya asignación está comentada

**Archivo:** `.../support/components/template/crs/report-crs-v6/report-crs-v6.component.ts:206-211`

```typescript
private router(): void {
    this.route.data.subscribe(d => {
      console.log(d)
      /*this.report=new ReportT(crs(d.report));
      this.title_module=d.title;*/
      this.config = this.report.getCount();     // ← report nunca se asigna
    });
}
```

`report: ReportT;` se declara sin inicializar (línea 32) y su única asignación está dentro del
bloque comentado. `ngOnInit` llama después a `this.report.getFilters()`, que lanza
`TypeError`.

El componente sirve la ruta `CLI_VULNERABLE` ("Cliente Vulnerable"). **La pantalla no
funciona.**

Es exactamente el riesgo que describe [H-22](../01-analisis/02-analisis-refactorizacion.md#h-22): código
comentado que no es documentación histórica sino lógica desactivada, indistinguible a simple
vista de una decisión deliberada.

---

## D-03 — `CrsCliActComponent` indexa un `FormArray` como si fuera un array

**Archivo:** `.../rda/sectorista/crs-cli-act/crs-cli-act.component.html:37`

```html
<mat-error *ngIf="formG.controls.cels[i].controls.num_tele.hasError('pattern')">
```

`cels` es un `FormArray`. Indexarlo con `[i]` devuelve `undefined`; lo correcto es
`formG.controls.cels.controls[i]` o `.at(i)`.

Como la expresión vive en el `*ngIf` de un `<mat-error>`, **se evalúa en cada ciclo de
detección de cambios**, no solo cuando hay error de validación. El formulario arranca con dos
entradas en `cels` (`addCels()` se llama dos veces en `ngOnInit`), así que el bucle siempre
tiene elementos y siempre lanza.

---

## D-04 — `TransaccionPopupComponent` enlaza 6 controles que no existen

**Archivo:** `modules/actividades/transaccion/transaccion-popup/` (`.html` y `.ts`)

La plantilla referencia 24 controles con `[formControl]="$any(itemForm).controls['X']"`.
`buildItemForm()` define 29. **Seis de los referenciados no están entre ellos:**

```
estcorresponsal · HMESINST · idcorresponsal · instalado · is_valid · prospecto
```

`FormControlDirective` recibe `undefined` y lanza
`Error: Cannot find control with unspecified name attribute`.

Dos problemas de fondo en la misma plantilla:

1. **`[formControl]` y `formControlName` sobre el mismo `<input>`** (líneas 163 y 169). Es una
   combinación inválida: las dos directivas compiten por el mismo elemento.
2. `$any(...)` desactiva la comprobación de tipos justo en el punto donde habría detectado el
   error en compilación. Es el coste concreto de tener `strictTemplates: false`
   ([H-10](../01-analisis/02-analisis-refactorizacion.md#h-10)).

> La copia gemela en `modules/corresponsales/transaccion/transaccion-popup/` **sí pasa**. Las
> dos versiones han divergido — otro caso del patrón que describe
> [H-08](../01-analisis/02-analisis-refactorizacion.md#h-08).

---

## D-05 — `DynamicFormatPipe` contamina sus propios valores por defecto

**Archivo:** `core/screen/pipes/dynamic-format-pipe.ts` (métodos `decimal`, `percent`, `pbs`, `icon`, `truncate`)

```typescript
decimal(value: number, params: any) {
    let p = mergeObjects(this.formatDefaults.decimal, params ? params : {});
    //              ↑ lodash.merge MUTA su primer argumento
```

`mergeObjects` es `lodash.merge`, que escribe sobre el objeto destino. Como el destino es
`this.formatDefaults.X`, **los parámetros de una llamada quedan grabados en los valores por
defecto de la instancia** y se aplican a todas las siguientes:

```typescript
pipe.decimal(1.23456, null);                  // '1.23'   ✔
pipe.decimal(1.23456, { max_decimals: 4 });   // '1.2346' ✔
pipe.decimal(1.23456, null);                  // '1.2346' ✘ debería volver a ser '1.23'
```

Es **la misma familia de fallo que [H-01](../01-analisis/02-analisis-refactorizacion.md#h-01)**: estado
mutable compartido que sobrevive a la operación que lo creó. Aquí afecta al formato de las
celdas de tabla — es decir, a cuántos decimales ve la fuerza de ventas en un importe.

**Alcance:** el estado es por instancia del pipe, y Angular crea una instancia por punto de
enlace de la plantilla, así que no se propaga entre columnas distintas. El riesgo concreto
está en `custom()`, que resuelve `params` con una función por fila: si dos filas devuelven
parámetros distintos, la segunda hereda los de la primera.

**Corrección:** clonar antes de fusionar —
`mergeObjects(cloneObject(this.formatDefaults.decimal), params ?? {})` — o hacer
`formatDefaults` una constante congelada fuera de la clase.

---

## Triaje sugerido

| Defecto | Pantalla afectada | Alcance | Siguiente paso |
|---|---|---|---|
| D-01 | REVA Comercial | Pantalla inservible | Confirmar con negocio si la sección debe existir |
| D-02 | Cliente Vulnerable | Pantalla inservible | Descomentar y probar, o retirar la ruta |
| D-03 | Clientes Activos (RDA) | Formulario roto al renderizar | Corregir el indexado; 1 línea |
| D-04 | Transacción (Actividades) | Diálogo roto al abrirse | Decidir si sobran los 6 enlaces o faltan los controles |
| D-05 | Todas las tablas | Formato de celda incorrecto en casos concretos | Clonar antes de fusionar; 1 línea |

D-03 y D-04 son correcciones pequeñas. D-01 y D-02 son **decisiones de negocio**: hay dos
secciones publicadas que no funcionan y nadie lo ha reportado, lo que sugiere que nadie las
usa — dato relevante para la telemetría de la [Fase X](../01-analisis/03-plan-refactorizacion.md#fase-x--retirada-de-legacy-paralela).
