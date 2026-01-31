import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, client_id, amount, status, due_date, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) {
    console.error(error);
    return NextResponse.json({ invoices: [] }, { status: 200 });
  }
  return NextResponse.json({ invoices: data ?? [] });
}
