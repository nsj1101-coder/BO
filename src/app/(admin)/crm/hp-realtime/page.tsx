"use client";

import { useEffect, useState } from "react";

const ACCENT = "#4332f8";
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 };

interface RealtimeData {
  activeVisitors: number;
  activeSessions: { sessionId: string; visitorId: string; path: string; device: string; startedAt: string }[];
}

export default function HpRealtimePage() {
  const [data, setData] = useState<RealtimeData | null>(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/track/analytics/realtime")
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const timeSince = (iso: string): string => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    return `${Math.floor(diff / 3600)}시간 전`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", width: 16, height: 16 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s ease-in-out infinite" }} />
          <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: "#22c55e" }} />
          <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.5)}}`}</style>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#999", fontWeight: 500 }}>현재 접속자 수</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: "#111", lineHeight: 1.1 }}>{data?.activeVisitors ?? 0}</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#bbb" }}>5초마다 자동 갱신</div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>활성 세션 목록</div>
        {(!data?.activeSessions || data.activeSessions.length === 0) ? (
          <div style={{ padding: 40, textAlign: "center", color: "#ccc", fontSize: 14 }}>현재 활성 세션이 없습니다</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>방문자</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>현재 페이지</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>디바이스</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>접속 시간</th>
              </tr>
            </thead>
            <tbody>
              {data.activeSessions.map((s) => (
                <tr key={s.sessionId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 12px", color: "#333" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: "#666", background: "#f3f4f6", padding: "2px 8px", borderRadius: 6 }}>{s.visitorId.slice(0, 8)}</span>
                  </td>
                  <td style={{ padding: "10px 12px", color: ACCENT, fontWeight: 500 }}>{s.path || "/"}</td>
                  <td style={{ padding: "10px 12px", color: "#666" }}>{s.device || "-"}</td>
                  <td style={{ padding: "10px 12px", color: "#999" }}>{timeSince(s.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
