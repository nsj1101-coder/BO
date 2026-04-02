"use client";

import { useEffect, useState } from "react";

const ACCENT = "#4332f8";
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 };
const periods = [
  { label: "오늘", value: "today" },
  { label: "7일", value: "7d" },
  { label: "30일", value: "30d" },
  { label: "90일", value: "90d" },
];

interface OverviewData {
  totalSessions: number;
  totalPageViews: number;
  uniqueVisitors: number;
  avgDuration: number;
  avgPagesPerSession: number;
  bounceRate: number;
  newVisitorRate: number;
  dailyData: { date: string; sessions: number; pageViews: number; visitors: number }[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function HpAnalyticsPage() {
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/track/analytics/overview?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const kpis = [
    { label: "총 세션", value: (data?.totalSessions ?? 0).toLocaleString() },
    { label: "총 페이지뷰", value: (data?.totalPageViews ?? 0).toLocaleString() },
    { label: "순 방문자", value: (data?.uniqueVisitors ?? 0).toLocaleString() },
    { label: "평균 체류시간", value: formatDuration(data?.avgDuration ?? 0) },
    { label: "평균 페이지/세션", value: (data?.avgPagesPerSession ?? 0).toFixed(2) },
    { label: "이탈률", value: `${data?.bounceRate ?? 0}%` },
    { label: "신규 방문률", value: `${data?.newVisitorRate ?? 0}%` },
  ];

  const daily = data?.dailyData ?? [];
  const maxSessions = Math.max(...daily.map((d) => d.sessions), 1);
  const maxPV = Math.max(...daily.map((d) => d.pageViews), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            style={{
              padding: "8px 18px", borderRadius: 100, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              background: period === p.value ? ACCENT : "#f3f4f6",
              color: period === p.value ? "#fff" : "#666",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
        {kpis.map((k) => (
          <div key={k.label} style={card}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 8, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 20 }}>일별 추이</div>
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 180 }}>
          {daily.map((d) => (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", justifyContent: "center", height: 140 }}>
                <div
                  style={{
                    width: "40%", borderRadius: "4px 4px 0 0",
                    background: ACCENT,
                    height: `${Math.max((d.sessions / maxSessions) * 140, 2)}px`,
                  }}
                  title={`세션: ${d.sessions}`}
                />
                <div
                  style={{
                    width: "40%", borderRadius: "4px 4px 0 0",
                    background: "#c7c2fd",
                    height: `${Math.max((d.pageViews / maxPV) * 140, 2)}px`,
                  }}
                  title={`페이지뷰: ${d.pageViews}`}
                />
              </div>
              <div style={{ fontSize: 10, color: "#bbb", marginTop: 4, whiteSpace: "nowrap" }}>{d.date.slice(5)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 16, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#666" }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: ACCENT }} /> 세션
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#666" }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#c7c2fd" }} /> 페이지뷰
          </div>
        </div>
      </div>
    </div>
  );
}
