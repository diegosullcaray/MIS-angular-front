
> Actúa como un desarrollador experto en Angular y Arquitectura Limpia. Tu tarea es migrar un módulo legacy de nuestro sistema MIS a nuestra nueva estructura basada en Standalone Components.
>
> **Datos de entrada:**
> *   **Nombre del módulo:** [Cartera en Mora]
> *   **Ruta destino:** [D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components]
> *   **Rutas y archivos legacy de referencia:** 
>     1. D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\docs\07-modulos\reportes
> 
> **Estructura destino requerida:**
> Genera el scaffolding respetando estrictamente este formato:
> *   `components/`
    {
       nombre del carpeta  : Cero Cuotas Nuevas
            `items/`:
         {
         nombre del componente : Dashboard
         ruta legacy  https://stg.confianza.pe/app/reportes/leg/com/rda/adm/graf-dashboard
         }
                  {
         nombre del componente : Dashboard en Revisión
         ruta legacy  https://stg.confianza.pe/app/reportes/repositorio/actividad-diaria/mora/cero-cuotas
         }
                           {
         nombre del componente : Cuadro de Mando
         ruta legacy  https://stg.confianza.pe/app/reportes/leg/com/rda/adm/cmd-cerocuotanueva
         }
                                    {
         nombre del componente : Top
         ruta legacy  https://stg.confianza.pe/app/reportes/leg/com/rda/adm/Top-CeroCuota
         }
                                             {
         nombre del componente : Base de Gestión

         ruta legacy  https://stg.confianza.pe/app/reportes/leg/com/rda/adm/list-cero-cuotas
         }
     }



> *   `items/`:
    {
       nombre del componente : CMG Cartera en Mora
       ruta legacy  https://stg.confianza.pe/app/reportes/leg/com/rda/adm/cmg-mora
     }
    {
       nombre del componente : CMG Cartera en Mora
       ruta legacy  https://stg.confianza.pe/app/reportes/leg/com/rda/adm/cmg-mora-simp
     }
     {
       nombre del componente : Calidad de Cartera
       ruta legacy  https://stg.confianza.pe/app/reportes/leg/com/rda/adm/cal-cart
     }

     {
       nombre del componente : Portafolios y Supervisión
       ruta legacy https://stg.confianza.pe/app/reportes/leg/com/rda/adm/port-sup
     }

     {
       nombre del componente : Cero y una Cuota
       ruta legacy https://stg.confianza.pe/app/reportes/leg/com/rda/adm/zu-cuo
     }

          {
       nombre del componente : Monitor IMR
       ruta legacy https://stg.confianza.pe/app/reportes/repositorio/actividad-diaria/cartera/mon-imr
     }
          {
       nombre del componente : Monitor Efectividades
       ruta legacy https://stg.confianza.pe/app/reportes/leg/com/rda/adm/mon-efec
     }
          {
       nombre del componente : Seguimiento Reprogramados
       ruta legacy https://stg.confianza.pe/app/reportes/leg/com/rda/adm/mon-efecrepro
     }

          {
       nombre del componente : Efectividades Sin Asignar
       ruta legacy https://stg.confianza.pe/app/reportes/leg/com/rda/adm/mon-efec-sinasig
     }
          {
       nombre del componente : Top Variables de Riesgos
       ruta legacy https://stg.confianza.pe/app/reportes/leg/com/rda/adm/top-efec
     }

          {
       nombre del componente : Reporte de Pago Puntual
       ruta legacy https://stg.confianza.pe/app/reportes/leg/com/rda/adm/mon-efectramoscomer
     }
               {
       nombre del componente : Seguimiento de Portafolio
       ruta legacy https://stg.confianza.pe/app/reportes/leg/com/rda/adm/ava-port
     }




> *   `[nombre-modulo].routes.ts`: Enrutamiento lazy loading con Standalone Components.
> 
> **Reglas de desarrollo:**
> 1. **Mapeo:** Analiza la estructura legacy proporcionada y mapea su contenido lógicamente hacia la nueva arquitectura.
> 2. **Shared UI:** Debes integrar los componentes reutilizables existentes en nuestro repositorio (`src/app/shared/ui/`), tales como `<app-data-table>`, `<app-kpi-tile>`, `<app-empty-state>`, `<app-loading-overlay>`, etc.
> 3. **Código Base:** Genera el código boilerplate funcional para los servicios, modelos, el archivo de rutas y el `.ts`/`.html` del item principal.
> 
> Por favor, entrégame primero el árbol de carpetas propuesto y luego los bloques de código respectivos.