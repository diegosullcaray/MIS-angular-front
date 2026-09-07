# Onboarding

## Primer dia

1. Instalar dependencias con `npm install`.
2. Ejecutar el frontend con `npm start`.
3. Leer [la vision del producto](./business/product-vision.md).
4. Leer [como funciona el sistema](./architecture/system-overview.md).
5. Consultar el [glosario de negocio](./business/glossary.md) y los [contratos de datos](./architecture/api-contracts/README.md).
6. Ejecutar las pruebas unitarias y E2E antes de modificar un flujo.
7. Revisar [las convenciones de desarrollo](./development/conventions.md) y el [modelo de estados](./states/state-model.md).

## Regla de datos

El frontend presenta datos; no es la autoridad de autorizacion. La autorizacion de usuarios, roles y reportes debe resolverse en backend. Los contratos que llegan por Winder/Ant se documentan antes de agregar un reporte nuevo.

## Donde buscar

| Necesidad | Documento |
|---|---|
| Producto y lenguaje de negocio | [Business](./business/) |
| Componentes y tokens visuales | [Components](./components/) |
| Desarrollo local y pruebas | [Development](./development/) |
| Arquitectura y contratos | [Architecture](./architecture/) |
| Seguridad | [Security](./security/) |
| Evidencia de pruebas | [Reports](./reports/) |
