# TODO/FIXME convertidos en tickets — Tarea 1.5, Paso 3

> Documento 4 de 4 de la bitácora de ejecución. Cierra el Paso 3 de la Tarea 1.5
> ([plan](../01-analisis/03-plan-refactorizacion.md#tarea-15--eliminar-el-código-comentado)).

## Por qué solo 5 y no 69

El análisis original ([H-22](../01-analisis/02-analisis-refactorizacion.md#h-22), commit base `f34f81f`)
contó **69** ocurrencias de `TODO`/`FIXME`/`HACK`. A la fecha de este documento quedan **5**
marcadores reales — el resto vivía dentro de los ~3.500 líneas de código comentado que ya se
eliminaron en los commits previos de la Tarea 1.5 (Pasos 1-2): al borrar un bloque de código
muerto que contenía un `//TODO` suelto, el TODO desapareció con él. No se perdió información:
ese código ya no existe y no había ninguna decisión pendiente asociada a él que no fuera "borrar
código muerto", que es justamente lo que se hizo.

Este documento cubre los 5 marcadores que sí siguen en código activo.

---

## MIS-01 — `RESTService.delete()` sin implementar

**Archivo:** `src/app/core/data/remote/rest/rest.service.ts:29-31`

```typescript
public delete(config:RESTPacket){
    //TODO
}
```

Método público vacío. `grep` de `restService.delete(` en todo `src/app`: **cero
consumidores**. El protocolo HTTP hoy solo usa `get`/`post` (ver `RESTPacket.computeURL()` y
los tests de caracterización de la Tarea 1.3).

**Decisión pendiente:** ¿se necesita soporte DELETE en algún flujo futuro, o es superficie de
API muerta desde que se escribió el servicio? Si nadie lo reclama, se elimina en un futuro
barrido de código muerto (no en este, que solo toca comentarios).

**Prioridad sugerida:** baja — no bloquea nada, no se usa.

---

## MIS-02 — `RESTService.update()` sin implementar

**Archivo:** `src/app/core/data/remote/rest/rest.service.ts:32-34`

```typescript
public update(config:RESTPacket){
    //TODO
}
```

Mismo caso que MIS-01: método público vacío, cero consumidores en todo `src/app`.

**Decisión pendiente:** igual que MIS-01 — confirmar si hace falta o se retira.

**Prioridad sugerida:** baja.

---

## MIS-03 — `WinderService.delete()` sin implementar

**Archivo:** `src/app/core/data/remote/winder/winder.service.ts:104-106`

```typescript
public delete() {
    //TODO
}
```

Equivalente a MIS-01 pero en la capa Winder (el protocolo propietario, no el REST genérico).
Cero consumidores encontrados (ninguna subclase de `AntService` lo invoca).

**Decisión pendiente:** igual que MIS-01/02, evaluar junto con esos dos — es el mismo patrón
repetido en las dos capas de transporte.

**Prioridad sugerida:** baja.

---

## MIS-04 — `WinderService.update()` sin implementar

**Archivo:** `src/app/core/data/remote/winder/winder.service.ts:108-110`

```typescript
public update() {
    //TODO
}
```

Mismo caso que MIS-03.

**Decisión pendiente:** igual que MIS-01/02/03.

**Prioridad sugerida:** baja.

---

## MIS-05 — `AuthService` no recuerda la URL al redirigir a login

**Archivo:** `src/app/system/session/authentication/auth.service.ts:73-76`

```typescript
private navigateToLoginPage() {
    // TODO: Remember current URL
    this.router.navigateByUrl(environment.rootPage);
}
```

Cuando la sesión termina o falla (`session_terminated`/`session_error`, ver el `subscribe` de
`oauthService.events` unas líneas arriba), el usuario siempre vuelve a `environment.rootPage`
tras el login, sin importar en qué pantalla estaba. Es una brecha de UX real, no código muerto:
cada vez que a un asesor se le vence el token a mitad de una tarea, pierde el lugar donde
estaba.

**Decisión pendiente:** definir el mecanismo (guardar la URL en `sessionStorage` antes de
redirigir, leerla después del login) y si aplica a los tres casos que llaman a
`navigateToLoginPage()` o solo a la expiración de sesión (no al logout explícito, donde
volver al punto anterior no tiene sentido).

**Prioridad sugerida:** media — impacta la experiencia de toda la fuerza de ventas, pero no es
un bug (nada se rompe, solo es menos cómodo).

---

## Resumen

| ID | Archivo | Prioridad | Estado |
|---|---|---|---|
| MIS-01 | `rest.service.ts:29` | Baja | Pendiente de decisión (¿se usa o se retira?) |
| MIS-02 | `rest.service.ts:32` | Baja | Pendiente de decisión (¿se usa o se retira?) |
| MIS-03 | `winder.service.ts:104` | Baja | Pendiente de decisión (¿se usa o se retira?) |
| MIS-04 | `winder.service.ts:108` | Baja | Pendiente de decisión (¿se usa o se retira?) |
| MIS-05 | `auth.service.ts:73` | Media | Pendiente de implementación |

Los comentarios en el código se reescribieron como `// TODO(MIS-0X): <resumen>` apuntando a
este documento.
