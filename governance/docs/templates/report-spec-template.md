# Ficha de reporte: nombre

## Identidad

- Dominio:
- Submodulo:
- Ruta Host:
- Ruta legado/`act_sec`:
- Responsable funcional:

## Jerarquia

- Constante `PARAMS_HIER_*`:
- `cod_jer`:
- Nivel minimo y maximo:
- Campos enviados: `tip_cod`, `cod_rel`, nodo completo u otros:
- Fecha de corte: `fec`, `fecha` o ninguna:
- Formato de fecha:
- Fallback sin fecha:

## Contrato backend

- `cod_rep` o strand:
- Host legado:
- Motor: `regularData` | `table.regular` | `graphicData` | `reportData`:
- Servicio Ant:
- Nombre de respuesta:
- Parametros fijos:
- Parametros de filtros:
- Paginacion:
- Bloques y orden:

## Gobierno del dato

Esta seccion es la que alimenta el [catalogo](../data/catalog.md) y la
[clasificacion](../data/classification.md) de forma incremental: un reporte por vez.

- Propietario funcional (quien puede corregir la cifra):
- Que mide y en que unidad:
- Nivel de clasificacion: Restringido | Confidencial | Interno | Operativo:
- Campos sensibles del contrato (nombre y por que):
- Que significa una respuesta vacia en ESTE codigo:
- Riesgo si la cifra sale mal (decision que se toma con ella):

## Estructura de presentacion

- Componente: `app-tabla-reporte` | `app-tabla-dinamica` | grafico | mixto:
- Modelo de filas:
- Encabezados/columnas:
- KPIs:
- Semaforos:
- Coloracion condicional:
- Exportacion:

## Estados y errores

- Estado inicial:
- Cargando:
- Exito con datos:
- Exito vacio:
- Error de bloque vacio conocido:
- Error de red/mapeo:
- Accion de reintento:

## Implementacion y pruebas

- [ ] Constantes
- [ ] Modelos
- [ ] Mapeos puros
- [ ] Service
- [ ] Componente y template
- [ ] Ruta lazy
- [ ] Spec de mapeo
- [ ] Spec de service/componente
- [ ] E2E
- [ ] Responsive y accesibilidad
- [ ] `npm run inventario` (el `cod_rep` aparece en el catalogo)
- [ ] Catalogo y clasificacion actualizados con la seccion de gobierno del dato
