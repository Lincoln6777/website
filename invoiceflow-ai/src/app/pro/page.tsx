"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  "Unlimited invoices",
  "Auto-reminders for overdue",
  "Austin Pro support",
  "PDF + Stripe + Resend",
];

export default function ProPage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-content mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4">
            Austin Pro
          </Badge>
          <h1 className="text-h1 font-bold text-secondary mb-4">
            InvoiceFlow AI Pro
          </h1>
          <p className="text-body-lg text-secondary/80 max-w-md mx-auto">
            Unlimited invoices, auto-reminders, and priority support for Austin devs & agencies.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto"
        >
          <Card className="overflow-hidden border-2 border-primary/30">
            <CardHeader className="bg-primary/10">
              <p className="text-body font-medium text-secondary/80">
                $19/month
              </p>
              <h2 className="text-h2 font-bold text-primary">
                Austin Pro Plan
              </h2>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <ul className="space-y-3">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-body">
                    <Check className="h-5 w-5 text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant="gradient"
                size="lg"
                className="w-full gap-2"
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : null}
                Subscribe with Stripe
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <p className="text-center text-body text-secondary/60 mt-8">
          <Link href="/dashboard" className="text-primary hover:underline">
            Back to Dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
