"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-primary" />
              <h1 className="text-h3 font-semibold text-secondary">
                Something went wrong
              </h1>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-body text-secondary/80">
              Receipt too blurry? Try natural light and upload again. If this keeps happening, we&apos;re here to help — Austin-style.
            </p>
            <Button
              variant="gradient"
              className="w-full gap-2"
              onClick={reset}
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
