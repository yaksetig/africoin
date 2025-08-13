-- Enable required extension
create extension if not exists pgcrypto;

-- Timestamp update function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Contracts table to store saved contracts per wallet
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  owner_address text not null,
  label text,
  contract_address text not null,
  abi jsonb not null,
  network text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_address, contract_address)
);

alter table public.contracts enable row level security;

create trigger update_contracts_updated_at
before update on public.contracts
for each row execute function public.update_updated_at_column();

create index if not exists idx_contracts_owner_address on public.contracts(owner_address);

-- Nonces table for one-time message challenges
create table if not exists public.wallet_nonces (
  nonce text primary key,
  wallet_address text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

alter table public.wallet_nonces enable row level security;

create index if not exists idx_wallet_nonces_address on public.wallet_nonces(wallet_address);
