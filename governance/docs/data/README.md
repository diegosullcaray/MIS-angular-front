# Gobierno del dato

Esta área existe porque el MIS presenta cifras financieras sobre las que se toman decisiones. Un componente roto se ve; **un número equivocado no**. Un reporte puede compilar, pasar sus pruebas y mostrar el dato de una agencia cuando el negocio esperaba el de una unidad: todos los tests verdes, la cifra mal.

El gobierno del dato es lo que hace esa diferencia visible antes de que llegue al usuario.

## Los seis documentos

| Documento | Responde a |
|---|---|
| [Glosario](./glossary.md) | ¿Qué significa este término? |
| [Catálogo](./catalog.md) | ¿Qué datos consume el sistema y de dónde salen? |
| [Contratos](./contracts/README.md) | ¿Cuál es la forma exacta del dato en el borde? |
| [Linaje](./lineage.md) | ¿Por dónde pasó esta cifra antes de llegar a la pantalla? |
| [Calidad](./quality.md) | ¿Cómo sé que este dato es correcto? |
| [Clasificación](./classification.md) | ¿Qué cuidado requiere este dato? |
| [Responsabilidades](./stewardship.md) | ¿Quién decide sobre este dato? |

## Principios

1. **El frontend no es fuente de verdad.** El backend crea y corrige el dato; acá se transforma para presentarlo. Ninguna corrección de negocio se resuelve con un mapeo del cliente.
2. **La autorización pertenece al backend.** Ocultar un ítem del menú o poner un guard no es un control de acceso al dato: es presentación.
3. **Un dato sin contrato no se muestra.** `cod_rep`, motor, parámetros, jerarquía, fecha de corte y forma de respuesta se documentan antes de que la pantalla exista.
4. **Vacío y error son estados distintos.** Una tabla sin filas es una respuesta válida; una consulta fallida no. Confundirlos es el defecto que degradó al sistema legado, y es una regla verificada automáticamente.
5. **Los nombres del backend se conservan en el borde.** El DTO usa el vocabulario del contrato; el renombre al modelo de vista queda registrado. Nadie inventa sinónimos de `cod_rep`, `tip_cod`, `cod_rel` o `fec`.
6. **Toda cifra debe poder rastrearse hasta su origen.** Si no se puede decir de qué `cod_rep`, qué nodo y qué fecha de corte salió un número, ese número no está gobernado.
7. **Lo que se puede derivar del código, se deriva.** Un catálogo escrito a mano miente al primer commit.

## Las tres preguntas antes de mostrar un dato

Un dato del MIS no queda determinado por su `cod_rep`. Necesita las tres:

```text
¿QUÉ?      cod_rep + motor de reporte     → identifica la consulta
¿DE DÓNDE? nodo de jerarquía (tip_cod, cod_rel) → delimita el alcance organizativo
¿DE CUÁNDO? fecha de corte (fec / fecha)  → fija el momento
```

Faltando cualquiera de las tres, la cifra es plausible y equivocada. Es el modo de falla más caro de este sistema y el que ninguna prueba unitaria detecta por sí sola. Ver [linaje](./lineage.md).

## Qué NO se gobierna acá

Honestidad sobre el alcance, para que nadie lea garantías que no existen:

- **La calidad del dato en origen.** Si Ant devuelve una cifra mal calculada, este frontend la presenta fielmente. La corrección pertenece al backend.
- **La autorización efectiva.** Se documenta el [modelo de acceso](./contracts/access-model.md), pero su cumplimiento lo ejecuta el backend.
- **La retención y el ciclo de vida del dato.** Es responsabilidad del sistema que lo almacena; acá solo se registra qué se consume.
- **El linaje aguas arriba del backend.** Termina en el strand de Ant: qué alimenta a Ant está fuera de este repositorio.

## Cómo se verifica

```bash
npm run inventario        # regenera el catálogo de cod_rep desde el código
npm run audit:docs        # referencias y símbolos citados que ya no existen
npm run audit:governance  # reglas de aislamiento, contratos y estados de datos
```

Reglas del auditor que protegen directamente al dato: `error-no-silenciado`, `estados-de-datos`, `sin-secretos`, `nombres-canonicos`. Ver [compuertas de calidad](../development/quality-gates.md).
