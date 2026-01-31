import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, merchant, amount, category, date, receipt_url")
    .order("date", { ascending: false });
  if (error) {
    console.error(error);
    return NextResponse.json({ expenses: [] }, { status: 200 });
  }
  return NextResponse.json({ expenses: data ?? [] });
}
