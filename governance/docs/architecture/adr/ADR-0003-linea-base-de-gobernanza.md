# ADR-0003: Línea base de gobernanza en lugar de "cero hallazgos"

- Estado: Vigente
- Fecha: 2026-09-07
- Responsables: Arquitectura frontend, QA

## Contexto

Al reescribir el auditor de gobernanza como motor de reglas, la primera corrida sobre 1224 archivos devolvió **7 errores y 122 avisos**, todos preexistentes: interceptores de `core` que importan servicios de `pages`, un modelo de `reportes` importado desde `shared`, 41 servicios sin spec hermano, 62 colores fijos.

Quedaban dos salidas malas:

- **Exigir cero hallazgos**: el pipeline nace rojo y bloquea todo trabajo hasta pagar de golpe una deuda de meses.
- **Dejar el auditor informativo**: la deuda crece sin resistencia y el auditor se vuelve decorativo, que es donde estaba antes.

## Decisión

Se congela la deuda conocida en `governance/gobernanza.linea-base.json` y el criterio del pipeline pasa a ser **cero hallazgos nuevos**.

```bash
node governance/scripts/validar-gobernanza.mjs --guardar-linea-base   # congelar (deliberado)
node governance/scripts/validar-gobernanza.mjs --linea-base --check   # exigir cero nuevos
node governance/scripts/validar-gobernanza.mjs --sin-linea-base       # ver el pasivo completo
```

Cada hallazgo se identifica por `regla|archivo|detalle`: si el archivo cambia de forma que el hallazgo desaparece, deja de estar congelado; si aparece uno equivalente en otro archivo, es nuevo y bloquea.

## Fundamento

La regla que importa no es "el repositorio está limpio" sino "el repositorio no se ensucia más". La línea base permite exigir la segunda desde el primer día, y convierte la primera en trabajo planificable en vez de un bloqueo.

## Consecuencias

- El archivo de línea base es **evidencia de deuda**, no una lista de excepciones aprobadas. Los hallazgos están detallados en la [auditoría de septiembre 2026](../../evidence/quality/auditoria-gobernanza-2026-09.md) con responsable y prioridad.
- **Regenerarla para destrabar un pipeline rojo es esconder deuda, no pagarla.** Solo se regenera al reducirla, y el diff debe mostrar hallazgos que salen, no que entran.
- El archivo tiende a encoger. Si crece entre dos commits, algo se hizo mal.
- Las violaciones congeladas **no son precedente**: no autorizan una nueva del mismo tipo.

## Evidencia

`governance/gobernanza.linea-base.json` — 114 claves de hallazgo congeladas al 2026-09-07, commit `bf91deb`.
