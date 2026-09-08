# Transporte Winder / Ant

El borde por el que entra casi todo el dato de negocio. Está documentado acá porque no se deduce del código de una pantalla y porque su ausencia en la documentación llevó a escribir servicios contra endpoints REST que no existen.

## Qué es

Winder es un protocolo de transporte sobre HTTP hacia el backend Ant. No es REST: no hay recursos ni verbos por entidad. Una petición declara uno o más *strands* (acciones con payload), los serializa en la cabecera `Winder-Params`, cifra la configuración en el parámetro `w` y la envía a una de tres rutas fijas.

```text
GET  v1/g    consulta
POST v1/p    escritura JSON
POST v1/pf   escritura multipart (archivos)
```

## Capas

| Capa | Archivo | Responsabilidad |
|---|---|---|
| `RESTService` | `core/winder/rest/rest.service.ts` | HTTP crudo con `RESTPacket` |
| `WinderService` | `core/winder/winder/winder.service.ts` | serializa strands, cifra la config en `w` |
| `AntService` | `core/winder/ant/ant-service.class.ts` | helpers GET/POST/recurso/archivo |
| `Mod*Service` | `core/winder/instances/` | fija puerto, `appId`, strand y nombre de respuesta |
| Servicio de módulo | `pages/modules/<m>/services/` | traduce respuesta cruda a modelo de pantalla |

Una pantalla nunca salta capas: habla con el servicio de su módulo.

## Contratos

```typescript
interface IWinderConnectionConf { port: number; secret: string; appId: string; }
interface IWinderRequestConfig  { responseType: 'JSON' | 'resource'; options?: Record<string, unknown>; strands: Strand[] | Strand; }
interface IWinderResponse       { code: string; headers: unknown; body: unknown; errors?: unknown; }
```

`body` es `unknown` a propósito: la forma la define cada strand, y se castea en el borde del módulo tras comprobarla.

Un `Strand` se construye con `(acción, nombreDeRespuesta)`. El segundo argumento es la clave bajo la que llegará la respuesta, no una etiqueta libre: leerla mal produce un 200 con `undefined`.

## Módulos del backend

| Puerto | `appId` | Servicio | Dominio |
|---:|---|---|---|
| 6300 | `session` | `ModSysLoginService` | login y perfil |
| 6301 | `admin` | `ModSysAdminService` | jerarquía organizativa |
| 6302 | `app` | `ModDashboardService`, `ModKaypachaService`, `ModPresupuestoService`, `ModIncentivosService`, `ModFrameworkEsgService` | módulos de negocio |
| 5301 | — | `ModSeccionesService` | menú y secciones |
| 5304 | `reporting` | `ModReportesService` | motor de reportes |
| 6304 | — | `ModRep2Service` | reportería secundaria |

## Reglas de gobierno

1. Agregar una consulta es agregar un método al `Mod*Service` correspondiente. No se modifica `WinderService`.
2. Cada servicio declara a qué frontera pertenece: Winder/Ant (sin `Authorization`) u Host/API (con `Authorization` y `X-User-Role`).
3. Los nombres del backend se conservan en el DTO; el renombrado al modelo de vista queda documentado.
4. Un cambio incompatible de strand exige ADR, prueba de contrato y plan de migración.
5. En pruebas se dobla el `Mod*Service`, no `WinderService` ni `HttpClient`.

## Riesgo abierto

`secret` proviene de `src/environments/` y por lo tanto viaja en el bundle público. Una clave dentro de JavaScript descargable no es un secreto, y AES-CBC con IV fijo no aporta autenticidad. Ver [hallazgos de seguridad](../../security/findings.md) y [plan de remediación](../../security/remediation-plan.md): la corrección exige cambiar el modelo del backend, no mover la cadena de archivo.

El cifrado Winder **no es un control de autorización**. La autorización la resuelve el backend.

## Ver también

- Guía operativa para agentes y desarrolladores: [`skills/mis-winder-ant`](../../../skills/mis-winder-ant/SKILL.md)
- Recorrido completo de una petición: [data flow](../../architecture/data-flow.md)
- Contratos por dominio: [API contracts](./README.md)
