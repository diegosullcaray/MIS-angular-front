# Session and preferences

Las preferencias de interfaz y el cierre de sesion son responsabilidades separadas de los contratos de negocio.

- Las preferencias se saneen antes de persistirse.
- El cierre debe limpiar almacenamiento, cookies visibles, caches y service workers cuando sea posible.
- Las preferencias no deben transportar autorizacion.
- El usuario alterno debe invalidar el contexto de jerarquia y reportes cacheado.

## Donde vive cada pieza

Las preferencias son del **shell**, no infraestructura: quien las lee y las
pinta es el layout. Por eso viven con el, y no en `core/`.

```text
pages/full-pages/layout/
  interfaces/preferencias.model.ts          forma, valores de fabrica y saneamiento
  interfaces/preferencias-almacen.model.ts  el contrato de persistencia y su token
  interfaces/anuncio.model.ts               el comunicado y el token de su catalogo
  constantes/anuncios.constantes.ts         el catalogo publicado hoy
  services/preferencias.service.ts          el caso de uso
  services/anuncios.service.ts              que comunicado toca y si ya se leyo
  services/comunicados-sesion.service.ts    lo leido en ESTA sesion de navegacion
  services/preferencias-local-storage.service.ts   la persistencia
  services/apariencia-dom.service.ts        preferencias -> variables CSS

pages/modules/home/services/recientes.service.ts   historial de reportes del Home
pages/full-pages/auth/service/limpieza-sesion.service.ts   el borrado al cerrar sesion
core/services/almacenamiento-navegador.service.ts  envoltorio de storage, cookies y caches
theme/color.util.ts · theme/contraste.util.ts      aritmetica de color
```

Hasta el 2026-09-08 todo esto estaba en `core/preferencias/`, partido en
`dominio/`, `aplicacion/` e `infraestructura/`. Se disolvieron esas tres capas:
eran vocabulario DDD que ningun otro rincon del repositorio usa, y obligaban a
`core/` a conocer pantallas — dos de los cinco hallazgos `core-aislado` eran de
`recientes`, que importaba `MenuStgService` y `SEGMENTO_LABELS` del layout.

Lo que **no** bajo al layout, y por que:

| Pieza | Vive en | Motivo |
|---|---|---|
| `almacenamiento-navegador` | `core/services/` | Envuelve `localStorage`, cookies y caches. No conoce ninguna pantalla. |
| `limpieza-sesion` | `auth/service/` | Su unico consumidor es `AuthService`. |
| `color.util`, `contraste.util` | `theme/` | Los consumen tambien las pruebas de contraste de la paleta y las de armonia de graficos. Dejarlos en el layout obligaria a `theme/` y `shared/` a importar de una pantalla. |
| `ModoTema` | `shared/services/theme.service.ts` | El dueno del tema es `ThemeService`; las preferencias solo lo persisten. |

Quedan dos consumos de pantalla a pantalla, asumidos: el Home lee `recientes()`
y `AuthService` llama `olvidar()` al cerrar sesion. Los dos son hojas usando el
servicio del shell, que es de donde son las preferencias.

## Comunicados: dos memorias distintas

El diálogo del comunicado ofrece dos salidas, y no significan lo mismo:

| Acción | Dónde se guarda | Cuánto dura |
|---|---|---|
| **Entendido**, la X, o clic fuera | `sessionStorage`, clave `mis.comunicados.sesion` (`ComunicadosSesionService`) | Esta sesión de navegación. Sobrevive a un F5; muere con la pestaña y con el cierre de sesión. |
| **No mostrar este comunicado** | `localStorage`, dentro de `mis.preferencias` → `anuncios.vistos` | Permanente. |
| Interruptor de Configuración → Comunicados | `localStorage`, `anuncios.silenciar` | Permanente, y apaga **todos**, incluidos los que aún no se publicaron. |

Hasta el 2026-09-08 las dos primeras hacían casi lo mismo: "Entendido" persistía
igual que "No mostrar", y el botón del pie disparaba el interruptor global. Ver
INC-2026-09-08-05.

`sessionStorage` y no una señal en memoria es deliberado: recargar la página no
puede revivir un aviso que el usuario acaba de cerrar.

**Efecto del borrado de sesión.** `LimpiezaSesionService.limpiarTodo()` vacía
`localStorage` entero, así que en la práctica "No mostrar este comunicado" dura
hasta el próximo cierre de sesión. Es una consecuencia conocida de la política
de borrado total, no un defecto del diálogo.
