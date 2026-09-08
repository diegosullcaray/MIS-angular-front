# ADR-0001: Zoneless con señales, sin `ChangeDetectionStrategy.OnPush`

- Estado: Vigente
- Fecha: 2026-09-07 (registro de una decisión ya implementada)
- Responsables: Arquitectura frontend

## Contexto

La aplicación arranca con `provideZonelessChangeDetection()` en `src/app/app.config.ts`: no hay `zone.js` interceptando asincronía. La actualización de la vista depende de que una señal leída en la plantilla cambie, o de un binding de evento.

La documentación de gobernanza exigía `ChangeDetectionStrategy.OnPush` en todo componente. El código nunca lo cumplió: **0 de 236 componentes lo declaran**. La regla escrita y la práctica llevaban tiempo divergiendo, y cada guía nueva reproducía la exigencia.

## Decisión

**No se usa `ChangeDetectionStrategy.OnPush`.** Los componentes se escriben con `standalone: true` explícito y sin declarar estrategia de detección.

## Fundamento

`OnPush` existe para acotar el barrido global que dispara `zone.js`. En una aplicación zoneless ese barrido no existe: Angular refresca solo las vistas marcadas como sucias por una señal o un binding de evento, que es exactamente el comportamiento que `OnPush` buscaba aproximar.

Declararlo, entonces:

- no cambia el comportamiento observable;
- agrega una línea por componente que sugiere una optimización inexistente;
- e introduciría inconsistencia con los 236 componentes ya escritos.

## Consecuencias

- Las guías genéricas de Angular que lo declaran obligatorio **no aplican** en este repositorio.
- Se documenta explícitamente en [`skills/angular-mis-zoneless`](../../../skills/angular-mis-zoneless/SKILL.md) y en el agente desarrollador, para que ninguna guía externa lo reintroduzca.
- El estado debe vivir en señales. Una propiedad de clase mutada a mano no notifica a nadie, y sin `zone.js` tampoco hay barrido accidental que la rescate: eso deja de ser un detalle de rendimiento y pasa a ser un requisito de corrección.
- Si el proyecto volviera a `zone.js`, esta decisión se revierte.

## Evidencia

```bash
grep -rl "ChangeDetectionStrategy.OnPush" src/app --include="*.component.ts" | wc -l   # 0
grep -n "provideZonelessChangeDetection" src/app/app.config.ts
```
