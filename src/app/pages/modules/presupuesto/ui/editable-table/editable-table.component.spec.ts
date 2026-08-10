import { TestBed } from '@angular/core/testing';
import { EditableTableComponent } from './editable-table.component';
import type { ColumnaTabla, FilaLineaSimple } from '../../models';

describe('EditableTableComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EditableTableComponent] });
  });

  function crear() {
    return TestBed.createComponent(EditableTableComponent);
  }

  it('columnasPlanas() aplana un nivel de columnas agrupadas, preservando el orden', () => {
    const fixture = crear();
    const columnas: ColumnaTabla[] = [
      { label: 'Fecha', key: 'fec_pro' },
      { label: 'Desembolso', hijos: [{ label: 'Asesores Nuevos', key: 'b1' }, { label: 'Asesores en Producción', key: 'b2' }] },
      { label: 'Saldo Cierre', key: 'a3' },
    ];
    fixture.componentRef.setInput('columnas', columnas);
    fixture.detectChanges();

    expect(fixture.componentInstance['columnasPlanas']().map((c) => c.key)).toEqual(['fec_pro', 'b1', 'b2', 'a3']);
  });

  it('tieneGrupos() es true solo si alguna columna trae hijos', () => {
    const fixture = crear();
    fixture.componentRef.setInput('columnas', [{ label: 'Fecha', key: 'fec_pro' }]);
    fixture.detectChanges();
    expect(fixture.componentInstance['tieneGrupos']()).toBe(false);

    fixture.componentRef.setInput('columnas', [{ label: 'G', hijos: [{ label: 'x', key: 'x' }] }]);
    fixture.detectChanges();
    expect(fixture.componentInstance['tieneGrupos']()).toBe(true);
  });

  it('onCambio() muta la fila por referencia y emite el evento celdaEditada', () => {
    const fixture = crear();
    fixture.componentRef.setInput('columnas', [{ label: 'Saldo', key: 'a1' }]);
    fixture.detectChanges();

    const fila: FilaLineaSimple = { ord: 1, a1: 100 };
    const emitSpy = vi.fn();
    fixture.componentInstance.celdaEditada.subscribe(emitSpy);

    fixture.componentInstance['onCambio'](fila, 'a1', 250);

    expect(fila['a1']).toBe(250);
    expect(emitSpy).toHaveBeenCalledWith({ fila, key: 'a1', valor: 250 });
  });

  it('formatear() muestra los porcentajes multiplicados por 100 con 2 decimales y el símbolo "%"', () => {
    const fixture = crear();
    fixture.componentRef.setInput('columnas', []);
    fixture.detectChanges();
    expect(fixture.componentInstance['formatear'](0.1234, 'percent')).toBe('12.34%');
  });

  it('formatear() muestra los números con separador de miles (formato es-PE)', () => {
    const fixture = crear();
    fixture.componentRef.setInput('columnas', []);
    fixture.detectChanges();
    expect(fixture.componentInstance['formatear'](12345.678, 'number')).toBe('12,345.68');
  });

  it('formatear() de un valor vacío/nulo devuelve una cadena vacía', () => {
    const fixture = crear();
    fixture.componentRef.setInput('columnas', []);
    fixture.detectChanges();
    expect(fixture.componentInstance['formatear'](null, 'number')).toBe('');
    expect(fixture.componentInstance['formatear'](undefined, 'number')).toBe('');
  });

  it('esEditable() por defecto es siempre false (columnas de solo lectura, ej. Comp. Prod.)', () => {
    const fixture = crear();
    fixture.componentRef.setInput('columnas', []);
    fixture.detectChanges();
    expect(fixture.componentInstance.esEditable()({ ord: 1 }, 'd_1')).toBe(false);
  });
});
