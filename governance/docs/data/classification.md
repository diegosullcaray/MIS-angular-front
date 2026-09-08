# Clasificación del dato

Qué cuidado requiere cada tipo de dato que pasa por el MIS Host. El [modelo de amenazas](../security/threat-model.md) exige un "inventario de campos sensibles por contrato": este documento es donde vive, y donde queda constancia de lo que todavía falta.

## Niveles

| Nivel | Definición | Ejemplos en el MIS | Reglas |
|---|---|---|---|
| **Restringido** | identifica a una persona o permite actuar en su nombre | token de sesión, identidad del usuario alterno, correo corporativo, secretos Winder | nunca en logs, fixtures, capturas ni evidencia; nunca en el bundle |
| **Confidencial** | información financiera o de cliente | cartera, mora, saldos, desembolsos, clientes, incentivos individuales | no se copia a documentos ni a datos de prueba; solo se muestra al usuario autorizado |
| **Interno** | estructura y operación de la organización | jerarquía organizativa, menú, `cod_rep`, catálogos, metas | puede documentarse; no se publica fuera de la organización |
| **Operativo del cliente** | estado de la interfaz del propio usuario | preferencias, tema, reportes recientes | sin autorización asociada; se limpia al cerrar sesión |

## Reglas transversales

1. **Los datos de prueba son ficticios.** Ningún fixture, spec, captura o documento de evidencia lleva información financiera o personal real. Lo verifica `--regla=sin-secretos` y `verificar-bundle.mjs`.
2. **La evidencia no copia payloads completos.** Un reporte de prueba registra el resultado, no el cuerpo de la respuesta ni las cabeceras. Ver [política de evidencia](../evidence/evidence-policy.md).
3. **Nada sensible se loguea.** No hay `console.*` en código productivo, y es una regla verificada: la consola del navegador es un canal de exfiltración involuntario.
4. **Las respuestas de negocio no se cachean en el service worker.** `ngsw-config.json` no declara regla de API a propósito: el app-shell se cachea, los datos financieros nunca.
5. **El cierre de sesión limpia el rastro**: almacenamiento, cookies visibles, cachés y service workers, en la medida en que el cliente puede hacerlo. Las cookies `HttpOnly` solo las revoca el backend.

## Inventario de campos sensibles

| Contrato / origen | Campos sensibles conocidos | Nivel | Estado |
|---|---|---|---|
| Perfil de sesión (`session`, 6300) | identidad, correo corporativo, rol, `curr_fec` | Restringido | Identificado |
| Usuario alterno | identidad original e identidad activa | Restringido | Identificado |
| Jerarquía (`admin`, 6301) | `cod_jer`, `tip_cod`, `cod_rel`, etiquetas de nivel | Interno | Identificado |
| Reportes (`reporting`, 5304) | filas de cartera, mora, clientes, captaciones | Confidencial | **Sin inventario campo por campo** |
| Base negativa | identificación de cliente, cuenta, tipo de evento | Confidencial | **Sin inventario campo por campo** |
| Incentivos | montos individuales por colaborador | Confidencial | **Sin inventario campo por campo** |
| Entornos (`src/environments/`) | `cypherSecret`, secretos por `appId` | Restringido | Identificado — **expuesto, ver abajo** |

> **La brecha principal de este documento son las filas marcadas "sin inventario campo por campo".** Los reportes devuelven columnas dinámicas definidas por el backend: enumerarlas exige recorrer cada `cod_rep` con su propietario funcional. Se completa de forma incremental al tocar cada reporte, mediante la [ficha de reporte](../templates/report-spec-template.md), que obliga a declarar los campos sensibles del contrato.

## Riesgo abierto y qué no se puede afirmar

Los secretos Winder están compilados en `src/environments/` y por lo tanto **viajan en el bundle público**. Una clave dentro de JavaScript descargable no es un secreto, y el esquema AES-CBC con IV fijo no aporta autenticidad.

Consecuencias para la clasificación:

- El cifrado Winder **no es un control de confidencialidad** que pueda invocarse para justificar el manejo de un dato.
- La confidencialidad efectiva de los datos financieros depende de que el **backend autorice cada operación**, no de que el frontend oculte una ruta o un ítem del menú.
- Ningún hallazgo de esta clase se marca cerrado porque el frontend deje de mostrarlo.

Detalle y plan: [hallazgos de seguridad](../security/findings.md) y [plan de remediación](../security/remediation-plan.md).

## Al agregar un dato nuevo

1. Asignarle un nivel de esta tabla.
2. Si es Restringido o Confidencial, declararlo en la ficha del reporte o del contrato.
3. Verificar que no aparezca en fixtures, mocks ni capturas de evidencia.
4. Verificar que no se cachee ni se loguee.
5. Confirmar que el backend autoriza el acceso, y no solamente que la pantalla lo oculta.
