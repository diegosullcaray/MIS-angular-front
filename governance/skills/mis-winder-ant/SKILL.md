---
name: mis-winder-ant
description: Transporte Winder/Ant de MIS Host — el borde real por donde entran todos los datos. Usar al crear un servicio de módulo, agregar una consulta al backend, doblar el backend en una prueba o diagnosticar por qué una pantalla no trae datos. Este sistema NO expone una API REST convencional.
---

# Transporte Winder / Ant — MIS Host

Este es el conocimiento que más veces se da por sabido y más caro sale ignorar: **MIS Host no consume una API REST**. Un servicio escrito contra `http.get('/api/cartera')` compila, pasa el linter y nunca trae un dato, porque ese endpoint no existe en ninguna parte del sistema.

---

## 1. El recorrido de una petición

```text
Componente
  → Servicio del módulo        (traduce respuesta cruda a modelo de pantalla)
    → Mod*Service              (fija puerto, appId, strand y nombre de respuesta)
      → AntService             (helpers get/post/recurso/archivo)
        → WinderService        (serializa Strands, cifra la config en el parámetro `w`)
          → RESTService        (GET v1/g · POST v1/p · POST v1/pf para archivos)
            → Backend Ant      (devuelve IWinderResponse)
```

Cada capa está en `src/app/core/winder/`. Ninguna pantalla las salta.

---

## 2. Las tres piezas del protocolo

### `Strand` — la unidad de petición

Un *strand* nombra una acción del backend y lleva su propio payload. Una petición puede llevar uno o varios.

```typescript
const s = new Strand('table.regular', 'resultado');  // (acción, nombre de la respuesta)
s.pushToPayload('cod_rep', 'RS_BASE_NEG_01');
s.pushToPayload('nom', termino);
```

El segundo argumento es la **clave bajo la cual vendrá la respuesta**, no una etiqueta libre: leerla mal es la causa habitual de "responde 200 y llega `undefined`".

### `IWinderConnectionConf` — a qué módulo del backend se habla

```typescript
{ port: 5304, secret: environment.moduleSecrets.reporting, appId: 'reporting' }
```

Puertos lógicos en uso:

| Puerto | `appId` | Servicio | Dominio |
|---:|---|---|---|
| 6300 | `session` | `ModSysLoginService` | login y perfil |
| 6301 | `admin` | `ModSysAdminService` | jerarquía organizativa |
| 6302 | `app` | `ModDashboardService`, `ModKaypachaService`, `ModPresupuestoService`, `ModIncentivosService`, `ModFrameworkEsgService` | módulos de negocio |
| 5301 | — | `ModSeccionesService` | menú y secciones |
| 5304 | `reporting` | `ModReportesService` | motor de reportes |
| 6304 | — | `ModRep2Service` | reportería secundaria |

### `IWinderResponse` — lo que vuelve

```typescript
{ code: string; headers: unknown; body: unknown; errors?: unknown }
```

`body` viene tipado como `unknown` **a propósito**: el contrato lo define cada strand. Se castea al modelo del módulo en el borde, después de comprobar la forma.

---

## 3. Cómo se agrega una consulta

No se toca `WinderService`. Se agrega un método al `Mod*Service` correspondiente:

```typescript
/** Módulo de Reporting del backend Ant (puerto 5304, appId `reporting`). */
@Injectable({ providedIn: 'root' })
export class ModReportesService extends AntService {
  constructor() {
    super({ port: 5304, secret: environment.moduleSecrets.reporting, appId: 'reporting' });
  }

  public getRegularTableResult(codRep: string, params: Record<string, unknown>, context?: HttpContext) {
    return this.getSimpleResponseString('table.regular', { ...params, cod_rep: codRep }, 'resultado', context);
  }
}
```

Helpers disponibles en `AntService`:

| Helper | Uso |
|---|---|
| `getSimpleResponseString(strand, params, nombreRespuesta, context?)` | GET con un strand y respuesta JSON — el 90% de los casos |
| `getSimpleResponseStringNP(strand, nombreRespuesta)` | GET sin parámetros |
| `getResponseString(strands, options?)` | GET con varios strands en una sola petición |
| `getSimpleResponseResource(strand, params, nombreRespuesta)` | descarga binaria (blob) |
| `postResponseString(strands)` | POST JSON |

Enviar varios strands juntos es la forma correcta de traer bloques relacionados: una petición en vez de N.

---

## 4. Consumirlo desde el servicio del módulo

```typescript
@Injectable({ providedIn: 'root' })
export class BaseNegativaService {
  private readonly ant = inject(ModReportesService);

  readonly resultados = signal<Record<string, unknown>[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  consultar(codigo: string): void {
    this.cargando.set(true);
    this.error.set(null);

    this.ant.getRegularTableResult(COD_BASE_NEGATIVA, { nom: codigo }).subscribe({
      next: (respuesta) => {
        const cuerpo = respuesta.body as BaseNegativaResponseBody | null;
        this.resultados.set(cuerpo?.resultado?.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el resultado de la consulta.');
        this.cargando.set(false);
      },
    });
  }
}
```

Tres cosas a mirar: el encadenamiento opcional sobre `body` (la forma no está garantizada por el tipo), el `?? []` para una respuesta sin filas, y que el error **no** se degrada a lista vacía.

---

## 5. Las dos fronteras de datos

El sistema tiene dos, y todo servicio debe declarar a cuál pertenece:

| Frontera | Transporte | Cabeceras |
|---|---|---|
| **Winder / Ant** | `Strand`, `Winder-Params`, parámetro `w` cifrado, `IWinderResponse` | sin `Authorization`: el interceptor lo excluye |
| **Host / API** | HttpClient directo | `Authorization` y `X-User-Role`, salvo login y Google |

Casi todo el dato de negocio entra por Winder. Si vas a usar la frontera Host, documentá el contrato antes ([api-contracts](../../docs/data/contracts/README.md)).

---

## 6. Doblarlo en pruebas

Se dobla el `Mod*Service`, nunca `WinderService` ni `HttpClient`: es el borde estable.

```typescript
const getRegularTableResult = vi.fn(() => of({ code: '0', headers: {}, body: { resultado: { data: [] } } }));
TestBed.configureTestingModule({
  providers: [{ provide: ModReportesService, useValue: { getRegularTableResult } }],
});
```

En E2E se intercepta la ruta del protocolo, no una URL REST:

```typescript
await page.route('**/v1/g**', (route) => route.fulfill({ json: { resultado: { data: [] } } }));
```

---

## 7. Riesgo conocido, y qué se puede afirmar

`secret` viene de `src/environments/`, o sea que **está compilado en el bundle público**. Una clave dentro de JavaScript descargable no es un secreto, y el esquema AES-CBC con IV fijo no aporta autenticidad. Está documentado en [`security/findings.md`](../../docs/security/findings.md) y la remediación exige cambiar el modelo del backend, no mover la cadena de archivo.

Lo que corresponde hacer mientras tanto:

- No agregar secretos nuevos ni ampliar su superficie.
- No tratar el cifrado Winder como control de autorización: **la autorización la resuelve el backend**.
- No cachear respuestas financieras en el service worker (`ngsw-config.json` no declara regla de API a propósito).

---

## 8. Diagnóstico rápido

| Síntoma | Causa habitual |
|---|---|
| 200 y `body.<algo>` es `undefined` | el nombre de respuesta del strand no coincide (`'resultado'` vs `'result'`) |
| Llega `[]` siempre | falta `cod_rep`, o el nodo de jerarquía no se está enviando |
| 500 en un bloque puntual | Ant responde 500 a un bloque vacío conocido: usar `regularTolerante()`, no un `catchError` genérico |
| Cifras de otro usuario | caché de jerarquía sin invalidar tras cambiar a usuario alterno |
| Números como `NaN` | el backend mandó el monto como cadena formateada y el mapper asumió `number` |
