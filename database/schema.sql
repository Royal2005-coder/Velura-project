-- Velura canonical schema contract.
--
-- The existing Supabase project is the source of truth. Active migrations extend
-- its singular BA tables; they must never create parallel plural tables.

do $$
declare
  required_table text;
begin
  foreach required_table in array array[
    'users',
    'style_profile',
    'guest_session',
    'category',
    'product',
    'variant',
    'combo_item',
    'orders',
    'order_item',
    'order_status_history',
    'payment',
    'promotion',
    'voucher',
    'promotion_product',
    'price_history',
    'cart',
    'review',
    'return_exchange',
    'return_item',
    'support_ticket',
    'ai_log',
    'audit_log',
    'approval_admin_request'
  ]
  loop
    if to_regclass(format('public.%I', required_table)) is null then
      raise exception 'Canonical Velura table public.% is missing', required_table;
    end if;
  end loop;
end $$;

-- Apply database/migrations in numeric order after this contract check.
