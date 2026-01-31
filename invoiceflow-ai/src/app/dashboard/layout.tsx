"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Users,
  BarChart3,
  PieChart,
  Menu,
  X,
  Sun,
  Moon,
  Settings,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Invoices", icon: FileText },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/analytics", label: "Analytics", icon: PieChart },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - fixed left, gray-100, w-64 */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-gray-100 dark:bg-secondary/50 border-r border-secondary/10 flex flex-col transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 lg:justify-center">
          <Link href="/dashboard" className="font-semibold text-secondary text-h3">
            InvoiceFlow AI
          </Link>
          <button
            className="lg:hidden p-2 rounded-austin hover:bg-secondary/10"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-austin px-4 py-3 text-body font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-primary/15 text-primary"
                  : "text-secondary/80 hover:bg-secondary/10 hover:text-secondary"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 min-h-screen flex flex-col">
        {/* Glassmorphism header + dark mode toggle */}
        <header className="sticky top-0 z-30 glass border-b border-secondary/10 px-4 lg:px-gutter py-4">
          <div className="max-w-content mx-auto flex items-center justify-between">
            <button
              className="lg:hidden p-2 rounded-austin hover:bg-secondary/10"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-body-lg font-medium text-secondary/90">
              Welcome back, Austin freelancer
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-gutter max-w-content mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
