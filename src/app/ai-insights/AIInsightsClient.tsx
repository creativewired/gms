"use client";

import { useState } from "react";

type Branch = { id: number; name: string };

type Insight = {
  type: "positive" | "warning" | "opportunity" | "alert";
  title: string;
  description: string;
  metric: string;
  action: string;
};

type AIResult = {
  summary: string;
  insights: Insight[];
  busiest_day: string;
  slowest_day: string;
  top_service: string;
  revenue_trend: "up" | "down" | "stable";
  forecast: {
    next_month_estimate: string;
    confidence: "low" | "medium" | "high";
    reasoning: string;
  };
  quick_wins: string[];
};

const insightConfig = {
  positive: {
    bg: "#f0fdf4", border: "#bbf7d0", icon: "#22c55e",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-100",
    label: "Positive",
  },
  warning: {
    bg: "#fffbeb", border: "#fde68a", icon: "#f59e0b",
    badge: "bg-amber-50 text-amber-600 border-amber-100",
    label: "Warning",
  },
  opportunity: {
    bg: "#eff6ff", border: "#bfdbfe", icon: "#3b82f6",
    badge: "bg-blue-50 text-blue-600 border-blue-100",
    label: "Opportunity",
  },
  alert: {
    bg: "#fff1f0", border: "#fecaca", icon: "#ef4444",
    badge: "bg-red-50 text-red-500 border-red-100",
    label: "Alert",
  },
};

const insightIcons = {
  positive: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  opportunity: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  alert: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

export default function AIInsightsClient({
  branchId,
  branches,
}: {
  branchId: number | null;
  branches: Branch[];
}) {
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<number | null>(branchId);

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: selectedBranch }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to generate insights. Check your OpenAI API key.");
    }

    setLoading(false);
  };

  const trendIcon = (trend: string) => {
    if (trend === "up") return (
      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      </svg>
    );
    if (trend === "down") return (
      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      </svg>
    );
    return (
      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">

      {/* Generate Card */}
      <div
        className="relative overflow-hidden rounded-3xl p-8"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: "-60px", right: "-40px",
          width: "250px", height: "250px", borderRadius: "50%",
          background: "rgba(167,139,250,0.1)", filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: "-40px", left: "20%",
          width: "180px", height: "180px", borderRadius: "50%",
          background: "rgba(99,102,241,0.15)", filter: "blur(30px)",
        }} />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(167,139,250,0.2)" }}>
                  <svg className="w-4 h-4" fill="none" stroke="#a78bfa" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span style={{ color: "rgba(167,139,250,0.8)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Powered by GPT-4o Mini
                </span>
              </div>
              <h2 style={{ color: "white", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                Analyze Your Workshop
              </h2>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", marginTop: "0.5rem", maxWidth: "420px" }}>
                AI analyzes your jobs, revenue, services, mechanics, and appointments to surface
                actionable insights and revenue forecasts.
              </p>
            </div>

            {/* Branch selector */}
            <div className="shrink-0">
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                Branch
              </p>
              <select
                value={selectedBranch ?? ""}
                onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : null)}
                className="input"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                  minWidth: "160px",
                }}
              >
                <option value="" style={{ color: "#1c1c1e" }}>All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} style={{ color: "#1c1c1e" }}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: loading ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.95)",
              color: loading ? "rgba(255,255,255,0.4)" : "#312e81",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analyzing your data...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Generate AI Insights
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "#fff1f0", border: "1px solid #fecaca" }}>
          <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">

          {/* Executive Summary */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "#f5f3ff" }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="#7c3aed" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Executive Summary
              </p>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed">{result.summary}</p>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Busiest Day",
                value: result.busiest_day,
                icon: "📈",
                color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0",
              },
              {
                label: "Slowest Day",
                value: result.slowest_day,
                icon: "📉",
                color: "#dc2626", bg: "#fff1f0", border: "#fecaca",
              },
              {
                label: "Top Service",
                value: result.top_service,
                icon: "⭐",
                color: "#b45309", bg: "#fffbeb", border: "#fde68a",
              },
              {
                label: "Revenue Trend",
                value: result.revenue_trend.charAt(0).toUpperCase() + result.revenue_trend.slice(1),
                icon: result.revenue_trend === "up" ? "↑" : result.revenue_trend === "down" ? "↓" : "→",
                color: result.revenue_trend === "up" ? "#15803d" : result.revenue_trend === "down" ? "#dc2626" : "#64748b",
                bg: result.revenue_trend === "up" ? "#f0fdf4" : result.revenue_trend === "down" ? "#fff1f0" : "#f8fafc",
                border: result.revenue_trend === "up" ? "#bbf7d0" : result.revenue_trend === "down" ? "#fecaca" : "#e2e8f0",
              },
            ].map((m) => (
              <div key={m.label} className="stat-card" style={{ borderTop: `3px solid ${m.border}` }}>
                <p className="label">{m.label}</p>
                <div className="flex items-center gap-2 mt-1">
                  {m.label === "Revenue Trend" ? trendIcon(result.revenue_trend) : null}
                  <p className="text-base font-bold truncate" style={{ color: m.color }}>
                    {m.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Forecast */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "1px solid #ddd6fe" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-1">
                  AI Revenue Forecast
                </p>
                <p style={{ fontSize: "2.25rem", fontWeight: 800, color: "#4c1d95", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {result.forecast.next_month_estimate}
                </p>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                  {result.forecast.reasoning}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                result.forecast.confidence === "high"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : result.forecast.confidence === "medium"
                  ? "bg-amber-50 text-amber-600 border-amber-100"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}>
                {result.forecast.confidence} confidence
              </span>
            </div>
          </div>

          {/* Insights Grid */}
          <div>
            <p className="section-title">Insights</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.insights.map((insight, i) => {
                const config = insightConfig[insight.type];
                return (
                  <div key={i} className="card p-5"
                    style={{ borderLeft: `4px solid ${config.border}` }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: config.bg, color: config.icon }}>
                        {insightIcons[insight.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {insight.title}
                          </p>
                          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${config.badge}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs font-bold" style={{ color: config.icon }}>
                          {insight.metric}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      {insight.description}
                    </p>
                    <div className="flex items-start gap-2 rounded-xl p-3"
                      style={{ background: config.bg }}>
                      <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke={config.icon}
                        strokeWidth={2.5} viewBox="0 0 24 24">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <p className="text-xs font-medium" style={{ color: config.icon }}>
                        {insight.action}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Wins */}
          {result.quick_wins && result.quick_wins.length > 0 && (
            <div className="card p-6">
              <p className="text-sm font-semibold text-slate-800 mb-4">⚡ Quick Wins</p>
              <div className="space-y-2">
                {result.quick_wins.map((win, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: "#f8fafc" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                      style={{ background: "#7c3aed", marginTop: "1px" }}>
                      {i + 1}
                    </div>
                    <p className="text-sm text-slate-600">{win}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#f5f3ff" }}>
            <svg className="w-8 h-8" fill="none" stroke="#7c3aed" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="text-slate-700 font-semibold text-base">Ready to analyze</p>
          <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
            Click "Generate AI Insights" to get a full analysis of your workshop performance, trends and opportunities.
          </p>
        </div>
      )}
    </div>
  );
}
