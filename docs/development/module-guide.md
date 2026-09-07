# Module guide

Cada modulo de negocio separa responsabilidades:

```text
pages/modules/<modulo>/
  constantes/  codigos y configuracion del backend
  models/      tipos de dominio y payload
  utils/       mapeos y calculos puros
  services/    peticiones y fachadas
  ui/          piezas compartidas del modulo
  items/       pantallas
```

Para agregar un reporte: documentar el contrato, registrar `cod_rep`, definir modelos y mapeos, implementar el servicio, crear la pantalla y añadir pruebas unitarias y E2E.
