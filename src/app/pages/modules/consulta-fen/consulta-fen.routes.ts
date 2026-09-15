import { Routes } from '@angular/router';

export const CONSULTA_FEN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/consulta-fen/consulta-fen.component').then((m) => m.ConsultaFenComponent),
    title: 'Consulta FEN - CENEPRED',
  },
];
