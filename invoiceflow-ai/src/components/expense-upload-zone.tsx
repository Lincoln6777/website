"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
// Tesseract loaded dynamically to avoid SSR
import { motion } from "framer-motion";
import { Upload, PartyPopper, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Dining",
  "Travel",
  "Software",
  "Office Supplies",
  "Marketing",
  "Other",
];

export function ExpenseUploadZone() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [, setOcrText] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const runOCR = useCallback(async (file: File) => {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text")
          setProgress(Math.round(m.progress * 100));
      },
    });
    const { data } = await worker.recognize(file);
    await worker.terminate();
    setOcrText(data.text);
    setProgress(100);
    const lines = data.text.split("\n").filter(Boolean);
    const amountMatch = data.text.match(/\$?\s*(\d+\.?\d*)/);
    if (amountMatch) setAmount(amountMatch[1]);
    if (lines[0]) setMerchant(lines[0].slice(0, 50));
    return data.text;
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const f = acceptedFiles[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setProgress(0);
      setSuccess(false);
      setMerchant("");
      setAmount("");
      setCategory("");
      await runOCR(f);
    },
    [runOCR]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: !!file && !success,
  });

  const handleSaveExpense = async () => {
    if (!file || !merchant || !amount || !category) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("merchant", merchant);
      formData.append("amount", amount);
      formData.append("category", category);
      formData.append("date", new Date().toISOString().slice(0, 10));
      const res = await fetch("/api/expenses", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess(true);
      setFile(null);
      setPreview(null);
      setMerchant("");
      setAmount("");
      setCategory("");
      setOcrText("");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setOcrText("");
    setMerchant("");
    setAmount("");
    setCategory("");
    setSuccess(false);
  };

  return (
    <Card className="overflow-hidden">
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            "cursor-pointer border-2 border-dashed border-primary rounded-austin flex flex-col items-center justify-center min-h-[250px] w-full max-w-[400px] mx-auto bg-primary/5 hover:bg-primary/10 transition-all duration-200",
            isDragActive && "scale-[1.02] ring-2 ring-primary"
          )}
        >
          <input {...getInputProps()} />
          <motion.div animate={{ scale: isDragActive ? 1.05 : 1 }}>
            <Upload className="h-12 w-12 text-primary mx-auto mb-3" />
          </motion.div>
          <p className="text-body font-medium text-secondary">
            Drop receipts here
          </p>
          <p className="text-body text-secondary/60 mt-1">or click to browse</p>
        </div>
      ) : success ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[250px] p-6 bg-accent/10 rounded-austin"
        >
          <PartyPopper className="h-14 w-14 text-accent mb-4" />
          <p className="text-body-lg font-semibold text-accent">Expense saved!</p>
          <Button variant="outline" className="mt-4" onClick={reset}>
            Add another
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 space-y-4 max-w-[400px] mx-auto"
        >
          {/* Thumbnail + progress */}
          <div className="relative rounded-austin overflow-hidden bg-secondary/5">
            {preview ? (
              <img
                src={preview}
                alt="Receipt"
                className="w-full h-32 object-contain"
              />
            ) : null}
            {progress < 100 && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-secondary/10">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            )}
          </div>
          {/* Editable form */}
          <div className="grid gap-3">
            <div>
              <Label>Merchant</Label>
              <Input
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Merchant name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={reset}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleSaveExpense}
              disabled={saving || !merchant || !amount || !category}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Expense"
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </Card>
  );
}
