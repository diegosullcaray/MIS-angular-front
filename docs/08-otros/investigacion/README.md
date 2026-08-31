# Carpeta de Investigación y Documentación para Tesis de Grado

Esta carpeta contiene la documentación técnica y académica generada a partir del análisis comparativo exhaustivo entre el **Sistema Legacy (`MIS-FUENTE`)** y el **Sistema Modernizado (`MIS-angular-front`)**.

---

## Contenido del Repositorio de Investigación

| Archivo | Descripción y Utilidad para la Tesis | Capítulo de Destino Sugerido |
|---|---|---|
| [`INFORME_TECNICO_REINGENIERIA_ARQUITECTURA_MIS.md`](./INFORME_TECNICO_REINGENIERIA_ARQUITECTURA_MIS.md) | **Documento Principal.** Informe técnico estructurado en 5 capítulos con rigor académico: Canon del sistema, Arquitecturas As-Is y To-Be con diagramas Mermaid, matrices comparativas de 25 indicadores y casos de estudio con código real refactorizado. | **Capítulos de Metodología, Arquitectura de Software, Resultados y Conclusiones.** |
| [`MATRIZ_EVIDENCIAS_METRICAS_TESIS.md`](./MATRIZ_EVIDENCIAS_METRICAS_TESIS.md) | **Anexo Técnico.** Mapeo de los 12 módulos de negocio, análisis de mitigación de vulnerabilidades OWASP/Auditoría, alineación con ISO/IEC 25010 y glosario de términos. | **Anexos, Marco Teórico y Capítulo de Metodología.** |

---

## Guía Rápida de Uso para la Redacción de la Tesis

1. **Para el Marco Teórico y Estado del Arte:**
   - Consultar la sección de justificación de paradigmas (*Signals*, *Zoneless Change Detection*, *Standalone Components*, *Vite/esbuild* vs. *Webpack/Zone.js*).
   - Utilizar el Glosario de Términos y la justificación según la norma **ISO/IEC 25010**.

2. **Para el Capítulo de Metodología:**
   - Emplear el enfoque pre-experimental comparativo **As-Is vs. To-Be**.
   - Citar la metodología de análisis estático de código y auditoría técnica de 21 hallazgos verificados.

3. **Para el Capítulo de Arquitectura y Desarrollo:**
   - Incluir los diagramas de arquitectura Mermaid (As-Is y To-Be).
   - Utilizar la matriz de reglas de dependencias entre capas (`core/`, `pages/modules/`, `shared/`, `theme/`).

4. **Para el Capítulo de Resultados y Discusión:**
   - Insertar la **Gran Matriz Comparativa Integral (25 indicadores técnicos)**.
   - Presentar los casos de estudio con fragmentos de código (*Destino de Crédito*, *Guards Funcionales*, *Defensa en Profundidad en el Build*).
