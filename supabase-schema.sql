-- Ejecuta esto en Supabase: Project > SQL Editor > New query > Run

create table vouchers (
  id uuid primary key default gen_random_uuid(),
  numero_voucher text,
  fecha_voucher date,
  huesped text,
  habitacion text,
  proveedor text,
  monto numeric,
  moneda text default 'COP',
  observaciones text,
  created_at timestamp with time zone default now()
);

-- Activa seguridad a nivel de fila
alter table vouchers enable row level security;

-- Política simple: cualquiera con la anon key puede leer y escribir.
-- Suficiente para un MVP interno de un solo hotel. Si más adelante
-- quieres login de usuarios, cambia esto por políticas basadas en auth.uid().
create policy "Permitir todo por ahora"
  on vouchers for all
  using (true)
  with check (true);
