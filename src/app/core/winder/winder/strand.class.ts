/**
 * Strand — unidad de petición al backend Ant.
 *
 * Cada Strand representa un "actionRoute" del backend con su
 * payload de parámetros. Múltiples Strands pueden enviarse en
 * una misma request (batch).
 *
 * Migrado del STG (stg-app-mis-r22) al nuevo stack Angular 22.
 */
export class Strand {
  private actionRoute: string;
  private name: string;
  private payload: Record<string, unknown>;
  formData: FormData | undefined;
  private withFormData: boolean;

  constructor(actionRoute: string, name?: string) {
    this.actionRoute = actionRoute;
    this.name = name ?? '';
    this.payload = {};
    this.withFormData = false;
  }

  public haveFormData(): boolean {
    return this.withFormData;
  }

  public setFile(file: File, id: string): void {
    this.formData = new FormData();
    this.formData.append('winder-file', file, id);
    this.pushToPayload('_req_file_name_', file.name);
    this.pushToPayload('_req_file_id_', id);
    this.withFormData = true;
  }

  public getFormData(): FormData | undefined {
    return this.formData;
  }

  public addToPayload(o: Record<string, unknown>): Strand {
    this.payload = Object.assign(this.payload, o);
    return this;
  }

  public pushToPayload(k: string, v: unknown): Strand {
    this.payload[k] = v;
    return this;
  }
}
