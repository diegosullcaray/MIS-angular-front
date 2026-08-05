/**
 * Modelos e interfaces para el módulo de Actividades.
 * Migradas desde el legado STG (stg-app-mis-r22).
 */

// ─── Destino de Crédito ────────────────────────────────────────────────────

export interface DestinoCreditoItem {
  pk?: number;
  HCODSEC: string;      // Cod. Asesor
  HDESSEC: string;      // Nombre Asesor
  HCTACLI: string;      // Cuenta Cliente
  HDESCLI: string;      // Nombre Cliente
  HCODOPE: string;      // Operación
  HFECDES: string;      // Fecha Desembolso
  HMONDES: number;      // Monto Desembolso
  HINDCAR?: string;     // Ind. Cartera
  RDESPROD?: string;    // Producto Comercial
  HDESCRE?: string;     // Destino Crédito
  HFECVIS?: string;     // Fecha de Visita
  HCUMPLDC?: string;    // Cumple Destino Crédito ('Si' | 'No')
}

// ─── Prospectos Corresponsal ───────────────────────────────────────────────

export interface ProspectoCorresponsalItem {
  pk?: number;
  HCODSEC?: string;
  HDESSEC?: string;
  HFECPRO?: string;     // Fecha de Prospección
  HAPENOMB: string;     // Apellidos y Nombres / Razón Social
  HNUMDOC: string;      // DNI / Documento
  HNUMRUC?: string;     // RUC
  HCONSRUC?: string;    // Consulta RUC
  HCONSRCC?: string;    // Consulta RCC
  HCONSLNE?: string;    // Consulta Listas Negras
  HCELULAR: string;     // Celular
  HDIREC: string;       // Dirección
  HDISTR?: string;      // Distrito
  HPROV?: string;       // Provincia
  HDEPA?: string;       // Departamento
  HDCIIU?: string;      // CIIU
  HDESCOR?: string;     // Corresponsal / Corredor
  HDESAGE?: string;     // Agencia
  HGEOLATI?: string;    // Latitud
  HGEOLON?: string;     // Longitud
  HNOMCOM?: string;     // Nombre Comercial
  HDESTER?: string;     // Territorio
  HAPERTCTA?: string;   // Apertura de Cuenta ('SI' | 'NO')
  HESTDCORE?: string;   // Estado Corresponsal
  HINSTALAD?: string;   // Instalado ('SI' | 'NO')
  HFECINSTAL?: string;  // Fecha Instalado
  HMESINST?: string;    // Mes Instalado
  HZONA?: string;       // Zona ('URBANA' | 'RURAL')
  HPROSPEC?: string;    // Prospecto ('APLICA' | 'NO APLICA')
  HFIRMADN?: string;    // Firma DN
  HTAPERCC?: string;    // Tiempo Apertura Cuenta
  HCTALICEF?: string;   // Cuenta con Licencia de Funcionamiento ('SI' | 'NO')
  HLICFUNCI?: string;   // Licencia Funcionamiento (documento)
  HCANACAP?: string;    // Canal Captación
  HTIPAGENT?: string;   // Tipo Agente
  HCODSECASIG?: string; // Código Asesor Asignado
  HASEASIG?: string;    // Asesor Asignado
  HVINFAMI?: string;    // Vínculo Familiar ('SI' | 'NO')
  HTIPVINC?: string;    // Tipo Vínculo
  HIDCORRES?: string;   // ID Corresponsal
}

// ─── Transacciones Corresponsal (registro de consultas por fecha) ──────────

export interface TransaccionCorresponsalItem {
  pk?: number;
  HCODSEC?: string;
  HDESSEC?: string;
  HFECPRO?: string;     // Fecha
  HAPENOMB?: string;    // Nombre Cliente
  HNUMDOC?: string;     // DNI
  HNUMRUC?: string;     // RUC
  HDIREC?: string;      // Dirección
  HDEPA?: string;       // Departamento
  HPROV?: string;       // Provincia
  HDISTR?: string;      // Distrito
  HDESCOR?: string;     // Corredor
  HDESAGE?: string;     // Agencia
  HNOMCOM?: string;     // Nom. Comercial
  HCANACAP?: string;    // Canal Captación
  HDESTER?: string;     // Territorio
  HGEOLATI?: string;    // Latitud
  HGEOLON?: string;     // Longitud
  HINSTALAD?: string;   // Instalado
  HFECINSTAL?: string;  // Fecha Instalado
  HMESINST?: string;    // Mes Instalado
  HZONA?: string;       // Zona
  HPROSPEC?: string;    // Prospecto
  HAPERTCTA?: string;   // Apertura de Cuenta
  HESTDCORE?: string;   // Estado Corresponsal
  HTIPAGENT?: string;   // Tipo Agente
  HCODSECASIG?: string; // Cod. Asesor Asignado
  HASEASIG?: string;    // Asesor Asignado
  HVINFAMI?: string;    // Vínculo Familiar
  HTIPVINC?: string;    // Tipo Vínculo
  HIDCORRES?: string;   // ID Corresponsal
  HCONSRUC?: string;    // Consulta RUC
  HCONSRCC?: string;    // Consulta RCC
  HCONSLNE?: string;    // Consulta Listas Negras
  HCELULAR?: string;    // Celular
  HDCIIU?: string;      // CIIU
  HTAPERCC?: string;    // Tiempo Apertura Cuenta
  HCTALICEF?: string;   // Cuenta Lic. Funcionamiento
  HFOTNEGO?: string;    // Foto Negocio
  HLICFUNCI?: string;   // Licencia de Funcionamiento
}
