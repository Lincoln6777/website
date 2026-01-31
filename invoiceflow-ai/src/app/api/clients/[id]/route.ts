import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await _request.json();
    const { name, email } = body as { name?: string; email?: string };
    const updates: { name?: string; email?: string } = {};
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim();
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select("id, name, email, total_owed, created_at")
      .single();
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
    }
    return NextResponse.json({ client: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
