# Guía de Importación y Especificación UX/UI para Figma (MIS - Financiera Confianza)
> **Documentación Activa:** [01_PRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/01_PRD.md) | [02_UI_UX_APP_FLOW](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/02_UI_UX_APP_FLOW.md) | [03_TRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/03_TRD.md) | [04_BACKEND_SCHEMA](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/04_BACKEND_SCHEMA.md) | [05_IMPLEMENTATION_PLAN](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/05_IMPLEMENTATION_PLAN.md) | [06_FIGMA_UX_KIT](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/06_FIGMA_UX_KIT.html)  
> **Kit:** v2.0 (julio 2026) — Iconos SVG neutrales, Perfil/Salir en header, estructura macOS corregida

Este documento sirve como guía para importar el kit de diseño interactivo `06_FIGMA_UX_KIT.html` a Figma, y detalla la especificación técnica de arquitectura de información y UX.

### Cambios v2.0
- **Sin emojis:** todos los íconos de navegación son SVG inline estilo Lucide (stroke, sin relleno, color via CSS)
- **Sidebar limpio:** Col 1 contiene únicamente íconos de sistemas (Inicio + Remotes). Perfil y Cerrar sesión se eliminaron del sidebar.
- **Menú de usuario en Header:** el pill `[avatar + nombre + chevron]` en el header despliega un dropdown con Mi perfil / Preferencias / Cerrar sesión.
- **macOS minimalista:** chrome de ventana (semafóforo), header glass 44px, Col 1 navy 56px, Col 2 panel 220px. Sin colores planos, sin elementos de relleno innecesarios.

---

## 🚀 Cómo importar este diseño en Figma

Para convertir el archivo interactivo en capas editables y componentes nativos de Figma (incluyendo Auto Layout, colores y textos), siga estos pasos:

1. **Abra el archivo en su navegador**:
   - Localice el archivo generado [mis_figma_ux_kit.html](file:///C:/Users/DIEGO/.gemini/antigravity-ide/brain/8fd6fcdf-36d3-47fe-80cd-b58cea594452/mis_figma_ux_kit.html).
   - Ábralo en Google Chrome o su navegador preferido.

2. **Instale el plugin "html.to.design" en Figma**:
   - Abra **Figma**.
   - Vaya a la sección de **Plugins** y busque **html.to.design** (o alternativamente *Builder.io - HTML to Figma*).
   - Instale y ejecute el plugin dentro de un nuevo archivo de diseño.

3. **Importar la URL o el Código HTML**:
   - **Opción A (Recomendada)**: Copie la ruta del archivo local de su navegador (ej. `file:///C:/Users/.../mis_figma_ux_kit.html`) y péguela en el cuadro de texto de la URL del plugin en Figma.
   - **Opción B**: Si el plugin no lee rutas locales de archivos directamente, use una extensión de Chrome como **SingleFile** para descargar la página completa en un solo archivo, o simplemente arrastre el código HTML/CSS en Figma usando el plugin en modo de carga de archivos (Upload).
   - Seleccione la resolución de importación deseada (ej. **Desktop 1440px**).
   - Presione **Import**.

4. **Organización del archivo en Figma**:
   - El plugin generará un frame completo con todas las secciones organizadas verticalmente.
   - Podrá extraer los colores (Branding), componentes y layouts para guardarlos como **Figma Components** y **Color/Typography Styles**.

---

## 🎨 Especificaciones del Design System

### 1. Paleta de Colores (Branding)
Diseño alineado con la identidad corporativa y estética macOS minimalista:
- **Navy Primario (`#1D396E`)**: Color dominante para el Host. Representa solidez, seguridad y control institucional. Utilizado en el Sidebar principal (Col 1), botones primarios y encabezados importantes.
- **Sky Blue Secundario (`#42ADE0`)**: Color de acento para la interacción. Utilizado para enlaces, estados activos (el ícono seleccionado de la columna 1) y focos visuales (focus-ring).
- **Fondos de Superficie**:
  - General (`#F4F6F9`): Un gris azulado ultra suave que reduce la fatiga visual.
  - Paneles (`#F8FAFC`): Para la columna de navegación secundaria persistente (Col 2).
  - Cards (`#FFFFFF`): El blanco puro resalta los contenedores de datos sobre el fondo gris.

### 2. Tipografía (macOS HIG Stack)
- **Familia**: `-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif`.
- **Escala de Jerarquía**:
  - `2xl` (28px - Bold): Títulos de páginas principales del Host.
  - `xl` (22px - SemiBold): Títulos internos de las vistas (ej. formularios o modales).
  - `lg` (17px - SemiBold): Cabeceras de los paneles de navegación de segunda columna.
  - `base` (15px - Regular): Cuerpo de texto para lectura óptima.
  - `sm` (13px - Regular/Medium): Textos secundarios, tablas, inputs y metadatos.
  - `xs` (11px - Bold): Etiquetas de texto en la barra lateral de primer nivel.

### 3. Layout: Estructura de 3 Columnas (Patrón macOS/Gmail)
La interfaz principal (Shell) tiene tres divisiones bien definidas:

1. **Columna 1 — Sidebar de íconos (56px, Navy):** Contiene el logo del MIS en la parte superior y los íconos SVG de sistemas (Inicio + Remotes) en el centro. **No contiene Perfil ni Cerrar sesión.** La zona inferior está vacía y limpia. Nunca se colapsa.

2. **Columna 2 — Panel de navegación secundario (220px):** Muestra la estructura de rutas del subsistema seleccionado actualmente, con íconos SVG pequeños junto a cada ítem. Panel persistente que nunca desaparece.

3. **Zona de Contenido Principal:** Header glass 44px (wordmark + breadcrumb + **pill de usuario** → dropdown de Perfil/Salir) + área de trabajo dinámica.

#### Menú de Usuario (Header)
El pill de usuario `[avatar] Nombre [▾]` en el header despliega un dropdown con:
- Nombre completo y email del usuario
- Mi perfil (ic. SVG usuario)
- Preferencias (ic. SVG engranaje)
- _separador_
- Cerrar sesión (ic. SVG salida) — texto en rojo

> **Regla de diseño:** Perfil y Cerrar sesión **nunca** aparecen en el sidebar. Esta es la convención macOS (ver Finder, Mail, calendarios del sistema).

---

## ⚡ Interacción y Estados Asíncronos

### 1. Carga Dinámica (Zoneless Native Federation)
La comunicación y ciclo de vida de los subsistemas se define a través de:
- **Remote Wrapper**: Componente Angular que captura el slug de la ruta (ej. `/admin/:nombre-subsistema`), ejecuta `loadRemoteModule` y administra los estados mediante directivas `@defer`.
- **RemoteSkeletonComponent**: Plantilla de carga con animaciones pulsantes lineales. Previene saltos bruscos de la UI (*Cumulative Layout Shift*).
- **RemoteErrorComponent**: Se activa cuando un Remote falla en red o cae. Muestra un estado de error contextual que invita al reintento, permitiendo que el Host y otros subsistemas sigan operando al 100%.

### 2. Contrato de Comunicación (Signals)
- El Host expone un servicio `ShellStateService` singleton.
- Los Remotes consumen señales de solo lectura (`usuarioActivo()`, `catalogoActivo()`, `esAdmin()`).
- Se restringe la escritura desde los remotes mediante firmas de solo lectura (`asReadonly()`), garantizando seguridad y consistencia en el estado de la aplicación empresarial.


Infrestutura

- azure (contendores)  - con terraform 
- google ( maquinas virtuales)  - dokploy  ( tomcat)



Frontend 

- MACs ( diseño ) 
- angular ( embevidos ) dentro del mis propio   - ( talwind con primeng )
- (web y movil )
- embever lo que son los sistemas () 


