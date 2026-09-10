# ADR-0004: Los recorridos guiados se anclan a selectores estables, no a `id` de tour

- Estado: Vigente
- Fecha: 2026-09-10
- Responsables: Arquitectura frontend

## Contexto

Los recorridos guiados (driver.js, ver [recorridos guiados](../../components/tours-guiados.md)) localizan el elemento de cada paso con un selector CSS en tiempo de ejecución. La primera implementación —el tour del módulo Ranking Kaypacha— resolvió eso sembrando `id` dedicados en las plantillas: `#tour-ranking-panel`, `#tour-info-btn`, `#tour-filtros-btn`, `#tour-ranking-tabla`.

Ese enfoque dejó tres marcas en el código:

1. **Atributos que solo existen para el tour.** `id="tour-filtros-btn"` no dice nada del botón; dice que alguna vez alguien quiso señalarlo.
2. **Un `id` duplicado.** `tour-ranking-tabla` estaba puesto en dos `div` del mismo documento —HTML inválido— y nadie lo notó, porque `document.querySelector` devuelve el primero y el recorrido se veía bien.
3. **Anclas huérfanas.** Al retirar el tour de ese módulo hubo que barrer los cuatro `id`, uno por uno, verificando antes que ningún CSS ni spec los usara.

Mientras tanto, el shell ya ofrecía identificadores naturales y estables para los mismos elementos: `aria-label` en los botones del header, `#tour-sidebar-icons` en el rail, clases de componente en el contenido. La suite E2E los usa desde siempre (`e2e/pages/shell.page.ts` localiza el menú de perfil con `header [role="button"][aria-haspopup="true"]`).

## Decisión

Un paso de tour se ancla a **lo que ya identifica al elemento**: su `id` de negocio, su `aria-label`, su `role`, o la clase del componente.

No se agregan atributos cuya única razón de ser sea que un tour tenga dónde agarrarse. Si un control no es localizable, primero se le da la etiqueta accesible que le falta; el ancla sale de ahí.

Los selectores se declaran en una constante `ANCLA` al principio del catálogo, no repartidos por los pasos.

## Fundamento

- **Un `aria-label` sirve dos veces**: describe el control para un lector de pantalla y lo hace localizable. Un `id="tour-*"` sirve una sola.
- **Acopla menos.** El módulo no tiene que saber que existe un tour. Retirar un recorrido es borrar su catálogo, no auditar plantillas ajenas.
- **La rotura es detectable.** Un selector semántico apunta a algo que el módulo ya sostiene por otras razones; si cambia, hay una compuerta que lo ve (abajo).
- La contra: un `aria-label` es texto de interfaz y se puede reescribir. Por eso la decisión viene acompañada de verificación automática, no de confianza.

## Consecuencias

- `governance/scripts/verificar-anclas-tour.mjs` resuelve cada selector contra las plantillas y estilos reales. Corre en la cadena `verificar` y en `ci`; un ancla rota bloquea.
- Ese verificador también marca como aviso los `id="tour-*"` que quedaron sin ningún paso que los use, para que la deuda del enfoque anterior no se acumule en silencio.
- Cambiar un `aria-label` es ahora un cambio con consecuencias verificadas: la compuerta avisa en el mismo commit.
- Los pasos que apuntan a marcado de librería (`.p-datatable`, `.driver-popover`) no se pueden verificar contra `src/` y se informan aparte. Apoyarse en ellos es aceptar que la librería puede renombrarlos en una actualización.

## Evidencia

```bash
npm run audit:anclas                       # 3 catálogos, 24 pasos, 0 rotas
grep -rn 'id="tour-' src/app | wc -l       # solo las anclas que un paso usa
```

El modo de falla que motivó la compuerta está registrado en [INC-2026-09-09-01](../../evidence/quality/incidents.md): la clase de la luz amarilla del semáforo se renombró de `mis-window-light--minimizar` a `mis-window-light--volver`, y el diálogo que seguía usando el nombre viejo quedó con un botón gris, sin color ni glifo, sin un solo error de compilación.
