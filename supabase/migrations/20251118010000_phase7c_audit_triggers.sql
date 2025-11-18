-- Phase7c: Audit triggers for core Phase1-5 tables (appointments, orders, customers, services, products).
-- Assumes strict audit_logs table/indexes and improved handle_audit() function created in Phase6.

-- Create triggers for key tables
DO $$
BEGIN
  -- Appointments
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_appointments_trigger' AND tgrelid = 'public.appointments'::regclass
  ) THEN
    CREATE TRIGGER audit_appointments_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.appointments
      FOR EACH ROW EXECUTE FUNCTION public.handle_audit();
  END IF;

  -- Orders
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_orders_trigger' AND tgrelid = 'public.orders'::regclass
  ) THEN
    CREATE TRIGGER audit_orders_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.orders
      FOR EACH ROW EXECUTE FUNCTION public.handle_audit();
  END IF;

  -- Customers
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_customers_trigger' AND tgrelid = 'public.customers'::regclass
  ) THEN
    CREATE TRIGGER audit_customers_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.customers
      FOR EACH ROW EXECUTE FUNCTION public.handle_audit();
  END IF;

  -- Services
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_services_trigger' AND tgrelid = 'public.services'::regclass
  ) THEN
    CREATE TRIGGER audit_services_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.services
      FOR EACH ROW EXECUTE FUNCTION public.handle_audit();
  END IF;

  -- Products
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_products_trigger' AND tgrelid = 'public.products'::regclass
  ) THEN
    CREATE TRIGGER audit_products_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.products
      FOR EACH ROW EXECUTE FUNCTION public.handle_audit();
  END IF;
END $$;