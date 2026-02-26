-- Intercambiar valores: ciudad pasa a contener lo que estaba en canton (provincia/estado)
-- y canton pasa a contener lo que estaba en ciudad (ciudad/localidad).
UPDATE cliente
SET ciudad = canton, canton = ciudad;
