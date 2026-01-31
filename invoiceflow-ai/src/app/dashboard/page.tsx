"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExpenseUploadZone } from "@/components/expense-upload-zone";
import { cn } from "@/lib/utils";

type Invoice = {
  id: string;
  client_id: string;
  amount: number;
  status: string;
  due_date: string;
  created_at?: string;
};

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]).then(([invRes, clientRes]) => {
      setInvoices((invRes.invoices ?? []).slice(0, 8));
      const map: Record<string, string> = {};
      (clientRes.clients ?? []).forEach((c: { id: string; name: string }) => {
        map[c.id] = c.name;
      });
      setClientNames(map);
    }).catch(() => {
      setInvoices([]);
      setClientNames({});
    }).finally(() => setLoading(false));
  }, []);

  const statusVariant = (s: string) => {
    if (s === "paid") return "paid";
    if (s === "sent" || s === "draft") return "pending";
    if (s === "overdue") return "overdue";
    return "secondary";
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ExpenseUploadZone />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className={cn(
          "rounded-2xl overflow-hidden",
          "shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)] bg-austin-offwhite/80 dark:bg-secondary/10",
          "border border-white/60 dark:border-white/10"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-secondary/10 bg-white/50 dark:bg-secondary/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-h3 font-semibold text-secondary">Recent Invoices</h3>
          </div>
          <Link href="/dashboard/invoices/new">
            <Button
              variant="gradient"
              size="default"
              className="gap-2 rounded-xl shadow-md hover:shadow-lg transition-all font-semibold hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-b-2xl">
            {loading ? (
              <div className="p-12 text-center text-secondary/60 text-body">
                Loading invoices…
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary/50 mb-4">
                  <Inbox className="h-7 w-7" />
                </div>
                <p className="text-body text-secondary/70 mb-4">No invoices yet.</p>
                <Link href="/dashboard/invoices/new">
                  <Button variant="gradient" className="gap-2 rounded-xl font-semibold">
                    <Plus className="h-4 w-4" />
                    Create your first invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/5 border-b border-secondary/10">
                    <th className="text-left p-4 text-body font-semibold text-secondary/80">Invoice</th>
                    <th className="text-left p-4 text-body font-semibold text-secondary/80">Client</th>
                    <th className="text-left p-4 text-body font-semibold text-secondary/80">Amount</th>
                    <th className="text-left p-4 text-body font-semibold text-secondary/80">Status</th>
                    <th className="text-left p-4 text-body font-semibold text-secondary/80">Due date</th>
                    <th className="text-left p-4 text-body font-semibold text-secondary/80 w-20" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {invoices.map((inv, i) => (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className={cn(
                          "border-b border-secondary/5 transition-colors duration-200",
                          "hover:bg-primary/5 hover:shadow-[inset_0_1px_0_0_rgba(244,162,97,0.15)]"
                        )}
                        whileHover={{ y: -1 }}
                      >
                        <td className="p-4 text-body font-medium text-secondary tabular-nums">
                          #{inv.id.slice(0, 8)}
                        </td>
                        <td className="p-4 text-body text-secondary/90">
                          {clientNames[inv.client_id] ?? "—"}
                        </td>
                        <td className="p-4 text-body font-semibold text-primary tabular-nums">
                          ${Number(inv.amount).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <Badge variant={statusVariant(inv.status)} className="font-medium capitalize">
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-body text-secondary/70">
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-4">
                          <Link href={`/dashboard/invoices/new?clientId=${inv.client_id}`}>
                            <Button variant="ghost" size="sm" className="rounded-lg text-primary hover:bg-primary/10">
                              View
                            </Button>
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </motion.div>
    </div>
  );
}
