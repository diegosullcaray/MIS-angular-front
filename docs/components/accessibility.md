# Accesibilidad y estados de UI

## Requisitos

- Todo boton iconico debe tener `aria-label` y tooltip cuando no sea obvio.
- El teclado del buscador debe soportar Escape, Home, End, flechas y Enter.
- Los componentes de error deben anunciar una accion de reintento comprensible.
- Los mapas deben mantener controles accesibles y atribucion de OpenStreetMap.
- El foco visible debe usar tokens del sistema y no depender solo del color.
- Las tablas deben conservar encabezados, alineacion semantica y lectura de estados.
- En movil, el breadcrumb se pliega sin eliminar la navegacion hacia el padre.

## Estados

Cada feature con datos debe modelar explicitamente: inicial, cargando, exito con datos, exito vacio, error recuperable y error fatal. Un spinner no debe representar simultaneamente una respuesta vacia o una autorizacion denegada.
