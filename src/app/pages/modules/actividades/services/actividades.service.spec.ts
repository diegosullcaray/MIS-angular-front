import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActividadesService } from './actividades.service';
import { WinderService } from '../../../../core/winder/winder/winder.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { Strand } from '../../../../core/winder/winder/strand.class';
import { environment } from '../../../../../environments/environment';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';

function inspeccionar(strand: Strand): { actionRoute: string; name: string; payload: Record<string, unknown> } {
  return JSON.parse(JSON.stringify(strand));
}

function usuario(overrides: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return {
    id: 'u-1',
    nombre: 'Ana Torres',
    email: 'ana.torres@confianza.pe',
    rol: 'admin-sistema',
    subsistemas: [],
    codBt: 'BT-001',
    ...overrides,
  };
}

describe('ActividadesService', () => {
  let service: ActividadesService;
  let shell: ShellStateService;
  let prepareSpy: ReturnType<typeof vi.fn>;
  let postSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const respuesta: IWinderResponse = { code: '0', headers: {}, body: {} };
    const getSpy = vi.fn().mockReturnValue(of(respuesta));
    postSpy = vi.fn().mockReturnValue(of({}));
    prepareSpy = vi.fn().mockReturnValue({ get: getSpy, post: postSpy });

    TestBed.configureTestingModule({
      providers: [{ provide: WinderService, useValue: { prepare: prepareSpy } }],
    });
    service = TestBed.inject(ActividadesService);
    shell = TestBed.inject(ShellStateService);
  });

  it('usa el puerto/appId/secret del módulo "app" (puerto 6302, igual que Kaypacha)', () => {
    service.getRegResultadosDestCred('BT-002').subscribe();

    const [conn] = prepareSpy.mock.calls[0];
    expect(conn).toEqual({ port: 6302, secret: environment.moduleSecrets.app, appId: 'app' });
  });

  it('userCodBt toma el cod_bt del usuario activo', () => {
    shell.setUsuarioActivo(usuario({ codBt: 'BT-005' }));
    expect(service.userCodBt).toBe('BT-005');
  });

  it('userCodBt es cadena vacía sin usuario activo', () => {
    expect(service.userCodBt).toBe('');
  });

  it('getRegResultadosDestCred() usa el cod_bt del usuario activo si no se pasa uno explícito', () => {
    shell.setUsuarioActivo(usuario({ codBt: 'BT-001' }));

    service.getRegResultadosDestCred().subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('actividades.get_dest_cre');
    expect(strand.payload).toEqual({ cod_bt: 'BT-001' });
  });

  it('getRegResultadosDestCred(codBT) prioriza el código explícito', () => {
    shell.setUsuarioActivo(usuario({ codBt: 'BT-001' }));

    service.getRegResultadosDestCred('BT-999').subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.payload).toEqual({ cod_bt: 'BT-999' });
  });

  it('postRegResultadosDestCred() serializa el objeto dado como ov_json', () => {
    service.postRegResultadosDestCred({ id: 1, estado: 'Aprobado' }).subscribe();

    expect(postSpy).toHaveBeenCalled();
    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('actividades.post_dest_cre');
    expect(strand.payload).toEqual({ ov_json: JSON.stringify({ id: 1, estado: 'Aprobado' }) });
  });

  it('getRegResultadosListProsp() pide corresponsal.get_list_prosp con el cod_bt correspondiente', () => {
    service.getRegResultadosListProsp('BT-003').subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('corresponsal.get_list_prosp');
    expect(strand.payload).toEqual({ cod_bt: 'BT-003' });
  });

  it('postRegResultadosProsp() serializa el objeto dado como ov_json', () => {
    service.postRegResultadosProsp({ nombre: 'Prospecto X' }).subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('corresponsal.post_reg_prosp');
    expect(strand.payload).toEqual({ ov_json: JSON.stringify({ nombre: 'Prospecto X' }) });
  });
});
