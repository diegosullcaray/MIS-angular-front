# KPI guidelines

Los KPI deben representar una metrica de negocio ya mapeada por el modulo. El componente visual no debe interpretar el payload del backend.

## Reglas

- Usar tokens `--mis-*` para superficie, texto, borde y estados.
- Diferenciar valor principal, comparativo, delta y cumplimiento.
- La polaridad la define el negocio: un descenso puede ser favorable para mora y desfavorable para colocacion.
- Montos y conteos normalmente no muestran decimales; porcentajes y tasas conservan la precision significativa.
- En movil, el contenido debe poder reducirse sin cortar la etiqueta ni ocultar el valor.

## Evidencia

El patron se usa en reportes y se valida con specs de componentes y E2E responsive. Las reglas concretas del KPI deben vivir junto al modelo del modulo cuando dependan de una meta o formula particular.
