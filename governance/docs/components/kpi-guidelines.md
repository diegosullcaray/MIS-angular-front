# KPI guidelines

Los KPI deben representar una metrica de negocio ya mapeada por el modulo. El componente visual no debe interpretar el payload del backend.

## Reglas

- Usar tokens `--mis-*` para superficie, texto, borde y estados.
- Diferenciar valor principal, comparativo, delta y cumplimiento.
- La polaridad la define el negocio: un descenso puede ser favorable para mora y desfavorable para colocacion.
- Montos y conteos normalmente no muestran decimales; porcentajes y tasas conservan la precision significativa.
- En movil, el contenido debe poder reducirse sin cortar la etiqueta ni ocultar el valor.

## Composición visual de la tarjeta

Para KPI nuevos o rediseñados, seguir la [jerarquía de vidrio adaptativo](./design-system.md#dirección-visual-vidrio-adaptativo). El ejemplo implementado está en `src/app/pages/modules/reportes/components/actividad-diaria/components/Cartera/items/cartera-agricola-cultivos/`: su clase `.agro-kpi` es local al reporte, no un reemplazo global de `.kpi-card`.

1. **Etiqueta breve arriba:** visible completa y con menor peso que el dato. No truncar un nombre de métrica que cambia su significado.
2. **Valor principal al centro:** mayor tamaño, cifras tabulares y unidad reconocible (`S/`, `%`, clientes). Permitir que un importe largo envuelva o reduzca tamaño sin desbordar.
3. **Comparativo al pie:** separar visualmente el período anterior y el delta. El signo y una flecha acompañan al color; si no hay cambio, no inventar una tendencia.
4. **Material:** borde fino, sombra suave, esquina amplia y un solo brillo decorativo discreto. Usar una capa de superficie suficientemente opaca bajo el texto; el desenfoque es progresivo.
5. **Semántica:** `--mis-success` y `--mis-danger` expresan el resultado definido por el negocio. No equiparar automáticamente número positivo con resultado favorable.

La tarjeta mantiene el mismo orden de lectura en claro, oscuro y móvil. En una fila de cuatro KPI, comprobar etiquetas extensas y valores grandes; si el espacio no alcanza, dejar que el pie envuelva antes que reducir el texto a un tamaño ilegible.

## Evidencia

El patron se usa en reportes y se valida con specs de componentes y E2E responsive. Para una migración visual, revisar capturas en claro y oscuro, con fondo fotográfico y plano, y con el ancho móvil. Las reglas concretas del KPI deben vivir junto al modelo del modulo cuando dependan de una meta o formula particular.
