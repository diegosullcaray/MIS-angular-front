# Anatomía de un módulo

Cómo se organiza por dentro un módulo de negocio, y **dónde va cada cosa**.
La regla de fondo es una sola: *un service solo hace peticiones al backend*.
Todo lo demás tiene su carpeta.

## Las carpetas

```
pages/modules/<modulo>/
├── constantes/     los `cod_rep` y toda la configuración literal
├── models/         tipos del dominio y del payload
├── utils/          funciones puras: payload crudo → modelo
├── services/       SOLO peticiones
├── ui/             clases base y piezas compartidas entre los items
└── items/          los componentes de pantalla
    └── <pantalla>/
```

`ui/` solo aparece cuando hay algo que compartir: si el módulo tiene una sola
pantalla, no existe.

En `reportes`, que es el módulo grande, esa misma estructura se repite por
subárea (`Cartera`, `Cartera en Mora`, `Captaciones`, …). Cada una es un módulo
con sus propias carpetas.

### `constantes/`

Los códigos de reporte y cualquier valor literal que el backend imponga:
parámetros fijos, mapas de semáforo, índices de fila, tramos, colores que el
legado fija a mano.

```typescript
/** Reportes del motor `table.regular`, legado `repositorio/*`. */
export const COD_CARTERA_REPO = {
  /** Estructura de Desembolsos — `repositorio/desembolsos`. */
  estructuraDesembolsos: 'RS_DESEMB_01',
  /** CMG Cartera — tabla. Ojo: espera `codrel`/`Fecha`/`tipcod`. */
  cmgCarteraTabla: 'CMG_CARTERA_01',
} as const;
```

Cada clave lleva en su comentario **la ruta del legado y, si importa, el host**:
es lo que hace falta para rastrear un reporte. Con eso, el comentario del método
del service ya no necesita repetirlo y se queda con el nombre de la pantalla.

Los reportes de varios bloques van como array, en el orden en que se consumen:

```typescript
export const TABLAS_GESTION_COMERCIAL = [
  COD_CARTERA_REPO.gestionComercial,
  COD_CARTERA_REPO.gestionComercialVarSaldo,
  COD_CARTERA_REPO.gestionComercialVarClientes,
] as const;
```

### `models/`

Los tipos: la forma del payload crudo, la forma del resultado que consume la
pantalla, y las funciones de dominio que operan sobre ellos (por ejemplo,
`kpisDeFilaTotal`). Nada de HTTP.

### `utils/`

El mapeo del payload al modelo. Funciones puras, testeables sin `TestBed`:

```typescript
/** Marca las columnas con su columna de control, para que la tabla pinte el punto. */
export function conColumnasSemaforo(columnas: ColumnaDinamica[]): ColumnaDinamica[] {
  return columnas.map((c) =>
    SEMAFOROS_CMG_CARTERA[c.key] ? { ...c, semaforoKey: SEMAFOROS_CMG_CARTERA[c.key] } : c,
  );
}
```

Lo que es compartido por todo el módulo `reportes` vive en
`reportes/utils/reportes-mapeo.util.ts`: `mapearBloqueReporte`,
`mapearTablaRegular`, `resultadoCrudo`, `tablaDeResultado`, `filasDeResultado`.

### `services/`

Arman la petición y devuelven el `Observable`. Nada más:

```typescript
@Injectable({ providedIn: 'root' })
export class CarteraRepositorioService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly reportes = inject(ModReportesService);

  /** Estructura de Desembolsos, con la coloración condicional de la fila de distribución. */
  estructuraDesembolsos(nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    return this.bloques
      .tablaRegularCon(COD_CARTERA_REPO.estructuraDesembolsos, this.paramsConFecha(nodo))
      .pipe(map(aplicarEstilosEstructuraDesembolsos));
  }
}
```

Si un método hace algo que no sea pedir y encadenar un mapeo, ese algo va a
`utils/`.

### `ui/`

Lo que varias pantallas del módulo comparten: casi siempre una clase base con el
estado y el flujo repetido.

La regla para crear una: **cuando el mismo bloque aparece en tres o más items**.
Antes de eso, duplicar es más barato que abstraer sobre un patrón que todavía no
se estabilizó.

Las que hay hoy:

| Base | Dónde | Qué aporta |
|---|---|---|
| `ReporteSimpleBase` | `reportes/ui/reporte-simple/` | Reporte de un bloque con selector de jerarquía: consulta en un `effect`, así que cambiar un filtro vuelve a consultar solo |
| `ReporteBloquesBase` | `reportes/ui/reporte-simple/` | La variante de varios bloques |
| `ReporteReasignadoTabsBase` | `Portafolio Reasignado/ui/` | Reporte con pestañas propias |
| `SelectorAsesorBase` | `analista/ui/` | El selector de asesor: carga la lista una vez y expone `asesores`/`asesorSeleccionado`/`cargando` |
| `ReporteAsesorBase<T>` | `analista/ui/` | Lo anterior más el flujo completo: consulta, vuelca el resultado, avisa si vino vacío y maneja el error |

### `items/`

Un componente por pantalla, con su `.ts`, `.html` y su `.spec.ts`. La mayoría
extiende una base de `ui/` y solo aporta lo suyo.

Un reporte de asesor completo queda así —el componente no repite ni la carga de
la lista, ni el estado de carga, ni los toasts:

```typescript
export class SegurosComponent extends ReporteAsesorBase<ReporteSeguros> {
  private readonly servicio = inject(SegurosService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene seguros registrados…';
  protected override readonly errorDeCarga = 'No se pudo cargar los seguros';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerSeguros(this.nodoDe(asesor));
  }

  protected recibir({ tabla1 }: ReporteSeguros): boolean {
    this.tabla1.set(tabla1);
    return this.sinFilas(tabla1);
  }
}
```

En el spec hay que proveer `AsesorSecService`: la lista de asesores la pide la
base, no el service de la pantalla.

## Cómo se agrega un reporte

1. **La constante.** Agregá el `cod_rep` a `constantes/`, con su ruta del legado
   y su host.
2. **El modelo**, si el reporte devuelve algo más que una tabla (KPIs, gráficos,
   varias tablas).
3. **El mapeo** en `utils/`, si el payload necesita algo más que
   `mapearTablaRegular`.
4. **El método del service**: una llamada a `BloqueReporteService` con el método
   que corresponda al motor.
5. **El componente** en `items/`, y su ruta en el `.routes.ts` del módulo.
6. **Los tests**: unitario del mapeo, unitario del componente y, si es una
   pantalla con navegación propia, un E2E.

## Cómo se comenta

El comentario dice **por qué**, no qué. Lo que se lee del código no se comenta:

```typescript
// ❌ Pide el reporte de estructura de desembolsos.
// ✅ El legado manda territorio y corredor en '0' fijo: este reporte no usa la
//    jerarquía, trae el ranking completo y filtra del lado del cliente.
```

Y se mantiene corto. Si un bloque pasa de ocho o nueve líneas, casi siempre está
explicando tres cosas y conviene repartirlas: el contrato del backend va en la
constante, la regla de negocio en el modelo y el porqué de la implementación
junto al código que lo necesita.
