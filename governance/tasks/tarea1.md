:\FINANCIERA CONFIANZA\04 SISTEMAS\01 MIS\GITHUB\MIS-angular-front>ng serve
Application bundle generation failed. [6.617 seconds] - 2026-09-17T21:14:08.416Z

X [ERROR] TS4104: The type 'readonly FiltroFen[]' is 'readonly' and cannot be assigned to the mutable type 'any[]'. [plugin angular-compiler]

    src/app/pages/modules/consulta-fen/components/consulta-fen/consulta-fen.component.html:23:61:
      23 │ ...fen-filtro" class="w-full" [options]="filtros" optionLabel="lab...
         ╵                                ~~~~~~~

  Error occurs in the template of component ConsultaFenComponent.

    src/app/pages/modules/consulta-fen/components/consulta-fen/consulta-fen.component.ts:28:15:
      28 │   templateUrl: './consulta-fen.component.html',
         ╵                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] NG8002: Can't bind to 'inputmode' since it isn't a known property of 'input'. Find more at https://next.angular.dev/errors/NG8002 [plugin angular-compiler]

    src/app/pages/modules/consulta-fen/components/consulta-fen/consulta-fen.component.html:27:93:
      27 │ ...consulta" [inputmode]="esUbigeo() ? 'numeric' : 'text'" [attr.m...
         ╵              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Error occurs in the template of component ConsultaFenComponent.

    src/app/pages/modules/consulta-fen/components/consulta-fen/consulta-fen.component.ts:28:15:
      28 │   templateUrl: './consulta-fen.component.html',
         ╵                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


Watch mode enabled. Watching for file changes...
