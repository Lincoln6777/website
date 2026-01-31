import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Invoice = {
  id: string;
  client_id: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  due_date: string;
  pdf_url: string | null;
  created_at?: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  total_owed: number;
  created_at?: string;
};

export type Expense = {
  id: string;
  invoice_id: string | null;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  receipt_url: string | null;
  user_id?: string;
  created_at?: string;
};

export type User = {
  id: string;
  email: string;
  stripe_id: string | null;
  created_at?: string;
};
