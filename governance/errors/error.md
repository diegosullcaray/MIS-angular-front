 200 more lazy chunks files. Use "--verbose" to show all the files.

Application bundle generation complete. [6.959 seconds] - 2026-10-12T20:19:57.909Z

▲ [WARNING] NG8011: Node matches the "[ventana-acciones]" slot of the "WindowPanelComponent" component, but will not be projected into the specific slot because the surrounding @if has more than one node at its root. To project the node in the right slot, you can:

1. Wrap the content of the @if block in an <ng-container/> that matches the "[ventana-acciones]" selector.
2. Split the content of the @if block across multiple @if blocks such that each one only has a single projectable node at its root.
3. Remove all content from the @if block, except for the node being projected.

This check can be disabled using the `extendedDiagnostics.checks.controlFlowPreventingContentProjection = "suppress" compiler option.` [plugin angular-compiler]

    src/app/pages/modules/reportes/components/actividad-diaria/components/Cartera/items/gestion-comercial/gestion-comercial.component.html:20:4:
      20 │     <app-fecha-cierre-boton ventana-acciones etiqueta="Periodo" [o...
         ╵     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Warning occurs in the template of component GestionComercialComponent.

    src/app/pages/modules/reportes/components/actividad-diaria/components/Cartera/items/gestion-comercial/gestion-comercial.component.ts:58:15:
      58 │   templateUrl: './gestion-comercial.component.html',
         ╵                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


▲ [WARNING] NG8011: Node matches the "[ventana-filtros]" slot of the "WindowPanelComponent" component, but will not be projected into the specific slot because the surrounding @if has more than one node at its root. To project the node in the right slot, you can:

1. Wrap the content of the @if block in an <ng-container/> that matches the "[ventana-filtros]" selector.
2. Split the content of the @if block across multiple @if blocks such that each one only has a single projectable node at its root.
3. Remove all content from the @if block, except for the node being projected.

This check can be disabled using the `extendedDiagnostics.checks.controlFlowPreventingContentProjection = "suppress" compiler option.` [plugin angular-compiler]

    src/app/pages/modules/reportes/components/actividad-diaria/components/Cartera/items/gestion-comercial/gestion-comercial.component.html:21:4:
      21 │     <app-grupo-filtros ventana-filtros class="lg:hidden">
         ╵     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Warning occurs in the template of component GestionComercialComponent.

    src/app/pages/modules/reportes/components/actividad-diaria/components/Cartera/items/gestion-comercial/gestion-comercial.component.ts:58:15:
      58 │   templateUrl: './gestion-comercial.component.html',
         ╵                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


Watch mode enabled. Watching for file changes...
NOTE: Raw file sizes do not reflect development server per-request transformations.
  ➜  Local:   http://localhost:4200/
  ➜  press h + enter to show help
