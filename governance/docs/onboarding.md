# Onboarding

## Primer día

```bash
npm install
npm start        # http://localhost:4200
npm run verify   # que la base esté sana antes de tocar nada
```

Después, en este orden:

1. [Visión del producto](./business/product-vision.md) — qué es el MIS.
2. [System overview](./architecture/system-overview.md) — cómo está construido.
3. **[Transporte Winder / Ant](./data/contracts/winder-transport.md)** — cómo llegan los datos. Es lo que más veces se da por sabido y más caro sale ignorar: **este sistema no expone una API REST**.
4. [Glosario de negocio](./data/glossary.md) y [contratos de datos](./data/contracts/README.md).
5. [Convenciones de desarrollo](./development/conventions.md) y [de nombres](./development/naming-conventions.md).
6. [Modelo de estados](./development/state-model.md) — carga, vacío, error, y por qué el orden importa.
7. Ejecutá las pruebas unitarias y E2E antes de modificar un flujo.

Las [skills](../skills/) son la versión aplicada de todo esto, para tener abierta mientras se programa.

## Tres cosas que sorprenden al principio

1. **No se usa `ChangeDetectionStrategy.OnPush`.** El proyecto es zoneless y ninguno de sus componentes lo declara: sin `zone.js` no hay barrido global que acotar. Ver [ADR-0001](./architecture/adr/ADR-0001-zoneless-sin-onpush.md).
2. **El color no se aplica con clases utilitarias.** No existen `bg-surface-card` ni similares: se usa `text-[var(--mis-text-secondary)]` o `style` sobre los tokens `--mis-*`. Ver [ADR-0002](./architecture/adr/ADR-0002-color-por-token-css.md).
3. **Los segmentos de ruta bajo `/app` no se eligen.** Deben coincidir con el `act_sec` del menú heredado, y por eso existen rutas como `Kaypacha__` o `cons_base_negativa`.

## Regla de datos

El frontend presenta datos; **no es la autoridad de autorización**. Usuarios, roles y acceso a reportes se resuelven en el backend. Ocultar un ítem del menú no es un control de seguridad. Los contratos que llegan por Winder/Ant se documentan antes de agregar un reporte nuevo.

## Dónde buscar

| Necesidad | Documento |
|---|---|
| Qué significa un dato y quién responde por él | [Gobierno del dato](./data/README.md) |
| Producto y lenguaje de negocio | [Negocio](./business/README.md) |
| Cómo llegan los datos | [Transporte Winder](./data/contracts/winder-transport.md) |
| Rastrear de dónde salió una cifra | [Linaje del dato](./data/lineage.md) |
| Componentes y tokens visuales | [Componentes](./components/README.md) |
| Desarrollo local y pruebas | [Desarrollo](./development/README.md) |
| Qué verifica el pipeline | [Compuertas de calidad](./development/quality-gates.md) |
| Arquitectura del frontend | [Arquitectura](./architecture/README.md) |
| Contratos con el backend | [Contratos de datos](./data/contracts/README.md) |
| Por qué se decidió algo | [Registro de decisiones](./architecture/decision-records.md) |
| Seguridad | [Seguridad](./security/README.md) |
| Estado real de la gobernanza | [Auditoría 2026-09](./evidence/quality/auditoria-gobernanza-2026-09.md) |
