import { TestBed } from '@angular/core/testing';
import { BuscadorService, distanciaEdicion, normalizar, tokenizarConsulta } from './buscador.service';
import type { ConfiguracionIndice } from './buscador.model';

interface Registro {
  id: string;
  nombre: string;
  carpeta: string;
  sistema: string;
}

function registro(overrides: Partial<Registro> = {}): Registro {
  return { id: 'r-1', nombre: 'Monitor Metas Desembolso', carpeta: 'Avance Comercial', sistema: 'Reportes', ...overrides };
}

/** `nombre` antes que `carpeta`: el orden alimenta el criterio de atributo. */
const CONFIG: ConfiguracionIndice<Registro> = {
  atributosBuscables: [
    { nombre: 'nombre', valor: (r) => r.nombre },
    { nombre: 'carpeta', valor: (r) => r.carpeta },
  ],
  atributosFacetables: [{ nombre: 'sistema', valor: (r) => r.sistema }],
  id: (r) => r.id,
};

describe('BuscadorService', () => {
  let buscador: BuscadorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    buscador = TestBed.inject(BuscadorService);
  });

  function indiceCon(registros: Registro[]) {
    return buscador.crearIndice(CONFIG, registros);
  }

  function nombres(registros: Registro[], consulta: string, parametros = {}) {
    return indiceCon(registros)
      .buscar(consulta, parametros)
      .resultados.map((r) => r.objeto.nombre);
  }

  describe('primitivas de texto', () => {
    it('normalizar() saca acentos y baja a minúsculas', () => {
      expect(normalizar('Categorización')).toBe('categorizacion');
      expect(normalizar('ÁÉÍÓÚñ')).toBe('aeioun');
    });

    it('tokenizarConsulta() parte en palabras descartando signos', () => {
      expect(tokenizarConsulta('  Metas / Desembolso-2026 ')).toEqual(['metas', 'desembolso', '2026']);
    });

    it('distanciaEdicion() cuenta la transposición de letras adyacentes como UN solo error', () => {
      // Con Levenshtein puro "recetsa" estaría a 2 de "recetas"; con Damerau, a 1.
      expect(distanciaEdicion('recetas', 'recetsa', 2)).toBe(1);
    });

    it('distanciaEdicion() corta apenas se pasa del máximo', () => {
      expect(distanciaEdicion('hola', 'plutonio', 1)).toBe(2); // maximo + 1
    });
  });

  describe('matcheo de palabras', () => {
    it('encuentra por palabra exacta', () => {
      expect(nombres([registro()], 'desembolso')).toEqual(['Monitor Metas Desembolso']);
    });

    it('ignora acentos y mayúsculas en ambos lados', () => {
      const registros = [registro({ nombre: 'Categorización' })];
      expect(nombres(registros, 'CATEGORIZACION')).toEqual(['Categorización']);
    });

    it('la última palabra matchea por prefijo, porque es la que el usuario está tecleando', () => {
      expect(nombres([registro()], 'metas desem')).toEqual(['Monitor Metas Desembolso']);
    });

    it('las palabras que NO son la última exigen la palabra completa (queryType prefijo-ultima)', () => {
      // "categ" es prefijo de "Categorización", pero al no ser la última palabra
      // no alcanza — y está demasiado lejos como para entrar por tolerancia a typos.
      const registros = [registro({ nombre: 'Categorización Desembolso' })];
      expect(nombres(registros, 'categ desembolso')).toEqual([]);
    });

    it('con prefijo-todas, cualquier palabra matchea por prefijo', () => {
      const registros = [registro({ nombre: 'Categorización Desembolso' })];
      expect(nombres(registros, 'categ desembolso', { tipoConsulta: 'prefijo-todas' })).toEqual([
        'Categorización Desembolso',
      ]);
    });

    it('la tolerancia a typos sí aplica a las palabras que no son la última', () => {
      // "meta" no puede entrar por prefijo (no es la última), pero está a 1 typo
      // de "Metas" y tiene 4 caracteres, así que igual matchea.
      expect(nombres([registro()], 'meta desembolso')).toEqual(['Monitor Metas Desembolso']);
    });

    it('exige TODAS las palabras de la consulta', () => {
      expect(nombres([registro()], 'metas inexistente')).toEqual([]);
    });

    it('las palabras pueden repartirse entre atributos distintos', () => {
      // "desembolso" está en `nombre` y "comercial" en `carpeta`.
      expect(nombres([registro()], 'desembolso comercial')).toEqual(['Monitor Metas Desembolso']);
    });
  });

  describe('tolerancia a typos (defaults 4 y 8 de Algolia)', () => {
    it('tolera 1 typo desde 4 caracteres', () => {
      expect(nombres([registro({ nombre: 'Metas' })], 'metsa')).toEqual(['Metas']);
    });

    it('no tolera ningún typo por debajo de 4 caracteres', () => {
      expect(nombres([registro({ nombre: 'Red' })], 'rad')).toEqual([]);
    });

    it('tolera 2 typos desde 8 caracteres', () => {
      expect(nombres([registro({ nombre: 'Desembolso' })], 'desenbolzo')).toEqual(['Desembolso']);
    });

    it('no tolera 2 typos en una palabra de menos de 8 caracteres', () => {
      expect(nombres([registro({ nombre: 'Metas' })], 'mrtsa')).toEqual([]);
    });

    it('sinTolerarTypos apaga la tolerancia por completo', () => {
      expect(nombres([registro({ nombre: 'Metas' })], 'metsa', { sinTolerarTypos: true })).toEqual([]);
    });

    it('los umbrales son configurables, como en Algolia', () => {
      expect(nombres([registro({ nombre: 'Red' })], 'rad', { minimoParaUnTypo: 3 })).toEqual(['Red']);
    });
  });

  describe('ranking por desempate', () => {
    it('1º typos: la coincidencia exacta va antes que la que necesitó un typo', () => {
      const registros = [registro({ id: 'a', nombre: 'Metsa' }), registro({ id: 'b', nombre: 'Metas' })];
      expect(nombres(registros, 'metas')).toEqual(['Metas', 'Metsa']);
    });

    it('3º proximidad: con las palabras más juntas gana', () => {
      const registros = [
        registro({ id: 'lejos', nombre: 'Metas de colocación y seguimiento de Desembolso' }),
        registro({ id: 'cerca', nombre: 'Metas Desembolso' }),
      ];
      expect(nombres(registros, 'metas desembolso')[0]).toBe('Metas Desembolso');
    });

    it('4º atributo: matchear en el primer atributo buscable gana sobre matchear en el segundo', () => {
      const registros = [
        registro({ id: 'en-carpeta', nombre: 'Cartera', carpeta: 'Riesgos' }),
        registro({ id: 'en-nombre', nombre: 'Riesgos', carpeta: 'Cartera' }),
      ];
      expect(nombres(registros, 'riesgos')[0]).toBe('Riesgos');
    });

    it('5º exactas: la palabra completa gana sobre el prefijo con los demás criterios iguales', () => {
      const registros = [registro({ id: 'prefijo', nombre: 'Metropolitano' }), registro({ id: 'exacta', nombre: 'Metro' })];
      expect(nombres(registros, 'metro')).toEqual(['Metro', 'Metropolitano']);
    });

    it('el ranking personalizado solo desempata cuando los criterios textuales empatan', () => {
      const registros = [registro({ id: 'b', nombre: 'Cartera' }), registro({ id: 'a', nombre: 'Cartera' })];
      const indice = buscador.crearIndice({ ...CONFIG, rankingPersonalizado: (x, y) => x.id.localeCompare(y.id) }, registros);

      expect(indice.buscar('cartera').resultados.map((r) => r.objeto.id)).toEqual(['a', 'b']);
    });

    it('expone los criterios con los que ordenó, para poder depurar', () => {
      const indice = indiceCon([registro({ nombre: 'Metas' })]);
      expect(indice.buscar('metsa').resultados[0].ranking).toEqual({
        typos: 1,
        palabras: 1,
        proximidad: 0,
        atributo: 0,
        exactas: 0,
      });
    });
  });

  describe('resaltado', () => {
    it('envuelve la coincidencia en <mark>', () => {
      const indice = indiceCon([registro({ nombre: 'Metas Desembolso' })]);
      expect(indice.buscar('desembolso').resultados[0].resaltado['nombre'].valor).toBe('Metas <mark>Desembolso</mark>');
    });

    it('en un prefijo resalta SOLO la parte tecleada, como Algolia', () => {
      const indice = indiceCon([registro({ nombre: 'Categorización' })]);
      expect(indice.buscar('cate').resultados[0].resaltado['nombre'].valor).toBe('<mark>Cate</mark>gorización');
    });

    it('en un prefijo con typo resalta la coincidencia más larga, no la primera que entra', () => {
      const indice = indiceCon([registro({ nombre: 'Monitor Metas Desembolso' })]);
      // "desenbol" trae una `n` por `m`. El mejor prefijo es "Desembol" (1 typo);
      // cortar antes, en "Desembo", también entraría pero dejaría el resaltado corto.
      expect(indice.buscar('desenbol').resultados[0].resaltado['nombre'].valor).toBe(
        'Monitor Metas <mark>Desembol</mark>so'
      );
    });

    it('resalta sobre el texto original respetando los acentos que la búsqueda ignoró', () => {
      const indice = indiceCon([registro({ nombre: 'Priorización' })]);
      expect(indice.buscar('priorizacion').resultados[0].resaltado['nombre'].valor).toBe('<mark>Priorización</mark>');
    });

    it('escapa el HTML del dato antes de insertar las etiquetas', () => {
      const indice = indiceCon([registro({ nombre: '<img src=x onerror=alert(1)> cartera' })]);
      const valor = indice.buscar('cartera').resultados[0].resaltado['nombre'].valor;

      expect(valor).toContain('&lt;img');
      expect(valor).not.toContain('<img');
      expect(valor).toContain('<mark>cartera</mark>');
    });

    it('marca nivel "total" cuando el atributo cubrió todas las palabras, y "parcial" si no', () => {
      const indice = indiceCon([registro({ nombre: 'Metas Desembolso', carpeta: 'Avance Comercial' })]);
      const { resaltado } = indice.buscar('metas comercial').resultados[0];

      expect(resaltado['nombre'].nivel).toBe('parcial');
      expect(resaltado['carpeta'].nivel).toBe('parcial');
    });

    it('marca nivel "ninguna" y no resalta el atributo que no matcheó', () => {
      const indice = indiceCon([registro({ nombre: 'Metas', carpeta: 'Avance Comercial' })]);
      const { resaltado } = indice.buscar('metas').resultados[0];

      expect(resaltado['carpeta']).toEqual({
        valor: 'Avance Comercial',
        nivel: 'ninguna',
        palabrasCoincidentes: [],
        resaltadoCompleto: false,
      });
    });

    it('resaltadoCompleto es true solo si se resaltó el atributo entero', () => {
      const indice = indiceCon([registro({ nombre: 'Cartera' })]);
      expect(indice.buscar('cartera').resultados[0].resaltado['nombre'].resaltadoCompleto).toBe(true);
      expect(indice.buscar('carte').resultados[0].resaltado['nombre'].resaltadoCompleto).toBe(false);
    });

    it('lista las palabras de la consulta que coincidieron', () => {
      const indice = indiceCon([registro({ nombre: 'Metas Desembolso' })]);
      expect(indice.buscar('metas desembolso').resultados[0].resaltado['nombre'].palabrasCoincidentes).toEqual([
        'metas',
        'desembolso',
      ]);
    });
  });

  describe('estrategia cuando no hay resultados', () => {
    const registros = [registro({ nombre: 'Monitor Metas Desembolso' })];

    it('por defecto no reintenta: si falta una palabra, no hay resultados', () => {
      const respuesta = indiceCon(registros).buscar('metas inexistente');
      expect(respuesta.resultados).toEqual([]);
      expect(respuesta.palabrasUsadas).toBe(2);
    });

    it('con "ultimas" suelta palabras desde el final hasta encontrar algo', () => {
      const respuesta = indiceCon(registros).buscar('metas inexistente', { estrategiaSinResultados: 'ultimas' });

      expect(respuesta.resultados.map((r) => r.objeto.nombre)).toEqual(['Monitor Metas Desembolso']);
      expect(respuesta.palabrasUsadas).toBe(1);
    });

    it('con "primeras" suelta palabras desde el principio', () => {
      const respuesta = indiceCon(registros).buscar('inexistente desembolso', { estrategiaSinResultados: 'primeras' });

      expect(respuesta.resultados.map((r) => r.objeto.nombre)).toEqual(['Monitor Metas Desembolso']);
      expect(respuesta.palabrasUsadas).toBe(1);
    });
  });

  describe('facetas', () => {
    const registros = [
      registro({ id: 'a', nombre: 'Cartera', sistema: 'Reportes' }),
      registro({ id: 'b', nombre: 'Cartera', sistema: 'Presupuesto' }),
      registro({ id: 'c', nombre: 'Cartera', sistema: 'Presupuesto' }),
    ];

    it('cuenta los valores de cada faceta sobre los resultados', () => {
      expect(indiceCon(registros).buscar('cartera').facetas).toEqual({ sistema: { Reportes: 1, Presupuesto: 2 } });
    });

    it('filtrar por una faceta acota los resultados', () => {
      const respuesta = indiceCon(registros).buscar('cartera', { filtrosFaceta: { sistema: ['Presupuesto'] } });
      expect(respuesta.total).toBe(2);
    });

    it('los conteos de una faceta ignoran su propio filtro, para poder cambiar de opción sin limpiarla', () => {
      const respuesta = indiceCon(registros).buscar('cartera', { filtrosFaceta: { sistema: ['Presupuesto'] } });
      // "Reportes" sigue mostrando su conteo aunque el filtro activo sea Presupuesto.
      expect(respuesta.facetas['sistema']).toEqual({ Reportes: 1, Presupuesto: 2 });
    });

    it('varios valores en una misma faceta se combinan con OR', () => {
      const respuesta = indiceCon(registros).buscar('cartera', { filtrosFaceta: { sistema: ['Reportes', 'Presupuesto'] } });
      expect(respuesta.total).toBe(3);
    });
  });

  describe('respuesta', () => {
    it('con consulta vacía lista todo, sin resaltar', () => {
      const respuesta = indiceCon([registro({ id: 'a' }), registro({ id: 'b' })]).buscar('');

      expect(respuesta.total).toBe(2);
      expect(respuesta.palabrasUsadas).toBe(0);
      expect(respuesta.resultados[0].resaltado['nombre'].nivel).toBe('ninguna');
    });

    it('corta la lista en maximoResultados pero informa el total real', () => {
      const registros = Array.from({ length: 30 }, (_, i) => registro({ id: `r-${i}` }));
      const respuesta = indiceCon(registros).buscar('desembolso', { maximoResultados: 5 });

      expect(respuesta.resultados.length).toBe(5);
      expect(respuesta.total).toBe(30);
    });

    it('numera las posiciones desde 0 y reporta cuánto tardó', () => {
      const respuesta = indiceCon([registro({ id: 'a' }), registro({ id: 'b' })]).buscar('desembolso');

      expect(respuesta.resultados.map((r) => r.posicion)).toEqual([0, 1]);
      expect(respuesta.duracionMs).toBeGreaterThanOrEqual(0);
    });
  });
});
