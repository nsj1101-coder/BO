"use client";

import { useEffect, useState } from "react";

const ACCENT = "#4332f8";
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 };

interface Visitor {
  visitorId: string;
  sessions: number;
  lastSeen: string;
  totalPageViews: number;
  device: string;
  browser: string;
  country: string;
}

interface VisitorSession {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  landingPage: string;
  exitPage: string;
  pageCount: number;
  device: string;
  browser: string;
}

export default function HpVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState<string | null>(null);
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/track/analytics/visitors?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => { setVisitors(d.visitors); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const openDetail = (visitorId: string) => {
    setSelectedVisitor(visitorId);
    setSessionsLoading(true);
    fetch(`/api/track/analytics/visitors?page=1&limit=1`)
      .then(() => {
        setSessions([]);
        setSessionsLoading(false);
      })
      .catch(() => setSessionsLoading(false));
  };

  const totalPages = Math.ceil(total / 20);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

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
      <div style={{ fontSize: 13, color: "#999" }}>총 {total.toLocaleString()}명의 방문자</div>

      <div style={card}>
        {visitors.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#ccc", fontSize: 14 }}>데이터가 없습니다</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>방문자 ID</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>세션 수</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>마지막 방문</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>총 페이지뷰</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>디바이스</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>브라우저</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>국가</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((v) => (
                <tr
                  key={v.visitorId}
                  onClick={() => openDetail(v.visitorId)}
                  style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f9f9ff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: ACCENT, background: "#f0efff", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>{v.visitorId.slice(0, 12)}...</span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#333", fontWeight: 600, textAlign: "right" }}>{v.sessions}</td>
                  <td style={{ padding: "10px 12px", color: "#666" }}>{formatDate(v.lastSeen)}</td>
                  <td style={{ padding: "10px 12px", color: "#333", fontWeight: 600, textAlign: "right" }}>{v.totalPageViews}</td>
                  <td style={{ padding: "10px 12px", color: "#666" }}>{v.device || "-"}</td>
                  <td style={{ padding: "10px 12px", color: "#666" }}>{v.browser || "-"}</td>
                  <td style={{ padding: "10px 12px", color: "#666" }}>{v.country || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: page === 1 ? "default" : "pointer", color: page === 1 ? "#ccc" : "#333", fontSize: 13 }}
          >
            이전
          </button>
          <span style={{ display: "flex", alignItems: "center", padding: "0 12px", fontSize: 13, color: "#666" }}>{page} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: page === totalPages ? "default" : "pointer", color: page === totalPages ? "#ccc" : "#333", fontSize: 13 }}
          >
            다음
          </button>
        </div>
      )}

      {selectedVisitor && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedVisitor(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", background: "#fff", borderRadius: 20, width: "90%", maxWidth: 640, maxHeight: "80vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.2)", padding: 32 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>방문자 상세</div>
                <div style={{ fontSize: 12, color: "#999", fontFamily: "monospace", marginTop: 4 }}>{selectedVisitor}</div>
              </div>
              <button onClick={() => setSelectedVisitor(null)} style={{ width: 32, height: 32, borderRadius: 100, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 16, color: "#999" }}>x</button>
            </div>
            {sessionsLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#ccc" }}>로딩 중...</div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#ccc", fontSize: 14 }}>세션 상세 데이터 API를 확장하면 이곳에 세션 목록이 표시됩니다.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "#999", fontSize: 12 }}>시작</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "#999", fontSize: 12 }}>랜딩</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "#999", fontSize: 12 }}>이탈</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: "#999", fontSize: 12 }}>페이지</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.sessionId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 12px", color: "#666" }}>{formatDate(s.startedAt)}</td>
                      <td style={{ padding: "8px 12px", color: ACCENT }}>{s.landingPage}</td>
                      <td style={{ padding: "8px 12px", color: "#666" }}>{s.exitPage}</td>
                      <td style={{ padding: "8px 12px", color: "#333", fontWeight: 600, textAlign: "right" }}>{s.pageCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
