import { environment } from '../../../../environments/environment';

/** RESTPacket — Construye la URL y opciones para una petición al backend Ant. */
export class RESTPacket {
  private readonly rootUrl: string = environment.requestConfigRootURL;

  public baseRoute: string = '';
  private routeParams: Array<Record<string, string>> = [];
  private postParams: Record<string, string> = {};
  private optionsParams: Record<string, unknown> = {};
  private form: FormData | null = null;
  private flagForm = false;

  public setFormData(fd: FormData): void {
    this.form = fd;
    this.flagForm = true;
  }

  public haveFormData(): boolean {
    return this.flagForm;
  }

  public getFormData(): FormData | null {
    return this.form;
  }

  public pushRouteParam(k: string, v: string): void {
    this.routeParams.push({ [k]: v });
  }

  public pushPostParam(k: string, v: string): void {
    this.postParams[k] = v;
  }

  public getPostParams(): Record<string, string> {
    return this.postParams;
  }

  public getOptions(): Record<string, unknown> {
    return this.optionsParams;
  }

  public setOptions(opts: Record<string, unknown>): void {
    this.optionsParams = opts;
  }

  /** Construye la URL completa: `<rootUrl>/<baseRoute>?k=v&k2=v2`. Ejemplo: `https://stg.confianza.pe/cores2/ant/v1/g?w=<cipher>` */
  public computeURL(): string {
    let pms = '';
    this.routeParams.forEach((element) => {
      const key = Object.keys(element)[0];
      pms += `${key}=${element[key]}&`;
    });

    let route = this.baseRoute ? `/${this.baseRoute}` : '';
    if (pms !== '') {
      route += '?' + pms.substring(0, pms.length - 1);
    }

    return `${this.rootUrl}${route}`;
  }
}
