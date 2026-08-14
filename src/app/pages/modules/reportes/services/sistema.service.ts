import { Injectable } from '@angular/core';

/**
 * Datos de los reportes del dominio "Sistema" (hoy: Usabilidad).
 *
 * Sin métodos por ahora: Usabilidad no consulta ningún backend — sus datos
 * son fijos (`models/sistema/sistema.model.ts`), migrados tal cual del legado. Este
 * service queda como el punto de extensión de este dominio para cuando haya
 * un endpoint real (ej. tracking de uso de reportes).
 */
@Injectable({ providedIn: 'root' })
export class SistemaService {}
