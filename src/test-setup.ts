/**
 * Preparación global de las pruebas unitarias.
 *
 * Dos cosas, las dos sobre el almacenamiento del navegador.
 */

/**
 * Métodos de `Storage.prototype` tal como estaban al arrancar.
 *
 * Sirven de referencia para detectar que un spec los reemplazó: es la forma en
 * que este repositorio simula un almacenamiento bloqueado — ver
 * `almacenamiento-navegador.spec.ts`, que pisa `Storage.prototype.clear` con
 * una función que lanza `QuotaExceededError`.
 */
const METODOS_ORIGINALES = new Map<string, unknown>(
  typeof Storage === 'undefined'
    ? []
    : (['getItem', 'setItem', 'removeItem', 'clear'] as const).map((m) => [m, Storage.prototype[m]]),
);

/**
 * Deja pasar primero el doble de prueba, si lo hay.
 *
 * Sin esto el respaldo sería *más* tolerante que el almacén real: un spec que
 * pisa el prototipo para que falle vería un `clear()` que funciona igual, y la
 * prueba de "almacenamiento bloqueado" pasaría a verde por el motivo
 * equivocado.
 */
function respetarDobleDePrueba(metodo: 'getItem' | 'setItem' | 'removeItem' | 'clear', args: unknown[]): void {
  if (typeof Storage === 'undefined') return;

  const actual = Storage.prototype[metodo] as unknown;
  if (actual !== METODOS_ORIGINALES.get(metodo)) {
    (actual as (...a: unknown[]) => unknown).apply(undefined, args);
  }
}

/** Almacén en memoria con la forma de `Storage`, para cuando jsdom no da uno. */
function almacenEnMemoria(): Storage {
  const datos = new Map<string, string>();

  return {
    get length() {
      return datos.size;
    },
    key: (indice: number) => [...datos.keys()][indice] ?? null,
    getItem(clave: string) {
      respetarDobleDePrueba('getItem', [clave]);
      return datos.get(clave) ?? null;
    },
    setItem(clave: string, valor: string) {
      respetarDobleDePrueba('setItem', [clave, valor]);
      datos.set(clave, String(valor));
    },
    removeItem(clave: string) {
      respetarDobleDePrueba('removeItem', [clave]);
      datos.delete(clave);
    },
    clear() {
      respetarDobleDePrueba('clear', []);
      datos.clear();
    },
  } as Storage;
}

/** `true` cuando el almacén no está: puede faltar o su acceso puede lanzar. */
function falta(nombre: 'localStorage' | 'sessionStorage'): boolean {
  try {
    return (globalThis as Record<string, unknown>)[nombre] == null;
  } catch {
    return true;
  }
}

/**
 * 1) Garantizar que `localStorage` y `sessionStorage` existan.
 *
 * jsdom **no** los expone cuando el documento tiene un origen opaco: con
 * `about:blank` o con un `file://`, el getter lanza
 * `SecurityError: localStorage is not available for opaque origins`. Vitest no
 * puede copiar al worker una propiedad cuyo getter lanza, así que el global
 * queda `undefined` y todo spec que toque almacenamiento revienta con
 * `Cannot read properties of undefined (reading 'clear')` — 92 casos en 12
 * archivos, todos por lo mismo.
 *
 * Que eso pase depende de la URL con la que se arme jsdom, y esa URL varía
 * entre máquinas: acá el entorno la resuelve con un origen real y la suite pasa;
 * en la máquina donde se levantó la incidencia, no. Este respaldo hace que la
 * suite deje de depender de ese detalle. Donde el almacén real existe, no se
 * instala nada.
 */
for (const nombre of ['localStorage', 'sessionStorage'] as const) {
  if (!falta(nombre)) continue;

  const almacen = almacenEnMemoria();
  for (const destino of [globalThis, typeof window !== 'undefined' ? window : undefined]) {
    if (destino) {
      Object.defineProperty(destino, nombre, { value: almacen, configurable: true, writable: true });
    }
  }
}

/**
 * 2) Vaciar `sessionStorage` antes de cada test.
 *
 * El caché de jerarquía persiste ahí, y jsdom comparte ese almacén entre los
 * archivos de spec del mismo worker: sin vaciarlo, un spec le sirve a otro un
 * árbol ya resuelto y el segundo nunca llama al backend que dobló.
 */
beforeEach(() => {
  sessionStorage.clear();
});
