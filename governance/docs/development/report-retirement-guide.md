# Guía para retirar un reporte o un módulo

Retirar un reporte es más que borrar su carpeta. Si solo se borra la carpeta, quedan restos que siguen pasando pruebas sin proteger nada:

- una ruta que cae en el comodín `**`;
- un E2E que visita una URL inexistente y pasa igual;
- `cod_rep` en el catálogo;
- claves de línea base de archivos que ya no existen;
- un módulo que ya nadie enlaza.

Esta guía es el procedimiento completo. El registro de lo retirado vive en [ADR-0007](../architecture/adr/ADR-0007-retiro-de-reportes-sin-uso.md).

## 1. Delimitar qué se retira

1. Parte del **código SCODSEC y la ruta legacy** del menú (`/app/reportes/leg/com/...`), no del nombre visible: hay nombres repetidos entre diario (`rda`) y mensual (`rma`), p. ej. `gest_cart_her`.
2. Encuentra el `path:` exacto en los `*.routes.ts`:

   ```bash
   grep -rn "<segmento-final>" src/app --include=*.routes.ts
   ```

3. Anota el componente que carga y sus imports locales: servicio, modelo, utils y constantes.
4. Si la ruta es **todo lo que tiene un módulo**, retira el módulo completo y su entrada en `app.routes.ts`.
5. Si la ruta legacy **no tiene implementación** en el repo, no hay nada que retirar; regístrala igual en el ADR como "sin cambios".

## 2. Qué se borra y qué se conserva

| Pieza | Acción |
|---|---|
| Carpeta del componente (`items/<reporte>/`) | Borrar entera, incluido su spec |
| Entrada en `*.routes.ts` | Borrar |
| Método de servicio que **solo** usaba esa pantalla | Borrar, con su prueba en el spec del servicio |
| Servicio, util o modelo que queda sin consumidores | Borrar, con su spec |
| Constantes (`cod_rep`, catálogos de filtros, jerarquías) usadas solo por ella | Borrar |
| Etiquetas de breadcrumb (`navigation.constants.ts`) exclusivas de sus segmentos | Borrar |
| Servicios compartidos (`BloqueReporteService`, bases de `reportes/ui/`) | **Conservar** |
| Transporte `core/winder/instances/*` | **Conservar**: Winder está congelado. El inventario marca con **0** los métodos sin llamadas; su retiro se decide aparte. |

Para confirmar que algo quedó sin consumidores:

```bash
grep -rln "nombre-del-archivo'" src/app --include=*.ts | grep -v "\.spec\.ts"
grep -rn "metodoDelServicio(" src/app --include=*.ts | grep -v "\.spec\.ts"
```

## 3. Pruebas y evidencia

1. **Unitarias.** Borra los tests de lo retirado; no los dejes con `skip`. Si un spec compartido probaba varios reportes, quita solo los casos del retirado.
2. **E2E.** Quita la URL de las listas de humo (`[ruta, título]`) y los `test()` que la visitan. Si una prueba usaba esa pantalla como ejemplo de algo general (breadcrumb, caché de jerarquía), cámbiala por una ruta viva equivalente.
3. **Línea base.** Quita las claves de los archivos borrados; la regla `linea-base-vigente` las señala.

## 4. Verificación obligatoria

```bash
npm run inventario                      # regenera módulos, cod_rep y rutas de acción
node governance/scripts/validar-gobernanza.mjs --regla=modulo-enrutado,e2e-rutas-vigentes,linea-base-vigente
npm run verify
npx ng build --configuration production
npx ng test --watch=false
npx playwright test
```

Las tres reglas citadas existen para este procedimiento:

| Regla | Detecta |
|---|---|
| `modulo-enrutado` | Un módulo que quedó sin ninguna ruta que lo cargue |
| `e2e-rutas-vigentes` | Un E2E que visita una URL retirada o mal escrita |
| `linea-base-vigente` | Claves congeladas de archivos que ya no existen |

Si una URL de E2E es a propósito una **carpeta del explorador**, que resuelve `**` y no una pantalla, márcala en la misma línea con `// gobernanza: ruta-de-carpeta`.

**Comparar E2E contra el commit anterior.** Si Playwright falla en áreas que no tocaste, corre esas mismas suites sobre el commit anterior antes de atribuir el fallo al retiro:

1. Crea una copia con `git worktree add --detach <dir> HEAD`.
2. Levanta su servidor en el puerto 4300.
3. Al terminar, detén ese servidor **antes** de volver a correr la suite propia: `reuseExistingServer` lo reutilizaría y probarías el código viejo.

## 5. Registro

Agrega el retiro a la tabla de [ADR-0007](../architecture/adr/ADR-0007-retiro-de-reportes-sin-uso.md). Si el retiro deja una decisión nueva (un módulo huérfano, transporte sin uso), anótala ahí como consecuencia.

El menú lo entrega el backend (STG). Retirar la pantalla del frontend no la quita del menú: pide en backend que se deshabilite el `SCODSEC`, o el usuario verá una entrada que abre Not Found.
