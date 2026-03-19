-- Allow negative stock in branch_stock to reflect ingredient debt when selling with zero stock
-- The previous check constraint prevented quantities below 0, blocking sales when stock was depleted.
-- Replacing it with a lower bound of -99999 allows the system to record deficits for admin visibility.

ALTER TABLE public.branch_stock DROP CONSTRAINT IF EXISTS branch_stock_quantity_check;

ALTER TABLE public.branch_stock
  ADD CONSTRAINT branch_stock_quantity_check CHECK (quantity >= -99999);
