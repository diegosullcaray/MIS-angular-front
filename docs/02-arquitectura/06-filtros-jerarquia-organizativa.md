# Filtros de Jerarquía Organizativa (`HierSelectorComponent`)

Este documento especifica la arquitectura, flujo reactivo de datos en cascada, fallback de fecha de corte, manejo de la visibilidad y persistencia del selector de jerarquía organizativa en los módulos de **Presupuesto** y **Reportes** del MIS Host.

---

## 1. Visión General

El selector de jerarquía ([`HierSelectorComponent`](../../src/app/pages/modules/presupuesto/ui/hier-selector/hier-selector.component.ts)) es un componente standalone construido bajo los estándares de **Angular 22 Zoneless + Signal Forms**.

Resuelve el problema de navegación dentro del árbol de la entidad (Financiera → Territorio → Corredor → Administrador → Agencia → Banca Preferente) mediante un conjunto dinámico de desplegables PrimeNG `<p-select>`.

---

## 2. Flujo de Inicialización y Carga en Cascada

```
[Arranque de la Pantalla]
        │
        ▼
1. Llama a `obtenerJerarquiaBase(cod_hier)` (o usa `raizFija` si está definida)
        │
        ▼
2. Hidrata Nivel 1 ("FINANCIERA CONFIANZA")
   - Auto-selecciona el primer nodo
   - Emite inmediatamente `nodoSeleccionado.emit(nodoNivel1)`
   - Carga e hidrata la tabla de datos principal de la pantalla
        │
        ▼
3. Hidrata Nivel 2 en segundo plano ("TERRITORIO")
   - Carga las opciones del segundo desplegable
   - Permanece deseleccionado listo para la interacción del usuario
        │
        ▼
4. Selección Progresiva (Sub-niveles 3+)
   - Al seleccionar un nodo en el Nivel i:
     a) Trunca selecciones y desplegables posteriores (> i)
     b) Emite `nodoSeleccionado.emit(nodoNivelI)`
     c) Si i + 1 <= maxLvl, consulta y renderiza el desplegable i + 1
```

---

## 3. Estrategia de Fallback por Fecha de Corte (`fec`)

Para evitar pantallas sin información cuando la fecha de corte del usuario (`shell.usuarioActivo()?.fechaCorte`) no coincide con cierres procesados:

1. **Intento 1 (Con fecha corte):** Realiza la llamada HTTP incluyendo los parámetros `{ key: 'fec', val: fechaCorte }`.
2. **Intento 2 (Fallback sin fecha):** Si la respuesta devuelve un arreglo vacío (`[]`), ejecuta automáticamente un reintento omitiendo el parámetro `fec`.

---

## 4. Ocultamiento y Persistencia del Estado

El botón del encabezado (**"Ocultar filtros"** / **"Mostrar filtros"**) conmuta la visibilidad del panel mediante la clase CSS Tailwind:

```html
<div class="flex items-center gap-3 flex-wrap" [class.hidden]="!mostrarFiltros()">
  <app-hier-selector [paramsHier]="paramsHier" (nodoSeleccionado)="onNivelSeleccionado($event)" />
</div>
```

- **Por qué `[class.hidden]` en lugar de `@if`:**
  `@if` destruye el componente del DOM y cancela sus Signals. `[class.hidden]` conserva la instancia viva en la memoria del navegador, preservando los niveles y nodos seleccionados por el usuario al ocultar y volver a mostrar la barra.

---

## 5. Botón de Reinicio ("Limpiar")

Ubicado a la derecha de la barra de filtros de jerarquía:

```typescript
public limpiar(): void {
  this.nodosNivel.set([]);
  this.valoresSeleccionados.set([]);
  this.cargarRaiz();
}
```

- Restablece el selector al Nivel 1 auto-seleccionado y Nivel 2 cargado sin selección.
- Emite el nodo raíz para actualizar automáticamente las tablas de reportes desde el nivel principal.

---

## 6. Integración con el Loader Global (`LoadingService`)

- El interceptor HTTP ([`loadingInterceptor`](../../src/app/core/interceptors/loading.interceptor.ts)) captura de forma transparente todas las peticiones `HttpClient` emitidas por la jerarquía y las tablas.
- Dispara el componente flotante ([`LoadingOverlayComponent`](../../src/app/shared/ui/loading-overlay/loading-overlay.component.ts)) con desenfoque de pantalla (*backdrop blur*), eliminando spinners y skeletons locales redundantes en los componentes individuales.
