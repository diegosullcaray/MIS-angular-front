import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router'; // 1. Importar Router
import { BehaviorSubject } from 'rxjs';
import { ModRepService } from "../reportes/compartido/servicios/mod-rep.service";
import { UserService } from 'app/pages/full-pages/layout/services/user.service';
import { StgAppLoaderService } from 'app/shared/components/stg-app-loader/stg-app-loader.service';
import { LayoutService } from "app/pages/full-pages/layout/services/layout.service";
import { BuscadorKaypachaComponent } from './buscador/buscador.component';
import { take } from 'rxjs/operators';
import { printError, printLog } from 'app/core/helpers/debug.util';

@Component({
  selector: 'app-basenegativa',
  templateUrl: './basenegativa.component.html',
  styleUrls: ['./basenegativa.component.scss']
})
export class BasenegativaComponent implements OnInit {

  loading: boolean = false;
  dataSource: any;
  headerDefs: any;
  load0 = new BehaviorSubject<boolean>(false);

  constructor(
    public antRep: ModRepService, 
    public user: UserService, 
    public loader: StgAppLoaderService, 
    public layout: LayoutService,
    public dialog: MatDialog,
    private router: Router // 2. Inyectar Router en el constructor
  ) {}

  ngOnInit(): void {
    // Es mejor abrir el buscador directamente
    this.openSearch();
  }

  openSearch(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = { showCloseBtn: true };
    dialogConfig.width = '80%'; // Sugerencia: dar ancho al popup
    //dialogConfig.disableClose = true //Evita que lo cierren haciendo clic afuera

    const dialogRef = this.dialog.open(BuscadorKaypachaComponent, dialogConfig);

    //Usa el operador take(1) para que la suscripción se destruya automáticamente tras ejecutarse una vez
    //es una buena práctica asegurar que no queden suscripciones colgadas si el componente padre se destruye rápido.
    dialogRef.afterClosed().pipe(take(1)).subscribe(v => {
    //dialogRef.afterClosed().subscribe(v => {
      // 'v' es el objeto que seleccionaste en el buscador
      if (v) {
        printLog("Seleccionado en buscador:", v);
        // IMPORTANTE: Usa la propiedad correcta de tu SQL. Ej: v.HCTACLI o v.cod_bt
        const codigoParaSP = v.HCTACLI || v.cod_bt || v.nom; 
        this.loadData(codigoParaSP); 
      } else {
        // 3. Si el usuario cierra el popup sin seleccionar (clic fuera, Esc o botón cerrar)
        this.router.navigate(['app/desktop']); 
      }
    });
  }

  loadData(codigoBusqueda: string) {
    this.loader.open();
    this.loading = true;     

    // Enviamos el parámetro que recibirá el SP [com].[RSBASENEG01]
    this.antRep.getRegularTableResult("RS_BASE_NEG_01", { "nom": codigoBusqueda }).subscribe(
      x => {
        this.loader.close();
        if (x && x.body && x.body.resultado) {
          let r = x.body.resultado;
          printLog("Datos recibidos del SQL:", r.data); // REVISA ESTO EN CONSOLA
          
          this.dataSource = r.data;
          
          // Si el servidor no envía headers, la tabla sale vacía. 
          // Agregamos una validación por si r.headers viene vacío.
          if (r.headers) {
            this.headerDefs = JSON.parse(r.headers);
          }
          
          this.load0.next(true); 
          this.loading = false;
        }
      },
      error => {
        this.loader.close();
        printError("Error en loadData:", error);
        this.loading = false;
        // Opcional: Redirigir también en caso de error crítico
        this.router.navigate(['app/desktop']);
      }
    );
  }
}