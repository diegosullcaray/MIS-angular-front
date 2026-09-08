# ADR-0002: El color se aplica por token CSS, no por clase utilitaria

- Estado: Vigente
- Fecha: 2026-09-07 (registro de una decisión ya implementada)
- Responsables: Arquitectura frontend

## Contexto

El sistema visual define ~47 tokens de color `--mis-*` en `src/app/theme/tokens.css`, con sobrescrituras en `.dark`. `PreferenciasService` los reescribe en tiempo de ejecución según el tema, el acento y el fondo que elige el usuario.

Tailwind v4 está configurado **sin bloque `@theme`**, así que esos tokens no generan clases utilitarias. La skill de estilos, sin embargo, documentaba una paleta completa de clases semánticas —`bg-surface-card`, `text-text-primary`, `border-border`, `bg-primary-600`— con **cero usos** en el código. Quien las copiaba obtenía una pantalla sin estilos, sin ningún error de compilación.

## Decisión

El color se aplica de dos formas, ambas sobre los tokens:

```html
<p class="text-[13px] text-[var(--mis-text-secondary)]">…</p>
<div style="background: var(--mis-surface); border-color: var(--mis-border)">
```

Tailwind sigue usándose normalmente para layout, espaciado, tipografía y responsive.

No se agrega un bloque `@theme` que mapee los tokens a clases utilitarias.

## Fundamento

Mapear los tokens a clases produciría dos vocabularios para lo mismo (`bg-surface` y `bg-[var(--mis-surface)]`), y habría que migrar el código existente para que la guía no volviera a mentir. La sintaxis de valor arbitrario ya es la que usan todos los componentes, y hace visible sobre qué token se está apoyando cada regla.

## Consecuencias

- Un hexadecimal fijo en un componente es un defecto: no acompaña al tema oscuro ni al acento del usuario. Lo marca `validar-gobernanza.mjs --regla=tokens-de-color` (62 casos en 28 archivos al momento de este ADR, congelados en la línea base).
- `validar-documentacion.mjs` verifica que toda clase o token citado en las guías exista en `src/`, para que este desfase no pueda repetirse en silencio.
- Si en el futuro se decide agregar `@theme`, requiere ADR nuevo y plan de migración: convivir con los dos vocabularios es peor que cualquiera de los dos.

## Evidencia

```bash
grep -rl "bg-surface-card\|text-text-primary" src/app | wc -l   # 0
grep -c "^\s*--mis-" src/app/theme/tokens.css
node governance/scripts/validar-documentacion.mjs
```
