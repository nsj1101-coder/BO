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

interface PageRow {
  path: string;
  views: number;
  uniqueVisitors: number;
  avgDuration: number;
  avgScrollDepth: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function HpPagesPage() {
  const [period, setPeriod] = useState("7d");
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/track/analytics/pages?period=${period}&limit=50`)
      .then((r) => r.json())
      .then(setPages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const maxViews = Math.max(...pages.map((p) => p.views), 1);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

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

      <div style={card}>
        {pages.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#ccc", fontSize: 14 }}>데이터가 없습니다</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>페이지 경로</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12, width: 220 }}>조회수</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>순 방문자</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>평균 체류시간</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>스크롤 깊이</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.path} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 12px", color: ACCENT, fontWeight: 500 }}>{p.path}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                      <div style={{ width: 120, height: 8, borderRadius: 4, background: "#f3f4f6", overflow: "hidden" }}>
                        <div style={{ width: `${(p.views / maxViews) * 100}%`, height: "100%", background: ACCENT, borderRadius: 4 }} />
                      </div>
                      <span style={{ color: "#333", fontWeight: 600, minWidth: 40, textAlign: "right" }}>{p.views.toLocaleString()}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#666", textAlign: "right" }}>{p.uniqueVisitors.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", color: "#666", textAlign: "right" }}>{formatDuration(p.avgDuration)}</td>
                  <td style={{ padding: "10px 12px", color: "#666", textAlign: "right" }}>{p.avgScrollDepth}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
