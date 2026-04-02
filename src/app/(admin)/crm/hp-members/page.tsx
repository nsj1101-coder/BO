"use client";

import { useEffect, useState } from "react";

const ACCENT = "#4332f8";
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 };

interface MemberRow {
  memberId: number;
  email: string | null;
  name: string | null;
  sessions: number;
  totalPageViews: number;
  lastSeen: string;
  topPages: { path: string; views: number }[];
}

export default function HpMembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    fetch(`/api/track/analytics/members?${params}`)
      .then((r) => r.json())
      .then((d) => { setMembers(d.members); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const totalPages = Math.ceil(total / 20);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading && members.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          placeholder="이름 또는 이메일 검색..."
          style={{ padding: "8px 16px", borderRadius: 100, border: "1px solid #e5e7eb", fontSize: 13, width: 260, outline: "none" }}
        />
        <button
          onClick={handleSearch}
          style={{ padding: "8px 20px", borderRadius: 100, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          검색
        </button>
        <span style={{ fontSize: 13, color: "#999", marginLeft: 8 }}>총 {total.toLocaleString()}명</span>
      </div>

      <div style={card}>
        {members.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#ccc", fontSize: 14 }}>데이터가 없습니다</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>회원ID</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>이름/이메일</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>세션수</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>총 페이지뷰</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>마지막 접속</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 600, fontSize: 12 }}>주요 페이지</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m.memberId}
                  onClick={() => setSelectedMember(m)}
                  style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f9f9ff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "10px 12px", color: "#333", fontWeight: 600 }}>#{m.memberId}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ color: "#333", fontWeight: 500 }}>{m.name || "-"}</div>
                    <div style={{ color: "#999", fontSize: 12 }}>{m.email || "-"}</div>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#333", fontWeight: 600, textAlign: "right" }}>{m.sessions}</td>
                  <td style={{ padding: "10px 12px", color: "#333", fontWeight: 600, textAlign: "right" }}>{m.totalPageViews}</td>
                  <td style={{ padding: "10px 12px", color: "#666" }}>{formatDate(m.lastSeen)}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {m.topPages.slice(0, 3).map((tp) => (
                        <span key={tp.path} style={{ fontSize: 11, background: "#f0efff", color: ACCENT, padding: "2px 8px", borderRadius: 6, fontWeight: 500 }}>
                          {tp.path} ({tp.views})
                        </span>
                      ))}
                    </div>
                  </td>
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

      {selectedMember && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedMember(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", background: "#fff", borderRadius: 20, width: "90%", maxWidth: 600, maxHeight: "80vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.2)", padding: 32 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>
                  {selectedMember.name || "이름 없음"}
                  <span style={{ fontSize: 12, color: "#999", fontWeight: 400, marginLeft: 8 }}>#{selectedMember.memberId}</span>
                </div>
                <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{selectedMember.email || "-"}</div>
              </div>
              <button onClick={() => setSelectedMember(null)} style={{ width: 32, height: 32, borderRadius: 100, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 16, color: "#999" }}>x</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div style={{ background: "#f9f9ff", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>세션수</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#111" }}>{selectedMember.sessions}</div>
              </div>
              <div style={{ background: "#f9f9ff", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>페이지뷰</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#111" }}>{selectedMember.totalPageViews}</div>
              </div>
              <div style={{ background: "#f9f9ff", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>마지막 접속</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginTop: 6 }}>{formatDate(selectedMember.lastSeen)}</div>
              </div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 12 }}>주요 방문 페이지</div>
            {selectedMember.topPages.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#ccc", fontSize: 13 }}>데이터 없음</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedMember.topPages.map((tp) => {
                  const max = Math.max(...selectedMember.topPages.map((p) => p.views), 1);
                  return (
                    <div key={tp.path} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, color: ACCENT, fontWeight: 500, minWidth: 120 }}>{tp.path}</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#f3f4f6", overflow: "hidden" }}>
                        <div style={{ width: `${(tp.views / max) * 100}%`, height: "100%", background: ACCENT, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#666", fontWeight: 600, minWidth: 40, textAlign: "right" }}>{tp.views}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
