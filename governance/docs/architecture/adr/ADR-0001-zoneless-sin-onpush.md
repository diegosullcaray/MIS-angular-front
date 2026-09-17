# ADR-0001: Zoneless y estrategia predeterminada de Angular 22

- Estado: Vigente; fundamento corregido el 2026-09-17
- Fecha original: 2026-09-07
- Responsables: Arquitectura frontend

## Contexto

La aplicación usa `provideZonelessChangeDetection()` y no carga `zone.js`.
Zoneless define cómo se notifica y programa la detección de cambios; la estrategia
del componente es un concepto distinto. La ausencia de una declaración explícita
no permite concluir que no se usa OnPush.

## Decisión

Conservar la estrategia predeterminada de Angular 22, sin escribir una declaración
redundante en cada componente. Mantener `standalone: true` explícito por convención.
Angular 22 tiene OnPush como valor predeterminado. No afirmar que OnPush no aporta
o no cambia el comportamiento por ser zoneless.

## Consecuencias

- Estado observable en señales; derivaciones en `computed` y efectos con cleanup.
- Cancelar tanto al destruir el consumidor como al cambiar filtros.
- Un cambio de estrategia requiere justificación y pruebas, no una regla copiada.
- La explicación anterior «sin barrido global OnPush no cambia nada» era incorrecta
  como afirmación general. Se corrige el fundamento, no la convención de declaración.

## Referencias

- [Angular: ChangeDetectionStrategy](https://angular.dev/api/core/ChangeDetectionStrategy)
- [Angular: zoneless](https://angular.dev/guide/zoneless)
- [Convenciones del repositorio](../../development/conventions.md)
