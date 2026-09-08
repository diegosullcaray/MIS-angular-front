# Prompt de Desarrollo y Refactorización — MIS Host

**Instrucciones para el Agente:** Actúa como un Ingeniero de Software Principal especializado en Angular 22+, sistemas Zoneless y Gobierno del Dato. Debes corregir, refactorizar e implementar las siguientes cinco tareas en el repositorio del proyecto `MIS Host`.

Para cada tarea, debes respetar estrictamente las decisiones de arquitectura vigentes (ADRs), la inmutabilidad de señales y las guías de estilos de los componentes corporativos.

---

## 🛠️ Contexto y Reglas Obligatorias (Gobernanza del Dato)
1. **Zoneless con Señales (Sin OnPush):** No utilices `ChangeDetectionStrategy.OnPush` (ADR-0001). El estado debe gestionarse mediante señales (`signal`, `computed`). Toda actualización de vistas debe reaccionar a cambios en señales leídas en la plantilla.
2. **Uso de Tokens CSS:** No utilices clases utilitarias de Tailwind como `bg-surface-card` o `text-text-primary`. El color se aplica exclusivamente mediante valores arbitrarios sobre los tokens CSS `--mis-*` (ej: `text-[var(--mis-text-secondary)]`) o con `style` inline (ADR-0002).
3. **Orden de Estados de Datos:** Al estructurar condicionales de carga, el estado de **Error** se evalúa siempre primero para evitar esconder caídas de backend detrás de mensajes de "Sin datos" (antipatrón crítico del legado).
4. **Validación automática:** Asegúrate de que tus cambios no agreguen violaciones al auditor ejecutable mediante `npm run audit:governance`.

---

## 📋 Tareas de Refactorización

### Tarea 1: Comportamiento del Diálogo de Anuncios / Comunicados
*   **Problema:** El diálogo modal del anuncio no se cierra al hacer clic fuera del mismo. Solo se cierra al hacer clic en la "X".
*   **Requerimiento:** Corrige el diálogo en `ShellLayoutComponent` (o el componente del shell encargado de renderizar los anuncios). Asegúrate de que el componente PrimeNG `p-dialog` tenga el atributo `[dismissableMask]="true"` además de `[modal]="true"` para permitir el cierre al hacer clic fuera.
*   **Análisis Técnico (Entendido vs No Mostrar de Nuevo):**
    *   **Entendido:** Debe cerrar el diálogo únicamente en la sesión actual de navegación (sin persistencia a largo plazo).
    *   **No mostrar comunicado:** Debe persistir de manera única en `localStorage` (bajo una clave saneada del usuario activo, ej: `comunicadosLeidos: [id]`) para que el shell no lo vuelva a mostrar en futuros inicios de sesión.
    *   **Cierre de sesión:** El cierre de sesión limpia el `sessionStorage` (datos sensibles, sesión activa y caché de jerarquía), pero las preferencias operativas de interfaz (como comunicados leídos o tema seleccionado) deben conservarse en `localStorage` de manera segura, a menos que se trate de información restringida.

### Tarea 2: Botón "Volver" en Paneles de Reportes
*   **Problema:** Al hacer clic en el botón "Volver" de ciertos reportes, el sistema no regresa al nivel inmediato anterior (historial) sino que redirige directamente al Home Dashboard (`/app/dashboard`).
*   **Requerimiento:** Refactoriza la navegación del botón "Volver" en `ReporteSimpleComponent` (o la UI común de reportes) para que utilice el servicio `Location` de `@angular/common` para ir atrás de manera dinámica en el historial, o calcule el segmento padre de la ruta utilizando el `ActivatedRoute` activo en lugar de un `router.navigate(['/app/dashboard'])` estático.

### Tarea 3: Botón de "Actualizar/Refresh" en el Panel de Filtros
*   **Problema:** Falta un botón rápido de actualización de datos en las pantallas de reportes.
*   **Requerimiento:** Inserta un botón de refresco al costado del botón de filtros en el panel compartido `ReporteSimpleComponent` (ubicado en `src/app/pages/modules/reportes/ui/reporte-simple/` o en el panel `shared/ui` correspondiente).
    *   Usa el componente PrimeNG con estilo secundario y el ícono de refresco:
        ```html
        <p-button icon="pi pi-refresh" severity="secondary" [loading]="cargando()" (onClick)="refrescarDatos()" ariaLabel="Refrescar datos" />
        ```
    *   Este botón debe emitir un evento o invocar la función de consulta (`consultar()`) del servicio activo para volver a solicitar los datos al backend Ant usando el mismo nodo de jerarquía y fecha de corte.

### Tarea 4: Refactorización del Sistema de Incentivos (`pages/modules/incentivos`)
*   **Problema 1:** Falta aplicar la colorimetría de tokens y el diseño moderno del resto de la aplicación.
*   **Problema 2:** Al ingresar con rol de **Administrador**, no se visualiza el diálogo o la opción para ver los niveles de incentivos (como sí lo hace en el otro sistema).
*   **Problema 3:** El diálogo de niveles no cuenta con un botón de cierre, y al cerrarlo manualmente (clic fuera), debería redirigir automáticamente al Home (`/app/dashboard`).
*   **Requerimiento:**
    *   **Diseño:** Elimina colores hexadecimales fijos y Tailwind v4 semánticos inexistentes. Aplica variables `--mis-surface`, `--mis-border`, `--mis-text-primary` y `--mis-primary`.
    *   **Control Administrativo:** Revisa la validación de roles de usuario (inyectando `ShellStateService` o `AuthService`). Asegúrate de que el rol 'ADMINISTRADOR' tenga habilitada la visibilidad de la opción de niveles.
    *   **Diálogo de Niveles:** Añade el botón de cierre al diálogo PrimeNG `p-dialog` y asocia el evento de cierre (`onHide` o cierre del modal) a un método que ejecute:
        ```typescript
        this.router.navigate(['/app/dashboard']);
        ```

### Tarea 5: Corrección de Colores de Gráficos en "Agro - Actividades Diarias"
*   **Problema:** Los gráficos en el reporte de "Agro - Actividades Diarias" siguen mostrando la paleta del sistema legado.
*   **Requerimiento:** Localiza el archivo de configuración del gráfico Highcharts en el submódulo de "Actividad Diaria" de agro.
    *   Toma como referencia la configuración de colores corporativa y dinámica utilizada en **"Agro Mensual"** (la cual consume de forma correcta la paleta del tema de la Financiera).
    *   Modifica el array `colors` o la inicialización del tema en el componente o utilitario del gráfico de Actividades Diarias para que use exactamente las mismas constantes o variables CSS reactivas de Agro Mensual.

---

## 🧪 Pruebas y Validación Requerida
Una vez implementados los cambios, asegúrate de que:
1. Las pruebas de Vitest sigan distinguiendo explícitamente entre respuestas vacías legítimas y caídas del backend.
2. Ejecutes `npm run audit:governance` para certificar que el código no posee colores fijos ni problemas de acoplamiento.
3. Realices la prueba E2E pertinente para el flujo del diálogo de anuncios y redireccionamiento de incentivos.
