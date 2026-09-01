# Anatomía de un módulo

Cómo se organiza por dentro un módulo de negocio, y **dónde va cada cosa**.
La regla de fondo es una sola: *un service solo hace peticiones al backend*.
Todo lo demás tiene su carpeta.

## Las cinco carpetas

```
pages/modules/<modulo>/
├── constantes/     los `cod_rep` y toda la configuración literal
├── models/         tipos del dominio y del payload
├── utils/          funciones puras: payload crudo → modelo
├── services/       SOLO peticiones
└── items/          los componentes de pantalla
    └── <pantalla>/
```

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

### `items/`

Un componente por pantalla, con su `.ts`, `.html` y su `.spec.ts`. Los que solo
muestran una tabla de un bloque extienden `ReporteSimpleBase`.

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
