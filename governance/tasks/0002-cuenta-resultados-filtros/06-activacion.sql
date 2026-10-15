-- MOD-0002 · Activación: que la pantalla Cuenta de Resultados use rep.RTABCUERES01_NEW
--
-- El front (MIS-angular-front › Actividad mensual › Rentabilidad › Cuenta de Resultados) ya manda fecha,
-- tip_cod y cod_rel: con este cambio el periodo y la jerarquía empiezan a filtrar sin tocar el front.
-- El parámetro nuevo @producto tiene valor por defecto ('TODOS'), así que los parámetros del catálogo no cambian.
-- Para que el front filtre por producto hay que agregar "producto" a RTPREP.params y el selector en el front:
-- ver 02-analisis.md, sección 5.
--
-- Antes de ejecutarlo: los pasos 1 a 3 de 04-verificacion.sql deben estar bien.
-- ESCRIBE en la base: lo ejecuta quien tenga permiso sobre el catálogo. Deja la transacción abierta.
-- Volver atrás después del COMMIT: 05-rollback.sql.

USE mod_rep;
GO

IF OBJECT_ID(N'rep.RTABCUERES01_NEW', N'P') IS NULL
BEGIN
    RAISERROR('No existe rep.RTABCUERES01_NEW: ejecutar antes 03-RTABCUERES01_NEW.create.sql.', 16, 1);
    SET NOEXEC ON;  -- no ejecuta nada más de este script
END;
GO

-- Antes: debe apuntar a mod_rep.rep.RTABCUERES01.
SELECT RCODREP, RTPREP FROM rep.RREGREP01 WHERE RCODREP = 'TAB_CUE_RES_01';

BEGIN TRANSACTION;

-- Solo cambia el nombre del SP dentro de RTPREP: los parámetros y el resto del texto quedan como están.
UPDATE rep.RREGREP01
SET    RTPREP = REPLACE(RTPREP, '"mod_rep.rep.RTABCUERES01"', '"mod_rep.rep.RTABCUERES01_NEW"')
WHERE  RCODREP = 'TAB_CUE_RES_01'
  AND  CHARINDEX('"mod_rep.rep.RTABCUERES01"', RTPREP) > 0;   -- solo si sigue apuntando al original

-- Debe decir 1. Si dice 0, alguien ya lo cambió: revisar el SELECT de "Antes".
SELECT @@ROWCOUNT AS filas_actualizadas;

-- Después: debe apuntar a mod_rep.rep.RTABCUERES01_NEW.
SELECT RCODREP, RTPREP FROM rep.RREGREP01 WHERE RCODREP = 'TAB_CUE_RES_01';

-- Si está bien:   COMMIT TRANSACTION;
-- Si no:          ROLLBACK TRANSACTION;
--
-- Luego: abrir en el front Actividad mensual › Rentabilidad › Cuenta de Resultados, cambiar el periodo y el
-- nivel de la jerarquía y comprobar que las cifras cambian. Si el backend guarda el catálogo en memoria,
-- puede hacer falta reiniciarlo para que tome el cambio.
GO
SET NOEXEC OFF;
GO
