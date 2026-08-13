/** Pestaña de categoría de `PrincipalComponent` — orden visual, no coincide con el `cod_cat` del backend. */
export interface TabCategoria {
  codCat: number;
  titulo: string;
}

/** Columna fija que precede a las columnas históricas dinámicas de `CategoriaMetricasTablaComponent`. */
export interface ColumnaFija {
  key: string;
  label: string;
  headerBg?: string;
}
