PENDIENTES

D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\cmg-cartera 

-- corrije los kpis , estan muy monotonos y las teras visualmnet enstan muy pequeñas usa las skills necesarias para mejorar el disñeo y que sean mas garndes ( solo es el diseño , no cambies los coores )


-- en el panel no meesats indicando  los datos clave ( osea debe etsar debajo de la tabla no encima , asi como esta en lso otros reportes comoe ejemplo eld e cpataciones )

Días Hábiles: A partir del día 15 calendario se comparan días hábiles faltantes para el cierre.
TMM (Tasa Mensual Móvil): Var. fecha actual vs. mismo día del mes anterior.
TAM (Tasa Anual Móvil): Var. fecha actual vs. mismo día del año anterior.


D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\estructura-desembolsos 

-- en este reporte en la tabla la columna Número de Operaciones y  Monto Desembolsado en la fila   %Desembolsos>= PEN 50M  , no estan pintado las celdas correspondientes en el legacy , la data se mapea de esta manera  D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\estructura-desembolsos\tabla.json 


 D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\monitor-salidas-retenciones

 en auqi no me carga el reporrte verofoca el legacy 
 monitor-salidas-retenciones.component.ts:84  GET https://stg.confianza.pe/cores2/ant/v1/g?w=q25XEiyy7zwD/opodiDcizERR3EOzWpFknoPA4VmJaU5xV6mF9BgLl1fizjOY1wwhHfalXYgYv9hbEyq2R3BZrjtCUX3tfuLY4ZkNqsmkCKy0VwwyjwHOiKnwkngdGwL 500 (Internal Server Error) 

esta es la ruta del legacy https://stg.confianza.pe/app/reportes/repositorio/actividad-diaria/cartera/mon-retenciones 

D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\gestion-comercial
en este reporte solo hay dos tabs clientes y saldo cartera , ademas corrije las garficas usando Highcharts  y tambien no estas mapenado los pis como esta en el legacy  esta es la ruta del legacy https://stg.confianza.pe/app/reportes/repositorio/actividad-diaria/cartera/gest-comercial  , y apra lso garficos si no hay lo que se necesita impelmenat como esta en shared ya tiene su documentacion 

en el legacy hya un fitro d efecha tambien , revisa y corrije 


D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\cartera-agricola-cultivos

en este reporte de auqi para el mapa , quiero que refatorices el mapa en si osea la aprte inetrna del mapa con elementos del tawinds 

ademas en el panel solo en esta ocuacion tanto el dialo tabla y heder del pnen y colores de kpsi debe ser color verde por peicion de a dic¿vision 

