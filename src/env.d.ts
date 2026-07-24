/// <reference types="astro/client" />

type SupabaseClient = import('@supabase/supabase-js').SupabaseClient;
type User = import('@supabase/supabase-js').User;

declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    user: User | null;
    isAdmin: boolean;
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
}