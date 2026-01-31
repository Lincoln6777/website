"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Download } from "lucide-react";

const REVENUE_DATA = [
  { month: "Jan", revenue: 3200 },
  { month: "Feb", revenue: 4100 },
  { month: "Mar", revenue: 3800 },
  { month: "Apr", revenue: 5200 },
  { month: "May", revenue: 4800 },
  { month: "Jun", revenue: 6100 },
];

const EXPENSE_BY_CATEGORY = [
  { name: "Software", value: 1200, color: "#f4a261" },
  { name: "Office", value: 800, color: "#87a96b" },
  { name: "Travel", value: 600, color: "#0f4c5c" },
  { name: "Dining", value: 400, color: "#e76f51" },
  { name: "Other", value: 500, color: "#264653" },
];

const STATS = [
  { label: "Invoices Sent", value: "23" },
  { label: "Revenue", value: "$12.8k" },
  { label: "Avg Pay Time", value: "14 days" },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("6m");

  const exportCSV = () => {
    const headers = ["Month", "Revenue"];
    const rows = REVENUE_DATA.map((d) => [d.month, d.revenue]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoiceflow-revenue.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-h2 font-semibold"
      >
        Analytics
      </motion.h1>

      {/* Date range + Export */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-wrap items-center gap-4"
      >
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-austin border border-secondary/20 bg-white dark:bg-secondary/20 px-3 py-2 text-body"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="6m">Last 6 months</option>
          <option value="12m">Last 12 months</option>
        </select>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {STATS.map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-6">
              <p className="text-body text-secondary/70">{stat.label}</p>
              <p className="text-h3 font-bold text-primary mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Revenue line chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <h3 className="text-h3 font-semibold">Revenue (monthly)</h3>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={REVENUE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0f4c5c20" />
                  <XAxis dataKey="month" stroke="#0f4c5c80" fontSize={12} />
                  <YAxis stroke="#0f4c5c80" fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value}`, "Revenue"]}
                    contentStyle={{ borderRadius: 16 }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f4a261"
                    strokeWidth={2}
                    dot={{ fill: "#f4a261" }}
                    fill="url(#revenueGradient)"
                    isAnimationActive
                  />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f4a261" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f4a261" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Expense donut */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <h3 className="text-h3 font-semibold">Expenses by category</h3>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={EXPENSE_BY_CATEGORY}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {EXPENSE_BY_CATEGORY.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
