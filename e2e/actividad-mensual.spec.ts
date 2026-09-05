import { test, expect } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

/**
 * Smoke exhaustivo de los 35 reportes migrados de "Actividad Mensual" (Ejercicio 03).
 */
const REPORTES: readonly [string, string][] = [
  // 1. Aplicativo Movil
  ['/app/reportes/leg/com/rma/adm/app_uso_m', 'PLAN DE DATOS'],
  // 2. Tablero Digital
  ['/app/reportes/repositorio/actividad-mensual/tab-digital/usa-come-m', 'Tablero Digital Comercial'],
  // 3. Huella Carbono
  ['/app/reportes/leg/com/rma/adm/huella-carbono-m', 'Huella Carbono'],
  // 4. Portafolio Reasignado
  ['/app/reportes/leg/com/rma/adm/gest_cart_her-flujo', 'Gestión de Cartera Reasignada'],
  ['/app/reportes/leg/com/rma/adm/gest_cart_stock', 'Gestión de Cartera Stock'],
  // 5. Captaciones
  ['/app/reportes/leg/com/rma/adm/cmg-capta', 'CMG Captaciones'],
  ['/app/reportes/leg/com/rma/adm/seg-bp-men', 'Seguimiento BP'],
  ['/app/reportes/leg/com/rma/adm/capta-caract-canal-comercial-m', 'Captación por Canal Comercial'],
  ['/app/reportes/leg/com/rma/adm/capta-caract-canal-operacional-m', 'Captación por Canal Operaciones'],
  // 6. Cartera
  ['/app/reportes/leg/com/rma/adm/cart-prod', 'Cartera por Producto'],
  ['/app/reportes/repositorio/actividad-mensual/cartera/cmg-cartera-m', 'CMG Cartera'],
  ['/app/reportes/leg/com/rma/adm/pro-gob-m', 'Programas del Gobierno'],
  ['/app/reportes/leg/com/rma/adm/cont-elect-m', 'Contratación Electrónica'],
  ['/app/reportes/leg/com/rma/adm/rep-aut-tas', 'Ranking de Autonomías de Tasas'],
  ['/app/reportes/repositorio/actividad-mensual/cartera/estructura-desembolsos', 'Estructura de Desembolsos'],
  ['/app/reportes/leg/com/rma/adm/tp-mes', 'Tasas Mes por Producto'],
  ['/app/reportes/leg/com/rma/adm/seg_comite', 'Seguimiento Comité de Créditos'],
  ['/app/reportes/leg/com/rma/adm/dat-prod-men', 'Datos por Producto'],
  ['/app/reportes/repositorio/actividad-mensual/cartera/agro-mix-m', 'Gestión Comercial - Portafolio Agrícola'],
  // 7. Cartera en Mora
  ['/app/reportes/leg/com/rma/adm/cmg-mora', 'CMG Cartera en Mora'],
  ['/app/reportes/leg/com/rma/adm/graf-cosechas', 'Cosechas'],
  ['/app/reportes/leg/com/rma/adm/mon-efec', 'Monitor de Efectividades'],
  ['/app/reportes/leg/com/rma/adm/mor-efe', 'Mora y Efectividad por Tramos'],
  ['/app/reportes/leg/com/rma/adm/mon-efec-reasig', 'Monitor de Efectividades Reasignados'],
  ['/app/reportes/leg/com/rma/adm/graf-dashboard-CN', 'Dashboard Cero Cuota Nueva'],
  ['/app/reportes/leg/com/rma/adm/gest_cart_her', 'Gestión de Cartera Reasignada'],
  ['/app/reportes/leg/com/rma/adm/cmg-mora-simp-m', 'CMG Cartera en Mora Sin Impulsa'],
  ['/app/reportes/leg/com/rma/adm/sema-cosechas', 'SEMAFORO COSECHAS'],
  // 8. Clientes
  ['/app/reportes/leg/com/rma/adm/cmg-cli', 'CMG Clientes Activo'],
  ['/app/reportes/leg/com/rma/adm/desemp-social', 'Desempeño Social'],
  ['/app/reportes/leg/com/rma/adm/cmg_cliente_flujo', 'CMG Clientes Flujo'],
  // 9. Rentabilidad
  ['/app/reportes/leg/com/rma/adm/res-un', 'Resultados por Unidad de Negocio'],
  // 10. Ranking Kaypacha
  ['/app/reportes/leg/com/rma/adm/rank-kay', 'Ranking Kaypacha Comercial'],
  ['/app/reportes/leg/com/rma/adm/rank-kay-ope', 'Ranking Kaypacha Operaciones'],
  ['/app/reportes/leg/com/rma/adm/rank-kay-recu', 'Ranking Kaypacha Recuperaciones'],
];

test.describe('Actividad Mensual — smoke de las 35 rutas migradas', () => {
  for (const [ruta, titulo] of REPORTES) {
    test(`${titulo} resuelve en ${ruta}`, async ({ page }) => {
      await inyectarSesionVigente(page);
      await page.goto(ruta);
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: titulo, exact: true })).toBeVisible();
      expect(page.url()).toContain(ruta);
    });
  }
});
