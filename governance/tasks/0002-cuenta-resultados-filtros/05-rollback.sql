-- MOD-0002 · Rollback
-- 1. Volver a apuntar TAB_CUE_RES_01 al original en el catálogo del backend (deshace 06-activacion.sql).
-- 2. Recién entonces, borrar el SP nuevo. El original nunca se tocó.
-- ESCRIBE en la base: lo ejecuta quien tenga permiso.

USE mod_rep;
GO

BEGIN TRANSACTION;
UPDATE rep.RREGREP01
SET    RTPREP = REPLACE(RTPREP, '"mod_rep.rep.RTABCUERES01_NEW"', '"mod_rep.rep.RTABCUERES01"')
WHERE  RCODREP = 'TAB_CUE_RES_01'
  AND  CHARINDEX('"mod_rep.rep.RTABCUERES01_NEW"', RTPREP) > 0;
SELECT RCODREP, RTPREP FROM rep.RREGREP01 WHERE RCODREP = 'TAB_CUE_RES_01';
-- Revisar que apunte a mod_rep.rep.RTABCUERES01 y elegir:
-- COMMIT TRANSACTION;   o   ROLLBACK TRANSACTION;
GO

-- Solo después del COMMIT anterior (si no, el reporte apuntaría a un SP que ya no existe):
-- DROP PROCEDURE IF EXISTS [rep].[RTABCUERES01_NEW];
