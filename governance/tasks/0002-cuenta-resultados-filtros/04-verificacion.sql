-- MOD-0002 · Verificación de mod_rep.rep.RTABCUERES01_NEW
--
-- Solo lectura: SELECT sobre las tablas y ejecuciones de los SP de reporte (solo usan tablas #temporales).
-- Cada paso es un lote aparte (GO). Los que necesitan el SP nuevo se saltean con un aviso si todavía no existe.

USE mod_rep;
GO

------------------------------------------------------------------------------------------------
-- PASO 1 (ANTES de crear el nuevo): confirmar los supuestos del SP (02-analisis.md, sección 4)
------------------------------------------------------------------------------------------------

-- 1a. Niveles cargados. Se esperan WCODREL 1, 3, 4 y 5. Si falta el 3, los nodos debajo de FC salen vacíos;
--     si falta el 4 o el 5, el filtro de producto sale vacío.
SELECT  WCODREL, COUNT(*) AS filas, COUNT(DISTINCT WCODSEC) AS codigos_wcodsec,
        COUNT(DISTINCT WFECPRO) AS periodos, MIN(WFECPRO) AS desde, MAX(WFECPRO) AS hasta
FROM    dbo.WREPPYG001
GROUP BY WCODREL
ORDER BY WCODREL;

-- 1b. ¿WCODSEC en los niveles 3 y 5 corresponde al código alfanumérico del asesor?
--     Revisar las coincidencias antes de activar.
DECLARE @ultimo date = (SELECT MAX(WFECPRO) FROM dbo.WREPPYG001 WHERE WCODREL = 3);
DECLARE @jer date = (SELECT MAX(RFECPRO) FROM storage.ref.WJERCOR03 WHERE RINDFEC = 'actual');
WITH c   AS (SELECT DISTINCT WCODSEC FROM dbo.WREPPYG001 WHERE WCODREL = 3 AND WFECPRO = @ultimo),
     ase AS (SELECT DISTINCT CAST(RCODSEC AS varchar(20)) AS k FROM storage.ref.WJERCOR03 WHERE RFECPRO = @jer AND RINDFEC = 'actual'),
     uni AS (SELECT DISTINCT RCODUNI AS k FROM storage.ref.WJERCOR03 WHERE RFECPRO = @jer AND RINDFEC = 'actual')
SELECT  COUNT(*) AS codigos_nivel_3, COUNT(ase.k) AS como_asesor, COUNT(uni.k) AS como_unidad
FROM    c
        LEFT JOIN ase ON ase.k = CAST(c.WCODSEC AS varchar(20))
        LEFT JOIN uni ON uni.k = c.WCODSEC;

-- 1c. ¿La suma de los asesores da el total de FC? Por cuenta, para el último periodo. La diferencia es lo
--     que no está asignado a ningún asesor: con el SP nuevo, se ve en FC pero en ningún nodo de abajo.
WITH fc AS (SELECT WCODVAR, SUM(WVALACT) AS fc   FROM dbo.WREPPYG001 WHERE WCODREL = 1 AND WFECPRO = @ultimo GROUP BY WCODVAR),
     ase AS (SELECT WCODVAR, SUM(WVALACT) AS ase FROM dbo.WREPPYG001 WHERE WCODREL = 3 AND WFECPRO = @ultimo GROUP BY WCODVAR)
SELECT  r.pos, r.codigo, r.descripcion, fc.fc, ase.ase, fc.fc - ase.ase AS diferencia
FROM    dbo.REVARPYG r
        LEFT JOIN fc  ON fc.WCODVAR  = r.codigo
        LEFT JOIN ase ON ase.WCODVAR = r.codigo
ORDER BY r.pos;

-- 1d. Unidad de medida: el front titula "en miles (PEN)". Comparar con la imagen del pedido
--     (Ingresos financieros, Preliminar Jun.26 = 56,068). Si acá sale 56,068,000, la tabla está en soles.
SELECT  r.pos, r.codigo, r.descripcion, p.WVALACT
FROM    dbo.REVARPYG r
        LEFT JOIN dbo.WREPPYG001 p ON p.WCODVAR = r.codigo AND p.WCODREL = 1 AND p.WFECPRO = @ultimo
ORDER BY r.pos;

-- 1e. ¿Hay cuentas que no se pueden sumar (ratios, coeficientes)? El SP suma asesores: si REVARPYG tiene
--     filas de porcentaje o coeficiente, avisar antes de crear el SP.
SELECT pos, codigo, descripcion, style FROM dbo.REVARPYG ORDER BY pos;
GO

------------------------------------------------------------------------------------------------
-- PASO 2 (DESPUÉS de crear el nuevo): original y nuevo, lado a lado, en FC
------------------------------------------------------------------------------------------------
-- Cada EXEC devuelve 2 resultados: la cabecera (columna "dummy") y los datos.
-- Con el último periodo (junio 2026) y FC, los importes deben ser IGUALES. Diferencias esperadas en el nuevo:
--   · cabecera con los periodos reales de la tabla y la lista de "productos";
--   · variacion_acumulado_pct calculada (en el original es 0) — fracción: 0.1291 = 12.91 %;
--   · columnas trimestrales y total_anio omitidas: no están disponibles en WREPPYG001;
--   · filas ordenadas por "orden" y 2 columnas nuevas al final.
IF OBJECT_ID(N'rep.RTABCUERES01_NEW', N'P') IS NULL
BEGIN
    PRINT 'PASO 2 omitido: todavía no existe rep.RTABCUERES01_NEW (ejecutar 03-RTABCUERES01_NEW.create.sql).';
    RETURN;
END;

EXEC rep.RTABCUERES01     'NOW', 7, '1';
EXEC rep.RTABCUERES01_NEW 'NOW', 7, '1';
GO

------------------------------------------------------------------------------------------------
-- PASO 3: los filtros nuevos
------------------------------------------------------------------------------------------------
IF OBJECT_ID(N'rep.RTABCUERES01_NEW', N'P') IS NULL
BEGIN
    PRINT 'PASO 3 omitido: todavía no existe rep.RTABCUERES01_NEW.';
    RETURN;
END;

-- 3a. Periodo: otro mes de la lista de la cabecera (por ejemplo mayo). Debe cambiar las cifras y "preliminar":0.
EXEC rep.RTABCUERES01_NEW '20260501', 7, '1';

-- 3b. Jerarquía: códigos para probar (una unidad y un territorio con asesores).
DECLARE @jer date = (SELECT MAX(RFECPRO) FROM storage.ref.WJERCOR03 WHERE RINDFEC = 'actual');
SELECT TOP 5 RCODTER, RDESTER, RCODUNI, RDESUNI, COUNT(DISTINCT RCODSEC) AS asesores
FROM   storage.ref.WJERCOR03
WHERE  RFECPRO = @jer AND RINDFEC = 'actual'
GROUP BY RCODTER, RDESTER, RCODUNI, RDESUNI
ORDER BY asesores DESC;
-- Completar con uno de los códigos de arriba y descomentar:
-- EXEC rep.RTABCUERES01_NEW 'NOW', 18, '<RCODUNI>';
-- EXEC rep.RTABCUERES01_NEW 'NOW', 20, '<RCODTER>';

-- 3c. Asesor: la jerarquía entrega tip_cod=1 y códigos como 'ASESO272'.
--     Debe devolver las 70 filas/cuentas del WCODREL=3 si se usa el periodo verificado.
EXEC rep.RTABCUERES01_NEW 'NOW', 1, 'ASESO272';

-- 3d. Producto: un valor de la lista "productos" de la cabecera del paso 2.
-- EXEC rep.RTABCUERES01_NEW 'NOW', 7,  '1', '<producto>';
-- EXEC rep.RTABCUERES01_NEW 'NOW', 18, '<RCODUNI>', '<producto>';
GO
