Agregué el filtro de producto a Cuenta de Resultados en el front. Los 50 tests relacionados pasan y tsc compila sin errores. No levanté la app ni hice el build de producción.

Qué hace:
- La cabecera de la respuesta del reporte puede traer productos, que es la lista que el SP nuevo ya arma.
- Con esa lista aparece un selector Producto, con "Todos" como valor inicial, junto al de período.
- El selector solo aparece si hay productos. Con el SP actual no sale nada nuevo.
- Al elegir un producto se reconsulta y se manda el parámetro producto. Con "Todos" la petición queda igual a la de hoy, así que no se toca el contrato congelado.
- Los cambios están en el modelo, cuenta-resultados.util.ts, actividad-mensual-repo.service.ts y el componente (.ts y .html). Ajusté 3 specs para el tercer argumento nuevo.

Riesgos y lo que no hice:
- El filtro no funciona hasta que corras los scripts de la tarea 0002 (03 crear, 06 activar). Falta también agregar {"order":4,"name":"producto"} a RTPREP.params de TAB_CUE_RES_01, como dice §5 del análisis. Si eliges un producto sin eso, el backend puede rechazar el parámetro.
- Las columnas nuevas del SP (variacion_periodo_anio_anterior y su %) no las muestro. El análisis dice que el front actual no las usa.
- Los filtros de periodo y jerarquía ya funcionaban en el front. Solo faltaba que el SP los aplicara.
- npm run verify se detiene en audit:docs, con 6 referencias rotas en la documentación. Falla también con mis cambios apartados, pero no revisé qué referencias son. Tampoco probé en navegador el selector nuevo.

✻ Cooked for 1m 59s · done 12:26 PM

❯ ya active el sp

Bien. Tres cosas que quedan pendientes:

1. Parámetro producto: el selector solo funciona si RTPREP.params de TAB_CUE_RES_01 incluye {"order":4,"name":"producto"}. Si 06-activacion.sql no lo agregó, el selector aparece (el SP ya manda productos) pero al elegir uno el backend puede rechazar el parámetro. Revísalo.
2. Prueba en pantalla: abre Cuenta de Resultados y cambia período, nivel de jerarquía y producto. Las cifras deben cambiar con cada uno. Si algo falla, pásame el error o la respuesta de la red y lo reviso. No puedo probarlo yo porque no tengo acceso a esa base ni a tu sesión.
3. Cierre de la tarea (paso 7 de 02-analisis.md): extraer el SP nuevo con python extraccion/herramientas/bd.py extraer --sp RTABCUERES01_NEW, reexportar reportes.json, correr npm run generar y marcar la modificación como aplicada. Puedo hacerlo si me confirmas que la prueba salió bien.
