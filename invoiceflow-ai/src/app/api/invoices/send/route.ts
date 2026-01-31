import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";
import { Resend } from "resend";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const clientId = formData.get("clientId") as string;
    const amount = formData.get("amount") as string;
    const pdf = formData.get("pdf") as File | null;

    if (!clientId || !amount) {
      return NextResponse.json(
        { error: "Missing clientId or amount" },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id, name, email")
      .eq("id", clientId)
      .single();

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice - ${client.name}`,
              description: "InvoiceFlow AI invoice",
            },
            unit_amount: Math.round(amountNum * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/dashboard?paid=1`,
      cancel_url: `${baseUrl}/dashboard/invoices/new`,
      metadata: { client_id: clientId },
    });

    const paymentUrl = session.url ?? "";

    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .insert({
        client_id: clientId,
        amount: amountNum,
        status: "sent",
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        pdf_url: null,
      })
      .select("id")
      .single();

    if (invError) {
      console.error("Supabase invoice insert:", invError);
    }

    let downloadUrl: string | null = null;
    if (pdf && pdf.size > 0 && invoice?.id) {
      const buf = Buffer.from(await pdf.arrayBuffer());
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("invoices")
        .upload(`${invoice.id}.pdf`, buf, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("invoices")
          .getPublicUrl(uploadData.path);
        downloadUrl = urlData.publicUrl;
        await supabase
          .from("invoices")
          .update({ pdf_url: downloadUrl })
          .eq("id", invoice.id);
      }
    }

    let emailSent = false;
    let emailError: string | null = null;

    if (client.email) {
      const resend = getResend();
      if (!resend) {
        emailError = "Email not configured. Add RESEND_API_KEY to your environment. You can still share the payment link below.";
      } else {
        const pdfBase64 =
          pdf && pdf.size > 0
            ? Buffer.from(await pdf.arrayBuffer()).toString("base64")
            : null;
        const fromAddress =
          process.env.RESEND_FROM ?? "InvoiceFlow AI <onboarding@resend.dev>";
        const { data: emailData, error: emailErr } = await resend.emails.send({
          from: fromAddress,
          to: [client.email],
          subject: `Invoice from InvoiceFlow AI – $${amountNum.toFixed(2)}`,
          html: `
          <p>Hi ${client.name},</p>
          <p>You have an invoice for <strong>$${amountNum.toFixed(2)}</strong>.</p>
          <p><a href="${paymentUrl}" style="color:#f4a261;font-weight:bold;">Pay now</a></p>
          <p>— InvoiceFlow AI (Austin's #1 Invoicing Tool)</p>
        `,
          attachments: pdfBase64
            ? [{ filename: "invoice.pdf", content: pdfBase64 }]
            : undefined,
        });
        if (emailErr) {
          emailError =
            typeof emailErr.message === "string"
              ? emailErr.message
              : "Email could not be sent. Share the payment link below with your client.";
          console.error("Resend error:", emailErr);
        } else if (emailData?.id) {
          emailSent = true;
        }
      }
    } else {
      emailError = "Client has no email address. Share the payment link below.";
    }

    return NextResponse.json({
      paymentUrl,
      downloadUrl,
      invoiceId: invoice?.id,
      emailSent,
      emailError,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to send invoice" },
      { status: 500 }
    );
  }
}
