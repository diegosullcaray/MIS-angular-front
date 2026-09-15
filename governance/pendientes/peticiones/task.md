teniendo en cuenta el modulo de aqui  D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\governance\pendientes\modulos\consulta-fen  
quiero que se migre al nuevo sistema en esta ruta D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules  como un modulo y en el routes aplcia la siguiente ruta 

      {
        path: 'consulta-fen',
        loadChildren: () => import('app/modules/consulta-fen/consulta-fen.module').then(m => m.ConsultaFenModule),
        data: { title: 'Consulta FEN - CENEPRED' }
      },  


      aplica todos los egente sestilos que tiene el sistema , ademas quiero que leas lo que tienen la caprta de gobierno y resptees las inctacias ya planetadas , mejor ala pantalla donde quiero que uses el mapa al csoatdod e la tbla y cuando se seleciones el ubigeo en el mapa se mrque 