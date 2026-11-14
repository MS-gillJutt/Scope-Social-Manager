import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  icon?: React.ElementType;
  iconColor?: string;
  badge?: string;
}

export function StatCard({
  title,
  value,
  change,
  trend = "up",
  subtitle,
  icon: Icon,
  iconColor = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  badge,
}: StatCardProps) {
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 hover:border-slate-700 transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {badge && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {badge}
          </span>
        )}
      </div>

      {(change || subtitle) && (
        <div className="mt-3 pt-3 border-t border-[#1e293b]/70 flex items-center justify-between text-xs">
          {change && (
            <div
              className={`flex items-center gap-1 font-medium ${
                trend === "up"
                  ? "text-emerald-400"
                  : trend === "down"
                  ? "text-rose-400"
                  : "text-slate-400"
              }`}
            >
              {trend === "up" && <ArrowUpRight className="w-3.5 h-3.5" />}
              {trend === "down" && <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend === "neutral" && <Minus className="w-3.5 h-3.5" />}
              <span>{change}</span>
            </div>
          )}
          {subtitle && <span className="text-slate-400 text-[11px] truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
