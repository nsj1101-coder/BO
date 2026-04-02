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
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "20px 24px",
};

const ACCENT = "#4332f8";

export default function CrmDashboardPage() {
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
    { label: "미처리 후속", value: data?.pendingFollowups ?? 0, color: "#f59e0b" },
    { label: "총 딜", value: data?.totalDeals ?? 0, color: "#ec4899" },
    { label: "총 매출", value: `${((data?.totalRevenue ?? 0) / 10000).toLocaleString()}만`, color: "#10b981" },
    { label: "전환율", value: `${(data?.conversionRate ?? 0).toFixed(1)}%`, color: "#8b5cf6" },
  ];

  const leadsByStatus = data?.leadsByStatus ?? [];
  const dealsByStage = data?.dealsByStage ?? [];
  const maxLeadCount = Math.max(...leadsByStatus.map((s) => s.count), 1);
  const maxDealCount = Math.max(...dealsByStage.map((s) => s.count), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
        {stats.map((s) => (
          <div key={s.label} style={cardStyle}>
            <div style={{ fontSize: 13, color: "#888", fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 20 }}>리드 상태별 현황</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {leadsByStatus.length === 0 && <div style={{ color: "#ccc", fontSize: 13 }}>데이터 없음</div>}
            {leadsByStatus.map((s) => (
              <div key={s.status} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 80, fontSize: 13, color: "#555", fontWeight: 500, flexShrink: 0 }}>{s.label}</div>
                <div style={{ flex: 1, height: 24, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(s.count / maxLeadCount) * 100}%`, background: s.color || ACCENT, borderRadius: 6, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ width: 36, fontSize: 13, fontWeight: 700, color: "#333", textAlign: "right" }}>{s.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 20 }}>딜 단계별 현황</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dealsByStage.length === 0 && <div style={{ color: "#ccc", fontSize: 13 }}>데이터 없음</div>}
            {dealsByStage.map((s) => (
              <div key={s.stage} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 80, fontSize: 13, color: "#555", fontWeight: 500, flexShrink: 0 }}>{s.label}</div>
                <div style={{ flex: 1, height: 24, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(s.count / maxDealCount) * 100}%`, background: s.color || ACCENT, borderRadius: 6, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ width: 36, fontSize: 13, fontWeight: 700, color: "#333", textAlign: "right" }}>{s.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
