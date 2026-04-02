"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  totalLeads: number;
  todayLeads: number;
  totalCustomers: number;
  pendingFollowups: number;
  totalDeals: number;
  totalRevenue: number;
  conversionRate: number;
  leadsByStatus: { status: string; label: string; count: number; color: string }[];
  dealsByStage: { stage: string; label: string; count: number; color: string }[];
  monthlyLeads?: { month: string; count: number }[];
  monthlyRevenue?: { month: string; amount: number }[];
  topCustomers?: { id: number; name: string; revenue: number; dealCount: number }[];
}

const ACCENT = "#4332f8";
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 };

export default function CrmAnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const stats = [
    { label: "총 리드", value: data?.totalLeads ?? 0, color: ACCENT },
    { label: "금일 신규", value: data?.todayLeads ?? 0, color: "#03b26c" },
    { label: "총 고객", value: data?.totalCustomers ?? 0, color: "#6366f1" },
    { label: "총 딜", value: data?.totalDeals ?? 0, color: "#ec4899" },
    { label: "총 매출", value: `${((data?.totalRevenue ?? 0) / 10000).toLocaleString()}만`, color: "#10b981" },
    { label: "전환율", value: `${(data?.conversionRate ?? 0).toFixed(1)}%`, color: "#8b5cf6" },
  ];

  const leadsByStatus = data?.leadsByStatus ?? [];
  const dealsByStage = data?.dealsByStage ?? [];
  const maxLeadCount = Math.max(...leadsByStatus.map((s) => s.count), 1);
  const maxDealCount = Math.max(...dealsByStage.map((s) => s.count), 1);
  const monthlyLeads = data?.monthlyLeads ?? [];
  const monthlyRevenue = data?.monthlyRevenue ?? [];
  const topCustomers = data?.topCustomers ?? [];

  const maxMonthlyLeads = Math.max(...monthlyLeads.map((m) => m.count), 1);
  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map((m) => m.amount), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
        {stats.map((s) => (
          <div key={s.label} style={cardStyle}>
            <div style={{ fontSize: 13, color: "#888", fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Leads by Status */}
        <div style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 20 }}>리드 상태별 분포</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {leadsByStatus.length === 0 && <div style={{ color: "#ccc", fontSize: 13 }}>데이터 없음</div>}
            {leadsByStatus.map((s) => (
              <div key={s.status} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 80, fontSize: 13, color: "#555", fontWeight: 500, flexShrink: 0 }}>{s.label}</div>
                <div style={{ flex: 1, height: 28, background: "#f3f4f6", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                  <div style={{ height: "100%", width: `${(s.count / maxLeadCount) * 100}%`, background: s.color || ACCENT, borderRadius: 6, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ width: 40, fontSize: 14, fontWeight: 700, color: "#333", textAlign: "right" }}>{s.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Deals by Stage */}
        <div style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 20 }}>딜 단계별 분포</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dealsByStage.length === 0 && <div style={{ color: "#ccc", fontSize: 13 }}>데이터 없음</div>}
            {dealsByStage.map((s) => (
              <div key={s.stage} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 80, fontSize: 13, color: "#555", fontWeight: 500, flexShrink: 0 }}>{s.label}</div>
                <div style={{ flex: 1, height: 28, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(s.count / maxDealCount) * 100}%`, background: s.color || ACCENT, borderRadius: 6, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ width: 40, fontSize: 14, fontWeight: 700, color: "#333", textAlign: "right" }}>{s.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Monthly Leads */}
        <div style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 20 }}>월별 리드 추이</div>
          {monthlyLeads.length === 0 ? (
            <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: 20 }}>데이터 없음</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
              {monthlyLeads.map((m) => (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#333" }}>{m.count}</span>
                  <div style={{ width: "100%", maxWidth: 40, height: `${(m.count / maxMonthlyLeads) * 120}px`, minHeight: 4, background: ACCENT, borderRadius: 4, transition: "height 0.5s ease" }} />
                  <span style={{ fontSize: 10, color: "#999" }}>{m.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Revenue */}
        <div style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 20 }}>월별 매출 추이</div>
          {monthlyRevenue.length === 0 ? (
            <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: 20 }}>데이터 없음</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
              {monthlyRevenue.map((m) => (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#333" }}>{(m.amount / 10000).toFixed(0)}만</span>
                  <div style={{ width: "100%", maxWidth: 40, height: `${(m.amount / maxMonthlyRevenue) * 120}px`, minHeight: 4, background: "#10b981", borderRadius: 4, transition: "height 0.5s ease" }} />
                  <span style={{ fontSize: 10, color: "#999" }}>{m.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Customers Table */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 16 }}>상위 고객</div>
        {topCustomers.length === 0 ? (
          <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: 20 }}>데이터 없음</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                {["#", "고객명", "딜 수", "매출"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#999" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c, idx) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 12px", color: "#999" }}>{idx + 1}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111" }}>{c.name}</td>
                  <td style={{ padding: "8px 12px", color: "#555" }}>{c.dealCount}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 600, color: ACCENT }}>{(c.revenue / 10000).toLocaleString()}만</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
