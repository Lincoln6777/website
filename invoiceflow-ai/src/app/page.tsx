import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-austin-teal flex flex-col items-center justify-center px-4 text-austin-offwhite">
      <h1 className="text-h1 font-bold text-center mb-4">
        InvoiceFlow AI
      </h1>
      <p className="text-body-lg text-center max-w-md mb-8 opacity-90">
        Austin&apos;s #1 invoicing tool. Perfect for Austin devs & agencies.
      </p>
      <Link href="/dashboard">
        <Button variant="gradient" size="lg" className="gap-2">
          <FileText className="h-5 w-5" />
          Go to Dashboard
        </Button>
      </Link>
    </main>
  );
}
