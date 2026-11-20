"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/money";

const INDIGO = "#4f46e5";
const PIE_COLORS = ["#4f46e5", "#7c3aed", "#0d9488", "#f59e0b", "#e11d48", "#64748b"];

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
  fontSize: 12,
};

export function RevenueAreaChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={INDIGO} stopOpacity={0.28} />
              <stop offset="100%" stopColor={INDIGO} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v: number) => formatINR(v, { compact: true })}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number | string) => [formatINR(Number(value)), "Course sales"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={INDIGO}
            strokeWidth={2}
            fill="url(#revenueFill)"
            activeDot={{ r: 4, fill: INDIGO }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPieChart({ data }: { data: { category: string; count: number }[] }) {
  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
        No enrollments yet — the donut will appear once students enroll.
      </div>
    );
  }
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="category"
            innerRadius={58}
            outerRadius={92}
            paddingAngle={3}
            strokeWidth={2}
            stroke="#fff"
          >
            {data.map((entry, i) => (
              <Cell key={entry.category} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => <span className="text-xs text-slate-600">{value}</span>}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number | string, name: string) => [`${value} enrollments`, name]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SalesBarChart({ data }: { data: { title: string; revenue: number }[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            tickFormatter={(v: number) => formatINR(v, { compact: true })}
          />
          <YAxis
            type="category"
            dataKey="title"
            width={170}
            tick={{ fontSize: 11, fill: "#334155" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number | string) => [formatINR(Number(value)), "Revenue"]}
          />
          <Bar dataKey="revenue" fill={INDIGO} radius={[0, 6, 6, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CompletionBarChart({ data }: { data: { course: string; percent: number }[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="course"
            width={170}
            tick={{ fontSize: 11, fill: "#334155" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number | string) => [`${value}%`, "Completion"]} />
          <ReferenceLine x={80} stroke="#f59e0b" strokeDasharray="6 4" label={{ value: "Target 80%", position: "top", fontSize: 11, fill: "#b45309" }} />
          <Bar dataKey="percent" fill="#0d9488" radius={[0, 6, 6, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
