---
name: angular-mis-zoneless
description: Aplicar las convenciones Angular 22 zoneless de MIS Host al modificar componentes y servicios, con señales para estado y cancelación de consultas. Mantener la estrategia predeterminada sin declaraciones redundantes.
---

# Angular 22 zoneless — MIS Host

Referencia canónica: [convenciones](../../docs/development/conventions.md) y
[ADR-0001](../../docs/architecture/adr/ADR-0001-zoneless-sin-onpush.md).
Leer sus secciones de Angular y datos antes de modificar reactividad.

- Conservar el default de Angular 22 (OnPush). Zoneless programa actualizaciones;
  no elimina ni vuelve irrelevante la estrategia del componente.
- Señales para estado, `computed` para derivaciones; `inject`, `input`, `output`,
  `viewChild` y bloques nativos. Mantener `standalone: true`.
- Servicios: señales privadas y lectura pública con `asReadonly()`. Estado local
  de componente no requiere encapsulación ceremonial.
- Justificar `providedIn: 'root'` si conserva selección entre rutas o infraestructura.
  Para flujos de pantalla, preferir componente/ruta o limpieza explícita al salir.
- Cancelar al cambiar consulta (`switchMap`, cleanup de efecto o suscripción anterior)
  y al destruir consumidor. `takeUntilDestroyed` solo cubre el segundo caso.
- Identidad/permisos/corte invalidan resultados y selecciones; una respuesta antigua
  no debe escribirse bajo filtros o usuario nuevos.
- En un efecto, leer filtros de forma reactiva antes de suscribirse y registrar cleanup:

```typescript
effect((onCleanup) => {
  const consulta = servicio.consultar(filtro()).subscribe({
    next: (filas) => estado.set(filas),
    error: () => error.set('No se pudo consultar.'),
  });
  onCleanup(() => consulta.unsubscribe());
});
```

El consumidor limpia error y datos previos al empezar; mantiene error persistente y
reintento. Las excepciones Ant que significan vacío se adaptan por contrato, nunca
mediante una normalización global. Backend, OAuth y Winder están congelados.
