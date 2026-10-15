-- MOD-0002 · Cuenta de Resultados (TAB_CUE_RES_01) con periodo, jerarquía y producto
-- Crea mod_rep.rep.RTABCUERES01_NEW. NO modifica el SP original: el reporte sigue usando el original hasta que
-- se lo apunte al nuevo (06-activacion.sql).
-- Base: cuerpo extraído el 2026-10-13 (modificado en la base: 2026-09-23 17:44:12).
-- Análisis: 02-analisis.md · Pruebas antes de usarlo: 04-verificacion.sql
--
-- Qué cambia respecto del original (que tiene todo fijo: junio 2026, nivel FC y periodos escritos a mano):
--   1. @fecha: 'NOW' o un mes sin datos = último periodo cargado; si no, el mes pedido (YYYYMMDD, cualquier día).
--   2. Cabecera: periodos y "preliminar" salen de la tabla; agrega "productos" (el front actual lo ignora).
--   3. @tip_cod/@cod_rel: FC con el nivel 1; cualquier otro nodo de la jerarquía suma sus asesores (nivel 3).
--   4. @producto (nuevo, opcional, 'TODOS' por defecto): nivel 4 en FC y nivel 5 por debajo.
--   5. variacion_acumulado_pct calculada (antes 0), como fracción: el front la multiplica por 100.
--   6. Columnas nuevas, que el front actual no usa: variación contra el mismo mes del año anterior y su %.
--   7. Se omiten columnas trimestrales: la tabla disponible no contiene esos valores.
--   8. Filas ordenadas por REVARPYG.pos (el original no ordenaba).
-- Supuestos que verifica el paso 1 de 04-verificacion.sql antes de crear el SP: ver 02-analisis.md, sección 4.

USE mod_rep;
GO
--EXEC [mod_rep].[rep].[RTABCUERES01_NEW] 'NOW', 7, '1'
--EXEC [mod_rep].[rep].[RTABCUERES01_NEW] '20260501', 7, '1'
--EXEC [mod_rep].[rep].[RTABCUERES01_NEW] 'NOW', 18, '<cod_unidad>'
--EXEC [mod_rep].[rep].[RTABCUERES01_NEW] 'NOW', 7, '1', '<producto>'
CREATE PROCEDURE rep.RTABCUERES01_NEW
    @fecha    varchar(8)   = 'NOW',
    @tip_cod  int,
    @cod_rel  varchar(20),
    @producto varchar(100) = 'TODOS'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ultimo date, @pedida date, @fec date, @nivel int, @jer date,
            @fechas nvarchar(max), @productos nvarchar(max);

    ------------------------------------------------------------------------------------------------
    -- 1. Periodo. WFECPRO es el cierre de mes; el front manda el primer día del mes (YYYYMMDD) o 'NOW'.
    --    Si el mes pedido no tiene datos se usa el último cargado, igual que hace el front con 'NOW'.
    ------------------------------------------------------------------------------------------------
    SELECT @ultimo = MAX(WFECPRO) FROM mod_rep.dbo.WREPPYG001 WHERE WCODREL = 1;

    SET @pedida = IIF(@fecha = 'NOW', NULL, TRY_CONVERT(date, @fecha, 112));

    SELECT @fec = MAX(WFECPRO)
    FROM   mod_rep.dbo.WREPPYG001
    WHERE  WCODREL = 1
      AND  @pedida IS NOT NULL
      AND  WFECPRO >= DATEFROMPARTS(YEAR(@pedida), MONTH(@pedida), 1)
      AND  WFECPRO <= EOMONTH(@pedida);

    SET @fec = ISNULL(@fec, @ultimo);

    ------------------------------------------------------------------------------------------------
    -- 2. Nivel de WREPPYG001 según el nodo y el producto
    --    WCODREL: 1 FC · 3 asesor · 4 producto · 5 asesor y producto
    ------------------------------------------------------------------------------------------------
    SET @producto = NULLIF(LTRIM(RTRIM(@producto)), '');
    IF @producto IS NULL OR UPPER(@producto) = 'TODOS' SET @producto = 'TODOS';

    SET @nivel = CASE WHEN @tip_cod = 7 THEN IIF(@producto = 'TODOS', 1, 4)
                      ELSE                   IIF(@producto = 'TODOS', 3, 5) END;

    ------------------------------------------------------------------------------------------------
    -- 3. Filas del periodo con su producto (mismos JOIN que usa el MIS para RDESPROD)
    --    Se trae también el nivel 4 para armar la lista de productos de la cabecera.
    ------------------------------------------------------------------------------------------------
    DROP TABLE IF EXISTS #pyg;

    SELECT  P.WCODREL, P.WCODSEC, P.WCODVAR,
            P.WVALACT, P.WVALANT, P.WVALAA, P.WACUMACT, P.WACUMAA,
            ISNULL(P3.RDESPROD, 'SIN ASIGNAR') AS RDESPROD
    INTO    #pyg
    FROM    mod_rep.dbo.WREPPYG001 P
            LEFT JOIN storage.com_act.RETP002 P2 ON P.WCODMOD = P2.RCODMOD AND P.WTIPOPE = P2.RTIPOPE AND P.WSUBTIP = P2.RSUBTIP
            LEFT JOIN storage.com_act.RETP001 P1 ON P.WCODMOD = P1.RCODMOD AND P.WTIPOPE = P1.RTIPOPE
            LEFT JOIN storage.com_act.RETP003 P3 ON ISNULL(P2.RCODPROD, P1.RCODPROD) = P3.RCODPROD
    WHERE   P.WFECPRO = @fec
      AND   P.WCODREL IN (@nivel, 4);

    ------------------------------------------------------------------------------------------------
    -- 4. Cabecera: { preliminar, fechas, productos }
    --    preliminar = 1 cuando el periodo mostrado es el último cargado (supuesto: el mes abierto).
    ------------------------------------------------------------------------------------------------
    SELECT @fechas = STRING_AGG(CAST(CONCAT('"', CONVERT(char(10), DATEFROMPARTS(YEAR(WFECPRO), MONTH(WFECPRO), 1), 23), '"') AS nvarchar(max)), ',')
                     WITHIN GROUP (ORDER BY WFECPRO DESC)
    FROM   (SELECT DISTINCT WFECPRO FROM mod_rep.dbo.WREPPYG001 WHERE WCODREL = 1) F;

    SELECT @productos = STRING_AGG(CAST(CONCAT('"', STRING_ESCAPE(RDESPROD, 'json'), '"') AS nvarchar(max)), ',')
                        WITHIN GROUP (ORDER BY RDESPROD)
    FROM   (SELECT DISTINCT RDESPROD FROM #pyg WHERE WCODREL = 4) X;

    SELECT CONCAT('{"preliminar":', IIF(@fec = @ultimo, 1, 0),
                  ',"fechas":[', @fechas, ']',
                  ',"productos":[', ISNULL(@productos, ''), ']}') AS dummy;

    ------------------------------------------------------------------------------------------------
    -- 5. Asesores del nodo elegido (jerarquía vigente, como el selector del front)
    --    La tabla disponible expone WCODSEC; el paso 1b de verificación valida su correspondencia con RCODSEC.
    ------------------------------------------------------------------------------------------------
    DROP TABLE IF EXISTS #asesores;
    CREATE TABLE #asesores (RCODSEC varchar(20) PRIMARY KEY);

    IF @tip_cod <> 7
    BEGIN
        SELECT @jer = MAX(RFECPRO) FROM storage.ref.WJERCOR03 WHERE RINDFEC = 'actual';

        INSERT INTO #asesores (RCODSEC)
        SELECT DISTINCT CAST(RCODSEC AS varchar(20))
        FROM   storage.ref.WJERCOR03
        WHERE  RFECPRO = @jer
          AND  RINDFEC = 'actual'
          AND  RCODSEC IS NOT NULL
          AND  CASE WHEN @tip_cod = 20 THEN CAST(RCODTER AS varchar(20))   -- territorio
                    WHEN @tip_cod = 19 THEN CAST(RCODCOR AS varchar(20))   -- corredor
                    WHEN @tip_cod = 21 THEN CAST(RCODGRU AS varchar(20))   -- grupo
                    WHEN @tip_cod = 18 THEN CAST(RCODUNI AS varchar(20))   -- unidad de negocio
                    WHEN @tip_cod = 17 THEN CAST(RCODUCO AS varchar(20))   -- coordinador
                    WHEN @tip_cod IN (1, 2) THEN CAST(RCODSEC AS varchar(20)) -- asesor
               END = @cod_rel;
    END;

    ------------------------------------------------------------------------------------------------
    -- 6. Valores por cuenta: el nodo es la suma de sus asesores (o la fila de FC)
    ------------------------------------------------------------------------------------------------
    DROP TABLE IF EXISTS #val;

    SELECT  P.WCODVAR,
            SUM(P.WVALACT)  AS WVALACT,
            SUM(P.WVALANT)  AS WVALANT,
            SUM(P.WVALAA)   AS WVALAA,
            SUM(P.WACUMACT) AS WACUMACT,
            SUM(P.WACUMAA)  AS WACUMAA
    INTO    #val
    FROM    #pyg P
    WHERE   P.WCODREL = @nivel
      AND   (@producto = 'TODOS' OR P.RDESPROD = @producto)
      AND   (@tip_cod = 7 OR EXISTS (SELECT 1 FROM #asesores A WHERE A.RCODSEC = CAST(P.WCODSEC AS varchar(20))))
    GROUP BY P.WCODVAR;

    ------------------------------------------------------------------------------------------------
    -- 7. Resultado: columnas del reporte sin los trimestres no disponibles + 2 nuevas al final
    ------------------------------------------------------------------------------------------------
    SELECT  A.style,
            A.codigo                                                   AS cuenta_codigo,
            A.descripcion                                              AS cuenta_nombre,
            A.pos                                                      AS orden,
            B.WVALAA                                                   AS periodo_anio_anterior,
            B.WVALANT                                                  AS periodo_anterior,
            B.WVALACT                                                  AS periodo_actual,
            B.WVALACT - B.WVALANT                                      AS variacion_periodo_anterior,
            B.WACUMAA                                                  AS acumulado_anio_anterior,
            B.WACUMACT                                                 AS acumulado_actual,
            B.WACUMACT - B.WACUMAA                                     AS variacion_acumulado,
            CAST((B.WACUMACT - B.WACUMAA) / NULLIF(B.WACUMAA, 0) AS float) AS variacion_acumulado_pct,
            B.WVALACT - B.WVALAA                                       AS variacion_periodo_anio_anterior,
            CAST((B.WVALACT - B.WVALAA) / NULLIF(B.WVALAA, 0) AS float) AS variacion_periodo_anio_anterior_pct
    FROM    mod_rep.dbo.REVARPYG A
            LEFT JOIN #val B ON A.codigo = B.WCODVAR
    ORDER BY A.pos;
END
GO
