D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\cmg-cartera 

-- corrije los kpis , estan muy monotonos y las teras visualmnet enstan muy pequeñas usa las skills necesarias para mejorar el disñeo y que sean mas garndes 


-- en el panel no meesats indicando  los datos clave

Días Hábiles: A partir del día 15 calendario se comparan días hábiles faltantes para el cierre.
TMM (Tasa Mensual Móvil): Var. fecha actual vs. mismo día del mes anterior.
TAM (Tasa Anual Móvil): Var. fecha actual vs. mismo día del año anterior.


D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\estructura-desembolsos 

-- en este reporte en la tabla la columna Número de Operaciones y  Monto Desembolsado en la fila   %Desembolsos>= PEN 50M  , no estan pintado las celdas correspondientes en el legacy , la data se mapea de esta manera  D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\estructura-desembolsos\tabla.json 

D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\saldo-cartera

-- en la tabla , los heders no estan bien distrbuidos  , toma distribuido de comoe sta segmentado en el json D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\saldo-cartera\tabla.json 

 D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\monitor-salidas-retenciones

 en auqi no me carga el reporrte verofoca el legacy 
 monitor-salidas-retenciones.component.ts:84  GET https://stg.confianza.pe/cores2/ant/v1/g?w=q25XEiyy7zwD/opodiDcizERR3EOzWpFknoPA4VmJaU5xV6mF9BgLl1fizjOY1wwhHfalXYgYv9hbEyq2R3BZrjtCUX3tfuLY4ZkNqsmkCKy0VwwyjwHOiKnwkngdGwL 500 (Internal Server Error) 

esta es la ruta del legacy https://stg.confianza.pe/app/reportes/repositorio/actividad-diaria/cartera/mon-retenciones 

D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\gestion-comercial
en este reporte solo hay dos tabs clientes y saldo cartera , ademas corrije las garficas usando Highcharts  y tambien no estas mapenado los pis como esta en el legacy  esta es la ruta del legacy https://stg.confianza.pe/app/reportes/repositorio/actividad-diaria/cartera/gest-comercial  , y apra lso garficos si no hay lo que se necesita impelmenat como esta en shared ya tiene su documentacion 

en el legacy hya un fitro d efecha tambien , revisa y corrije 

D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\datos-producto 

en este panel no esta colocamndo las indicaciones qu tienen en cada tabla , asi como esta en ele legacy 

https://stg.confianza.pe/app/reportes/leg/com/rda/adm/dat-prod  verifica la ruta y empieza a correjir 

D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\cmg-cartera 

en este reporte de auqi para el mapa , quiero que refatorices el mapa en si osea la aprte inetrna del mapa con elementos del tawinds 

ademas en el panel solo en esta ocuacion tanto el dialo tabla y heder del pnen y colores de kpsi debe ser color verde por peicion de a dic¿vision 

D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\ranking-comercial  

en este reporte en al columna de productividad , desembolos , Var. saldo vigente , Gestión  sus filas en su baroung esta tomando los colores de los hedes corrije , ademas los puntos deb ser a corde comoe sta en el utils ya los indicadores , ademas este roerte usas filtros particulares n los fitros comparitos , y tampocos estas mapenado el kpis que tiene  D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\ranking-comercial\tabla.json  esta es la data y esta es el legacy que trae app/reportes/repositorio/actividad-diaria/cartera/rank-comercial 