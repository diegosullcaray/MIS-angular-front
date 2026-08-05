import { printError } from 'app/core/helpers/debug.util';
// buscador.component.ts revisado

import { Component, Inject, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef,ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ModRepService }  from "../../reportes/compartido/servicios/mod-rep.service";
import { STG_GRID_STYLE, prepareDataForPagination } from 'app/shared/components/stg-table/stg-table.util';
import { Subject } from 'rxjs'; //de RxJS para esperar a que el usuario deje de escribir por 300-500ms antes de disparar la petición.
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'; 

@Component({
  selector: 'app-buscador-kaypacha',
  templateUrl: './buscador.component.html',
  styleUrls: ['./buscador.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // <--- Esto evita que el popup se re-renderice innecesariamente a menos que sus @Input cambien, que ya se hace con detectChanges()).
})
export class BuscadorKaypachaComponent implements OnInit, AfterViewInit {
  title: string = "Clientes en base de riesgos";
  dataSource: any[] = [];
  headerDefs: any;
  tableConf: any;
  dataLoadObs: boolean = true;
  dataSourceLenght: number = 0;
  showPaginator: boolean = false;
  enableSelectBtn: boolean = false;
  showCloseBtn: boolean;

  private selectedItem: any;
  private originalDataSource: any[] = [];
  private currentDataSource: any[] = [];
  private pageSize = 10;
  private searchSubject = new Subject<string>();

  @ViewChild('paginator', { static: false }) paginator: any;

  constructor(
    private dialogRef: MatDialogRef<BuscadorKaypachaComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    public antRep: ModRepService, // Cambiado a ModRepService
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.dataLoadObs = true;
    this.showCloseBtn = data.showCloseBtn;
  } 


  ngOnInit(): void {
    // Configurar el debounce
    this.searchSubject.pipe(
      debounceTime(500),       // Espera 400ms de calma
      distinctUntilChanged()   // No busca si el texto es igual al anterior
    ).subscribe(term => {
      this.fetchData(term);
    });

    // REGLA DE ORO: Las 'key' deben ser IGUALES a las columnas de tu SP en SQL
    this.headerDefs = [
      { label: 'Cuenta Cliente', key: 'HCTACLI', style: { 'min-width': '150px' } }, 
      { label: 'Nombre Cliente', key: 'HDESCLI', style: { 'min-width': '250px' } },
      { label: 'Fecha Reg.', key: 'FECHA', style: { 'min-width': '150px' } },
      { label: 'Tipo Cartera.', key: 'TIPO', style: { 'min-width': '100px' } }
    ];
    this.tableConf = { table: { grid: STG_GRID_STYLE } };
  }

 ngAfterViewInit(): void {
    this.fetchData();
  }
 
  
  // Actualiza fetchData para recibir el término de búsqueda
fetchData(termino: string = "") {
    this.dataLoadObs = true;
    
    // Enviamos el término al SP a través del parámetro "nom"
    this.antRep.getRegularTableResult("RS_BASE_NEG_01", { "nom": termino }).subscribe(
      x => {
        if (x && x.body && x.body.resultado && x.body.resultado.data) {
          const ds = x.body.resultado.data;
          this.originalDataSource = ds;
          this.currentDataSource = ds;
          this.dataSourceLenght = ds.length;
          this.prepPagination(); // Esta función se encarga de segmentar para el paginador
        }
        this.dataLoadObs = false;
        this.changeDetectorRef.detectChanges();
      },
      err => {
        printError("Error al filtrar en SQL:", err);
        this.dataLoadObs = false;
      }
    );
}

  private prepPagination() {
    let l = this.currentDataSource.length;
    if (l > this.pageSize) {
      this.showPaginator = true;
      this.changeDetectorRef.detectChanges();
      // Asegúrate de que los objetos tengan una propiedad única o usa el index
      prepareDataForPagination(this.pageSize, this.currentDataSource, 'pk');
      this.dataSourceLenght = l;
      if (this.paginator) this.paginator.toFirstPage();
      this.page(1);
    } else {
      this.showPaginator = false;
      this.dataSource = this.currentDataSource;
    }
  }

  // Actualiza el evento filter para que llame al servidor después de que el usuario escribe
 filter(evt: any) {
    const v = evt.target.value.toLowerCase();
    
    // Opción A: Si quieres que busque en el SQL cada vez (Recomendado para bases grandes)
    if (v.length > 2 || v.length === 0) { // Espera a que escriba 3 letras para no saturar el servidor
        //this.fetchData(v);
        this.searchSubject.next(v); // En lugar de llamar a fetchData directo
    }
 }
  
 // Asegúrate de que esta función exista para que el paginador cambie de hoja
changePage(evt: any) {
    this.page(evt.page);
}

  page(p: number) {
    this.dataSource = this.currentDataSource.filter(x => x.pk === p);
  }

  selectSec(r: any) {
    //printLog("Seleccionado", r);
    this.selectedItem = r;
    this.enableSelectBtn = true;
  }

  selectAndClose() {
    this.dialogRef.close(this.selectedItem);
  }
}