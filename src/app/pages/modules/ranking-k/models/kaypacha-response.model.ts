/** Estructura de respuesta del servicio backend Kaypacha. */
export interface KaypachaResponseBody {
  resultado?: {
    list?: Array<{ JSONLIST: string }>;
    datTable?: Array<{ fechaMax?: string }> | string;
  };
}
