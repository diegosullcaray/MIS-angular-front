export const incentivos3IconSet = {
    car:'work',//cartera [0]
    cli:'groups',//clientes [1]
    sc1:'visibility',//supervision [2]
    efec1:'battery_6_bar',//efec -30 a 0 [3]
    efec2:'battery_3_bar',//efec 1 a 30 [4]
    efec3:'battery_1_bar',//efec 31 a 60 [5]

    prod:'grade',//productividad [6]
    rop:'assignment_late',//riesgo ope [7]
    clim:'sunny',//clima [8]
    clib:'assignment_ind',//bancarizados [9]
    ret:'co_present',//retencion [10]
    sis:'group_work',//sistematica [11]
    rot:'compare_arrows',//rotacion [12]
    tas:'difference',//Tasas [13]

    gru: 'work',//variacion grupos [14],
    pagop: 'groups',//pago puntual [15],
    tgru: 'work',//tamaño grupos [16],
    areu: 'work',//asistencia a reuniones [17],
    acom: 'work'//asesores comisionan [18],
};


import { STG_GRID_STYLE } from "app/shared/components/stg-table/stg-table.util";

export const loadingConf = {
    height: '307px'
};
export const tableHeaders=[
    {
        "label": "DOR",
        "key": "HDOR"
    } 
];
export const tableHeaders2=[
    {
        "label": "DOR",
        "key": "HDOR"
    } 
];
export const tableOptions={
    style:{
        'font-size':'14px'
    },
    header:{
        style:{
            'background':'rgb(79, 129, 189)'
        },
        cellStyle:{
            'height':'40px',
            'width':'85px',
            'min-width':'85px',
            'max-width':'85px'
        }
    },
    grid:{
        enabled:true
    }
};
 
export const tableConf = {
    table: {
        height: '400px',
        //grid: '1px solid rgb(31, 73, 125)'
        //grid: '1px solid rgb(216, 216, 216)'
        grid: STG_GRID_STYLE
    },
    header: {
        'min-width': '100px',
        'background-color':'rgb(79,129,189)'
    },cellStyle: {
        'height': '40px',
        'text-align': 'left'
      }
};
 
export const tableConf2 = {
    table: {
        height: '400px',
        //grid: '1px solid rgb(31, 73, 125)'
        //grid: '1px solid rgb(216, 216, 216)'
        grid: STG_GRID_STYLE
    },
    header: {
        'min-width': '100px',
        'background-color':'rgb(79,129,189)'
    }
};
export const tableConf3 = {
    table: {
        height: '400px',
        //grid: '1px solid rgb(31, 73, 125)'
        //grid: '1px solid rgb(216, 216, 216)'
        grid: STG_GRID_STYLE
    },
    header: {
        'min-width': '100px',
        'background-color':'rgb(79,129,189)'
    }
};
export const tableConf4 = {
    table: {
        height: '400px',
        //grid: '1px solid rgb(31, 73, 125)'
        //grid: '1px solid rgb(216, 216, 216)'
        grid: STG_GRID_STYLE
    },
    header: {
        'min-width': '100px',
        'background-color':'rgb(79,129,189)'
    }
};