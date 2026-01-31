import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, total_owed, created_at")
    .order("name");
  if (error) {
    console.error(error);
    return NextResponse.json({ clients: [] }, { status: 200 });
  }
  return NextResponse.json({ clients: data ?? [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body as { name?: string; email?: string };
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }
    const { data, error } = await supabase
      .from("clients")
      .insert({ name: name.trim(), email: email.trim(), total_owed: 0 })
      .select("id, name, email, total_owed, created_at")
      .single();
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }
    return NextResponse.json({ client: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
