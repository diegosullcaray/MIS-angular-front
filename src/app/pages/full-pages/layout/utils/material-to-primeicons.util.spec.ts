import { mapMaterialIconToPrimeIcons, PRIMEICONS_FALLBACK } from './material-to-primeicons.util';

describe('mapMaterialIconToPrimeIcons', () => {
  it('traduce iconos conocidos del backend Ant', () => {
    expect(mapMaterialIconToPrimeIcons('assessment')).toBe('pi pi-chart-bar');
  });

  it('normaliza mayúsculas, espacios y guiones', () => {
    expect(mapMaterialIconToPrimeIcons('  ACCOUNT-CIRCLE ')).toBe('pi pi-user');
  });

  it('usa el icono genérico para valores ausentes o desconocidos', () => {
    expect(mapMaterialIconToPrimeIcons(null)).toBe(PRIMEICONS_FALLBACK);
    expect(mapMaterialIconToPrimeIcons('no-existe')).toBe(PRIMEICONS_FALLBACK);
  });
});
