# Calidad del dato

Qué se verifica hoy, qué se verifica a mano y qué no se verifica. La tercera columna es la más importante: una lista de controles sin decir cuáles faltan es una garantía falsa.

## Dimensiones y controles

| Dimensión | Qué significa acá | Control | Estado |
|---|---|---|---|
| **Validez** | el payload tiene la forma que el contrato declara | mapeos puros con specs de `null`, `undefined`, cadena y objeto vacío | Automático, por reporte |
| **Completitud** | la respuesta trae las filas esperadas | distinción explícita entre vacío legítimo y fallo | Automático (`error-no-silenciado`) |
| **Oportunidad** | la cifra corresponde a la fecha de corte pedida | `fec` derivado de `profile.curr_fec`, no del reloj del cliente | Manual, por ficha de reporte |
| **Consistencia** | el mismo dato significa lo mismo en dos pantallas | glosario y conservación de los nombres del contrato | Manual |
| **Alcance** | la cifra corresponde al nodo organizativo pedido | constante `PARAMS_HIER_*` declarada en la ficha | Manual |
| **Trazabilidad** | se puede rastrear la cifra hasta su `cod_rep` | catálogo derivado del código | Automático |
| **Exactitud** | el número es correcto | **fuera de alcance del frontend** | No verificable acá |

La exactitud no se puede verificar desde este repositorio: si Ant calcula mal, el MIS presenta fielmente el cálculo equivocado. Decir lo contrario sería atribuirse una garantía que no se tiene.

## Reglas verificadas automáticamente

`validar-gobernanza.mjs` incluye cuatro reglas cuyo propósito directo es proteger el dato:

| Regla | Qué impide |
|---|---|
| `error-no-silenciado` | que un fallo del backend se muestre como tabla vacía |
| `estados-de-datos` | que una pantalla modele carga sin contemplar error ni vacío |
| `nombres-canonicos` | que constantes, modelos y mapeos se dispersen fuera de su capa |
| `sin-secretos` | que una identidad real o un host de entorno quede en el código |

```bash
node governance/scripts/validar-gobernanza.mjs --regla=error-no-silenciado,estados-de-datos
npm run inventario:check   # el catálogo de cod_rep sigue reflejando el código
```

## Los cuatro casos de prueba obligatorios

Todo servicio que traiga datos los cubre. No son sugerencias: un PR sin ellos se rechaza en la fase de QA.

1. **Respuesta con datos** → las señales publican filas mapeadas, `cargando` vuelve a `false`.
2. **Respuesta vacía legítima** → `vacio()` verdadero, `error()` nulo.
3. **Fallo del backend** → `error()` con mensaje, filas vacías, `vacio()` **falso**.
4. **Payload malformado** → `null`, `undefined`, campos faltantes y montos en cadena no lanzan excepción.

Los casos 2 y 3 son el corazón: si un spec no los distingue explícitamente, la confusión entre vacío y error vuelve sin que nadie lo note.

## Cuando aparece una cifra dudosa

1. Trazarla con el procedimiento de [linaje](./lineage.md) — jerarquía, fecha, mapeo, en ese orden.
2. Si el frontend la alteró: corregir el mapeo y **agregar el spec que la habría detectado**.
3. Si el frontend la presentó fielmente: escalar al propietario funcional del dominio ([responsabilidades](./stewardship.md)).
4. Registrar el incidente en [incidentes de calidad](../evidence/quality/incidents.md) con pantalla, usuario, fecha de corte, `cod_rep`, pasos, resultado esperado y observado.
5. Ningún incidente de dato se cierra sin prueba de regresión.

## Brechas conocidas

Registradas para que nadie asuma cobertura inexistente:

- **41 servicios y utilidades sin spec hermano**, sobre todo en `reportes/**/services/`. Cada uno es un mapeo sin red.
- **No hay verificación automática de `cod_rep` contra los servicios que lo usan**: un código huérfano o duplicado no se detecta.
- **No hay verificación de rutas contra el menú del backend**.
- **No hay reconciliación de cifras contra el sistema legado ni contra el origen.**
- **La ficha de reporte está completa solo para los reportes tocados desde su adopción**; el resto del catálogo tiene código pero no semántica.

Estado y prioridad de cada una: [auditoría de gobernanza](../evidence/quality/auditoria-gobernanza-2026-09.md).
