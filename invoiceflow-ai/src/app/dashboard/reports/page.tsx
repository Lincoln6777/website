"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FileBarChart,
  Users,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ReportType = "invoices" | "tax" | "clients" | null;

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<ReportType>(null);

  const downloadCSV = (filename: string, rows: string[][]) => {
    const header = rows[0].join(",");
    const body = rows.slice(1).map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
    const csv = [header, ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInvoiceReport = async () => {
    setDownloading("invoices");
    try {
      const [invRes, clientRes] = await Promise.all([
        fetch("/api/invoices").then((r) => r.json()),
        fetch("/api/clients").then((r) => r.json()),
      ]);
      const invoices = invRes.invoices ?? [];
      const clients = (clientRes.clients ?? []) as { id: string; name: string }[];
      const clientMap: Record<string, string> = {};
      clients.forEach((c) => (clientMap[c.id] = c.name));
      const rows: string[][] = [
        ["Invoice ID", "Client", "Amount", "Status", "Due Date", "Created"],
        ...invoices.map((inv: { id: string; client_id: string; amount: number; status: string; due_date: string; created_at?: string }) => [
          inv.id.slice(0, 8),
          clientMap[inv.client_id] ?? inv.client_id,
          String(inv.amount),
          inv.status,
          inv.due_date ?? "",
          inv.created_at ? new Date(inv.created_at).toISOString().slice(0, 10) : "",
        ]),
      ];
      downloadCSV(`invoiceflow-invoice-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } finally {
      setDownloading(null);
    }
  };

  const handleTaxSummary = async () => {
    setDownloading("tax");
    try {
      const [invRes, expRes] = await Promise.all([
        fetch("/api/invoices").then((r) => r.json()),
        fetch("/api/expenses/list").then((r) => r.json()),
      ]);
      const invoices = invRes.invoices ?? [];
      const expenses = expRes.expenses ?? [];
      const totalRevenue = invoices.reduce((s: number, i: { amount: number }) => s + Number(i.amount), 0);
      const totalExpenses = expenses.reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0);
      const rows: string[][] = [
        ["Summary", "Amount"],
        ["Total revenue (invoices)", String(totalRevenue.toFixed(2))],
        ["Total expenses", String(totalExpenses.toFixed(2))],
        ["Net", String((totalRevenue - totalExpenses).toFixed(2))],
        [],
        ["Expenses by category", ""],
        ...Object.entries(
          (expenses as { category: string; amount: number }[]).reduce<Record<string, number>>((acc, e) => {
            acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
            return acc;
          }, {})
        ).map(([cat, amt]) => [cat, String(amt.toFixed(2))]),
      ];
      downloadCSV(`invoiceflow-tax-summary-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } finally {
      setDownloading(null);
    }
  };

  const handleClientStatements = async () => {
    setDownloading("clients");
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      const clients = data.clients ?? [];
      const rows: string[][] = [
        ["Name", "Email", "Total Owed", "Created"],
        ...clients.map((c: { name: string; email: string; total_owed: number; created_at?: string }) => [
          c.name,
          c.email,
          String(Number(c.total_owed).toFixed(2)),
          c.created_at ? new Date(c.created_at).toISOString().slice(0, 10) : "",
        ]),
      ];
      downloadCSV(`invoiceflow-client-statements-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } finally {
      setDownloading(null);
    }
  };

  const actions = [
    {
      id: "invoices" as ReportType,
      icon: FileText,
      title: "Invoice report",
      description: "Export all invoices with client, amount, status, and due date.",
      onClick: handleInvoiceReport,
      color: "primary",
    },
    {
      id: "tax" as ReportType,
      icon: FileBarChart,
      title: "Tax summary",
      description: "Revenue vs expenses and breakdown by category for tax time.",
      onClick: handleTaxSummary,
      color: "accent",
    },
    {
      id: "clients" as ReportType,
      icon: Users,
      title: "Client statements",
      description: "Download client list with total owed for statements.",
      onClick: handleClientStatements,
      color: "secondary",
    },
  ];

  return (
    <div className="space-y-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-h2 font-bold text-secondary tracking-tight"
      >
        Reports
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="text-body text-secondary/70 max-w-xl"
      >
        Generate and download invoice reports, tax summaries, and client statements for your records.
      </motion.p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action, i) => (
          <motion.div
            key={String(action.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05 }}
            className={cn(
              "rounded-2xl overflow-hidden border transition-all duration-200",
              "shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)] bg-austin-offwhite/80 dark:bg-secondary/10",
              "border-white/60 dark:border-white/10",
              "hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5"
            )}
          >
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="pb-2">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl mb-3",
                    action.color === "primary" && "bg-primary/15 text-primary",
                    action.color === "accent" && "bg-accent/15 text-accent",
                    action.color === "secondary" && "bg-secondary/15 text-secondary"
                  )}
                >
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="text-h3 font-semibold text-secondary">{action.title}</h3>
                <p className="text-body text-secondary/70 leading-relaxed">
                  {action.description}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="gradient"
                  size="default"
                  className="w-full gap-2 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                  onClick={action.onClick}
                  disabled={downloading !== null}
                >
                  {downloading === action.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {downloading === action.id ? "Preparing…" : "Download CSV"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
