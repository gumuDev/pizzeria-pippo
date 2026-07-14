-- Bug: docs/database (ver bugs/open/05-stock-mitad-mitad-receta-incompleta.md en el vault)
-- Descuento incorrecto de insumos compartidos (cajas) en pizzas mitad y mitad
-- cuando solo uno de los dos sabores tiene la receta cargada.
--
-- is_shared_use = true  -> el insumo se descuenta UNA vez completo por pedido
--                          (ej. cajas), sin importar cuántos sabores tenga la pizza.
-- is_shared_use = false -> comportamiento actual, se reparte proporcional por sabor
--                          (ej. masa, queso, toppings). Default false para no romper nada.

ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS is_shared_use BOOLEAN NOT NULL DEFAULT false;

UPDATE public.ingredients
  SET is_shared_use = true
  WHERE name ILIKE 'Caja%';
