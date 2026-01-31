"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, MoreHorizontal, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/supabase";

type ClientRow = Client & { status?: string; lastInvoice?: string };
const columnHelper = createColumnHelper<ClientRow>();

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchClients = useCallback(() => {
    setLoading(true);
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.clients ?? []).map((c: Client) => ({
          ...c,
          status: c.total_owed === 0 ? "Paid" : "Pending",
          lastInvoice: "—",
        }));
        setClients(list);
      })
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const openNew = () => {
    setFormName("");
    setFormEmail("");
    setError("");
    setNewOpen(true);
  };

  const openEdit = (client: ClientRow) => {
    setSelectedClient(client);
    setFormName(client.name);
    setFormEmail(client.email);
    setError("");
    setEditOpen(true);
  };

  const openDelete = (client: ClientRow) => {
    setSelectedClient(client);
    setDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), email: formEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create client");
      setNewOpen(false);
      fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), email: formEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update client");
      setEditOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete client");
      }
      setDeleteOpen(false);
      setSelectedClient(null);
      fetchClients();
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    columnHelper.display({
      id: "avatar",
      header: "",
      cell: ({ row }) => (
        <Avatar className="h-9 w-9 border-2 border-primary/20">
          <AvatarFallback className="text-body font-semibold bg-primary/10 text-primary">
            {row.original.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ),
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => (
        <span className="font-medium text-secondary">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("total_owed", {
      header: "Total Owed",
      cell: (info) => (
        <span className="tabular-nums text-secondary/90">
          ${Number(info.getValue()).toFixed(2)}
        </span>
      ),
    }),
    columnHelper.accessor((row) => row.status, {
      id: "status",
      header: "Status",
      cell: (info) => {
        const v = info.getValue();
        if (v === "Paid") return <Badge variant="paid" className="font-medium">Paid</Badge>;
        if (v === "Pending") return <Badge variant="pending">Pending</Badge>;
        if (v === "Overdue") return <Badge variant="overdue">Overdue</Badge>;
        return <Badge variant="secondary">—</Badge>;
      },
    }),
    columnHelper.accessor((row) => row.lastInvoice, {
      id: "lastInvoice",
      header: "Last Invoice",
      cell: (info) => (
        <span className="text-secondary/70">{info.getValue() ?? "—"}</span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-austin hover:bg-primary/10 hover:text-primary"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-austin shadow-lg border border-secondary/10">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/invoices/new?clientId=${row.original.id}`} className="flex items-center gap-2 cursor-pointer">
                <Eye className="h-4 w-4" />
                New invoice
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openEdit(row.original)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openDelete(row.original)}
              className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ];

  const table = useReactTable({
    data: clients,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-h2 font-bold text-secondary tracking-tight"
      >
        Clients
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)] bg-austin-offwhite/80 dark:bg-secondary/10 border border-white/60 dark:border-white/10 overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-secondary/10 bg-white/50 dark:bg-secondary/5">
          <h2 className="text-h3 font-semibold text-secondary">All clients</h2>
          <Button
            variant="gradient"
            size="default"
            className="gap-2 rounded-xl shadow-md hover:shadow-lg transition-shadow font-semibold"
            onClick={openNew}
          >
            <UserPlus className="h-4 w-4" />
            New Client
          </Button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-secondary/60">Loading clients…</div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-body text-secondary/70 mb-4">No clients yet.</p>
              <Button variant="gradient" onClick={openNew} className="gap-2 rounded-xl">
                <UserPlus className="h-4 w-4" />
                Add your first client
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="bg-secondary/5 border-b border-secondary/10">
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="text-left p-4 text-body font-semibold text-secondary/80"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {table.getRowModel().rows.map((row, i) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={cn(
                        "border-b border-secondary/5 transition-colors duration-200",
                        "hover:bg-primary/5 hover:shadow-[inset_0_1px_0_0_rgba(244,162,97,0.2)]"
                      )}
                      whileHover={{ y: -1 }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4 text-body align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* FAB - mobile */}
      <div className="fixed bottom-6 right-6 z-30 lg:hidden">
        <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
          <Button
            variant="gradient"
            size="lg"
            className="rounded-full shadow-lg gap-2 h-14 px-6 font-semibold"
            onClick={openNew}
          >
            <UserPlus className="h-5 w-5" />
            New Client
          </Button>
        </motion.div>
      </div>

      {/* New Client Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="rounded-2xl border border-secondary/10 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-h3 font-bold text-secondary">New client</DialogTitle>
            <DialogDescription>Add a client to start sending invoices.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            {error && (
              <p className="text-body text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
            <div>
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Acme Inc."
                className="mt-1.5 rounded-xl border-secondary/20"
                required
              />
            </div>
            <div>
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="billing@acme.com"
                className="mt-1.5 rounded-xl border-secondary/20"
                required
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button type="button" variant="outline" onClick={() => setNewOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={submitting} className="gap-2 rounded-xl">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Create client
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl border border-secondary/10 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-h3 font-bold text-secondary">Edit client</DialogTitle>
            <DialogDescription>Update name and email.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            {error && (
              <p className="text-body text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Acme Inc."
                className="mt-1.5 rounded-xl"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="billing@acme.com"
                className="mt-1.5 rounded-xl"
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={submitting} className="gap-2 rounded-xl">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl border border-secondary/10 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-h3 font-bold text-secondary">Delete client</DialogTitle>
            <DialogDescription>
              Remove {selectedClient?.name}? This cannot be undone. Invoices linked to this client will need to be updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
