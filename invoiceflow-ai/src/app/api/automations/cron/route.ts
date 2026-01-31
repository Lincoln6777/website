import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import Stripe from "stripe";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: overdueInvoices, error } = await supabase
      .from("invoices")
      .select("id, client_id, amount, due_date")
      .eq("status", "sent")
      .lt("due_date", sevenDaysAgo.toISOString().slice(0, 10));

    if (error) {
      console.error("Cron: Supabase error", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const sent: string[] = [];

    for (const inv of overdueInvoices ?? []) {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Overdue invoice reminder",
                description: `Invoice #${inv.id.slice(0, 8)} – $${Number(inv.amount).toFixed(2)}`,
              },
              unit_amount: Math.round(Number(inv.amount) * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/dashboard?paid=1`,
        cancel_url: `${baseUrl}/dashboard`,
        metadata: { invoice_id: inv.id },
      });

      const { data: client } = await supabase
        .from("clients")
        .select("name, email")
        .eq("id", inv.client_id)
        .single();

      if (client?.email && process.env.RESEND_API_KEY) {
        const resend = getResend();
        await resend.emails.send({
          from: process.env.RESEND_FROM ?? "InvoiceFlow AI <onboarding@resend.dev>",
          to: client.email,
          subject: `Reminder: Overdue invoice – $${Number(inv.amount).toFixed(2)}`,
          html: `
            <p>Hi ${client.name},</p>
            <p>This is a friendly reminder that your invoice (due ${inv.due_date}) is overdue.</p>
            <p><a href="${session.url}" style="color:#f4a261;font-weight:bold;">Pay now</a></p>
            <p>— InvoiceFlow AI</p>
          `,
        });
        sent.push(inv.id);
      }

      await supabase
        .from("invoices")
        .update({ status: "overdue" })
        .eq("id", inv.id);
    }

    return NextResponse.json({
      ok: true,
      overdueCount: overdueInvoices?.length ?? 0,
      remindersSent: sent.length,
    });
  } catch (e) {
    console.error("Cron error", e);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
