import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const merchant = formData.get("merchant") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const category = formData.get("category") as string;
    const date = formData.get("date") as string;

    if (!merchant || isNaN(amount) || !category || !date) {
      return NextResponse.json(
        { error: "Missing merchant, amount, category, or date" },
        { status: 400 }
      );
    }

    let receipt_url: string | null = null;
    if (file && file.size > 0) {
      const buf = Buffer.from(await file.arrayBuffer());
      const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(name, buf, { contentType: file.type, upsert: false });
      if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload receipt" },
          { status: 500 }
        );
      }
      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(uploadData.path);
      receipt_url = urlData.publicUrl;
    }

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        merchant,
        amount,
        category,
        date,
        receipt_url,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save expense" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: expense.id, receipt_url });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
