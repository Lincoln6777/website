"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Loader2, Send, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/supabase";
import type { Expense } from "@/lib/supabase";

type LineItem = { description: string; amount: number };

export default function NewInvoicePage() {
  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get("clientId") ?? "";
  const [clients, setClients] = useState<Client[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(clientIdFromUrl);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [lineItems] = useState<LineItem[]>([]);
  const [sending, setSending] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(data.clients ?? []))
      .catch(() => setClients([]));
    fetch("/api/expenses/list")
      .then((r) => r.json())
      .then((data) => setExpenses(data.expenses ?? []))
      .catch(() => setExpenses([]));
  }, []);

  useEffect(() => {
    if (clientIdFromUrl && clients.some((c) => c.id === clientIdFromUrl)) {
      setSelectedClientId(clientIdFromUrl);
    }
  }, [clientIdFromUrl, clients]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedExpensesList = expenses.filter((e) =>
    selectedExpenseIds.includes(e.id)
  );
  const totalAmount =
    lineItems.length > 0
      ? lineItems.reduce((s, i) => s + i.amount, 0)
      : selectedExpensesList.reduce((s, e) => s + e.amount, 0);

  const toggleExpense = (id: string) => {
    setSelectedExpenseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const generatePDF = async (): Promise<Blob> => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(15, 76, 92);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(248, 249, 250);
    doc.setFontSize(22);
    doc.text("InvoiceFlow AI", 20, 18);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text("Austin's #1 Invoicing Tool", 20, 36);
    doc.setDrawColor(244, 162, 97);
    doc.setLineWidth(2);
    doc.line(20, 42, pageW - 20, 42);
    let y = 55;
    if (selectedClient) {
      doc.setFontSize(12);
      doc.text(`Bill To: ${selectedClient.name}`, 20, y);
      y += 6;
      doc.text(selectedClient.email, 20, y);
      y += 12;
    }
    doc.setFontSize(10);
    const items = lineItems.length
      ? lineItems
      : selectedExpensesList.map((e) => ({
          description: `${e.merchant} (${e.category})`,
          amount: e.amount,
        }));
    doc.text("Description", 20, y);
    doc.text("Amount", pageW - 50, y);
    y += 8;
    items.forEach((item) => {
      doc.text(item.description.slice(0, 50), 20, y);
      doc.text(`$${item.amount.toFixed(2)}`, pageW - 50, y);
      y += 7;
    });
    y += 5;
    doc.setFontSize(11);
    doc.text("Total", 20, y);
    doc.text(`$${totalAmount.toFixed(2)}`, pageW - 50, y);
    if (paymentLink) {
      const qrDataUrl = await QRCode.toDataURL(paymentLink, { width: 60 });
      doc.addImage(qrDataUrl, "PNG", pageW - 75, y - 50, 50, 50);
      doc.setFontSize(8);
      doc.text("Scan to pay", pageW - 70, y + 8);
    }
    return doc.output("blob");
  };

  const handleSendInvoice = async () => {
    if (!selectedClientId || totalAmount <= 0) return;
    setSending(true);
    setSendError(null);
    setEmailSent(null);
    setEmailError(null);
    try {
      const pdfBlob = await generatePDF();
      const formData = new FormData();
      formData.append("clientId", selectedClientId);
      formData.append("amount", String(totalAmount));
      formData.append("expenseIds", JSON.stringify(selectedExpenseIds));
      formData.append("pdf", pdfBlob, "invoice.pdf");
      const res = await fetch("/api/invoices/send", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setSendError(data.error ?? "Failed to send invoice. Please try again.");
        setPaymentLink("");
        return;
      }

      if (data.paymentUrl) setPaymentLink(data.paymentUrl);
      setEmailSent(data.emailSent === true);
      setEmailError(data.emailError ?? null);

      if (data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = "invoice.pdf";
        a.click();
      }

      statusRef.current?.focus();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  const copyPaymentLink = () => {
    if (!paymentLink) return;
    navigator.clipboard.writeText(paymentLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-h2 font-semibold"
      >
        New Invoice
      </motion.h1>

      <div className="grid lg:grid-cols-2 gap-gutter">
        {/* Editor */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <h3 className="text-h3 font-semibold">Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Client</Label>
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} – {c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expenses (multi-select)</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {expenses.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => toggleExpense(e.id)}
                      className={cn(
                        "rounded-austin border px-3 py-1.5 text-body transition-colors",
                        selectedExpenseIds.includes(e.id)
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-secondary/20 hover:border-primary/50"
                      )}
                    >
                      {e.merchant} ${e.amount.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Total</Label>
                <p className="text-body-lg font-semibold text-primary mt-1">
                  ${totalAmount.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Live PDF preview */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-secondary/5">
              <h3 className="text-h3 font-semibold">Preview</h3>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-[210/297] max-h-[400px] bg-white rounded-b-austin flex flex-col items-center justify-center text-secondary/60 border-t border-secondary/10">
                <div className="w-full flex-1 flex flex-col items-center justify-center p-6">
                  <div className="border-2 border-primary/30 rounded-austin p-4 w-full max-w-xs">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {selectedClient?.name?.charAt(0) ?? "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-secondary">
                          {selectedClient?.name ?? "Select client"}
                        </p>
                        <p className="text-body text-secondary/70">
                          {selectedClient?.email ?? ""}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-secondary/10 pt-3 space-y-2">
                      {(lineItems.length
                        ? lineItems
                        : selectedExpensesList.map((e) => ({
                            description: e.merchant,
                            amount: e.amount,
                          }))
                      ).map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-body"
                        >
                          <span>{item.description}</span>
                          <span>${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-semibold text-primary mt-3 pt-2 border-t border-primary/20">
                      <span>Total</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-body mt-2">Austin-branded header • QR payment link</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="gradient"
            size="lg"
            className="w-full mt-4 gap-2"
            onClick={handleSendInvoice}
            disabled={sending || !selectedClientId || totalAmount <= 0}
            aria-busy={sending}
            aria-describedby={sendError ? "send-invoice-error" : undefined}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <Send className="h-5 w-5" aria-hidden />
            )}
            {sending ? "Sending…" : "Send Invoice"}
          </Button>

          {/* Error message - accessible */}
          {sendError && (
            <div
              id="send-invoice-error"
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-body text-red-800 dark:text-red-200"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
              <p>{sendError}</p>
            </div>
          )}

          {/* Success: payment link + email status - accessible */}
          {paymentLink && (
            <div
              ref={statusRef}
              role="status"
              aria-live="polite"
              tabIndex={-1}
              className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 dark:bg-secondary/10 p-4 space-y-3"
            >
              <p className="font-semibold text-secondary">Invoice sent</p>
              {emailSent === true && (
                <p className="text-body text-accent font-medium">
                  Email delivered to {selectedClient?.email}.
                </p>
              )}
              {emailError && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3 text-body text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                  <p>{emailError}</p>
                </div>
              )}
              <p className="text-body text-secondary/80">
                Share this payment link with your client:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={paymentLink}
                  className="flex-1 rounded-xl border border-secondary/20 bg-white dark:bg-secondary/20 px-3 py-2 text-body font-mono text-secondary truncate"
                  aria-label="Payment link URL"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="gap-2 rounded-xl shrink-0"
                  onClick={copyPaymentLink}
                  aria-label={copied ? "Copied" : "Copy payment link"}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-accent" aria-hidden />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
