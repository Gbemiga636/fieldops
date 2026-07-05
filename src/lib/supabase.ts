import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );
}

function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      "[FieldOps] Missing Supabase config. Copy .env.local.example to .env.local and restart the dev server."
    );
    return createClient(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }

  return createClient(url, key);
}

export const supabase = createSupabaseClient();

export type LocationShare = {
  id: string;
  agent_name: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address: string | null;
  device: string | null;
  browser: string | null;
  status: string;
  shared_at: string;
  created_at: string;
};

export type AdminUser = {
  id: string;
  username: string;
  password_hash: string | null;
  password_set: boolean;
  remind_later: boolean;
};
