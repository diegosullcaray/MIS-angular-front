# Figuras del capítulo 3

Las cinco figuras están dibujadas en SVG dentro de [`figuras.html`](./figuras.html) y se exportan a PNG a 2x (≈2240 px de ancho), que es la resolución que necesita una impresión a 15 cm sin pixelarse.

Las cinco vistas están modeladas en **ArchiMate 3.2**, con el color convencional de cada capa: negocio (amarillo `#FFFFB5`), aplicación (celeste `#B5FFFF`), tecnología (verde `#C9E7B7`), motivación (violeta `#CCCCFF`) e implementación y migración (rosa `#FFE0E0`).

| Figura | Vista | Notación | Elementos |
|---|---|---|---|
| `figura-1.png` | Capa de negocio | ArchiMate | actor · rol · servicio de negocio · proceso · objeto de negocio |
| `figura-2.png` | Realización entre capas | ArchiMate | objeto de negocio ← objeto de datos ← artefacto |
| `figura-3.png` | Modelo lógico de datos | Entidad-relación | 12 entidades en 4 áreas · PK/FK · cardinalidades |
| `figura-4.png` | Modelo físico de datos | Matriz | estructura · origen · residencia y clave · vigencia |
| `figura-5.png` | Capa de aplicación | ArchiMate | servicio de aplicación · componente · interfaz |
| `figura-6.png` | Capa de tecnología | ArchiMate | dispositivo · software de sistema · nodo · artefacto · red · servicio |
| `figura-7.png` | Vista en capas | ArchiMate | motivación · negocio · aplicación · tecnología · implementación |

Las figuras 3 y 4 **no** usan ArchiMate a propósito: el lenguaje no modela atributos ni cardinalidades, así que el modelo de datos se expresa en notación entidad-relación y se enlaza con las vistas ArchiMate a través de los objetos de datos de la capa de aplicación.

Relaciones usadas, con su notación: asignación (línea con bola y punta), servicio o *serving* (punta abierta), realización (punteada con triángulo hueco), disparo (punta rellena) y acceso (punteada con punta abierta). Cada figura lleva su leyenda.

## Regenerar

Editá el SVG que corresponda en `figuras.html` y volvé a exportar:

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 2 });
  await p.goto('file:///' + process.cwd().replace(/\\/g,'/') + '/figuras.html');
  const mapa = { fig1: 1, fig2: 2, figLog: 3, figFis: 4, fig3: 5, fig4: 6, fig5: 7 };
  for (const [id, n] of Object.entries(mapa))
    await p.locator('#'+id).screenshot({ path: 'figura-' + n + '.png' });
  await b.close();
})();
"
```

Después, `python ../insertar-cap3.py` vuelve a armar el `.docx` con las figuras actualizadas.

Los datos que aparecen en las figuras salen del repositorio (inventarios derivados del código, salida de compilación y manifiestos de dependencias): si el sistema cambia, hay que actualizarlos acá también.
