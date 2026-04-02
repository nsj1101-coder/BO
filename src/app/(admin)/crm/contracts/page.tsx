"use client";

import { useEffect, useState, useCallback } from "react";

interface Contract {
  id: number;
  contractNumber: string;
  title: string;
  amount: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  deal?: { id: number; title: string } | null;
  createdAt: string;
}

const ACCENT = "#4332f8";
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };

const statusLabels: Record<string, string> = { draft: "초안", active: "진행중", completed: "완료", cancelled: "취소" };
const statusColors: Record<string, string> = { draft: "#6b7280", active: "#10b981", completed: "#2563eb", cancelled: "#ef4444" };

export default function CrmContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ dealId: "", title: "", amount: "", startDate: "", endDate: "" });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    fetch(`/api/crm/contracts?${params}`)
      .then((r) => r.json())
      .then((d) => { setContracts(d.contracts || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    await fetch("/api/crm/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealId: Number(form.dealId),
        title: form.title,
        amount: Number(form.amount) || 0,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      }),
    });
    setShowModal(false);
    setForm({ dealId: "", title: "", amount: "", startDate: "", endDate: "" });
    fetchData();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>계약 등록</button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
              {["계약번호", "딜명", "제목", "금액", "기간", "상태"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#999" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>로딩 중...</td></tr>
            ) : contracts.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>계약이 없습니다.</td></tr>
            ) : contracts.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 14px", color: ACCENT, fontWeight: 600 }}>{c.contractNumber}</td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{c.deal?.title || "-"}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111" }}>{c.title}</td>
                <td style={{ padding: "10px 14px", color: "#333", fontWeight: 600 }}>{c.amount ? `${(c.amount / 10000).toLocaleString()}만` : "-"}</td>
                <td style={{ padding: "10px 14px", color: "#666", fontSize: 13 }}>
                  {c.startDate ? new Date(c.startDate).toLocaleDateString("ko-KR") : "?"} ~ {c.endDate ? new Date(c.endDate).toLocaleDateString("ko-KR") : "?"}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: `${statusColors[c.status] || "#666"}18`, color: statusColors[c.status] || "#666" }}>{statusLabels[c.status] || c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#999" }}>총 {total}건</span>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map((p) => (
            <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb", background: p === page ? ACCENT : "#fff", color: p === page ? "#fff" : "#666", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{p}</button>
          ))}
        </div>
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowModal(false)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", width: 480, background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 20, marginTop: 0 }}>계약 등록</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>딜 ID *</label>
                <input value={form.dealId} onChange={(e) => setForm({ ...form, dealId: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>제목 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>금액 (원)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>시작일</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>종료일</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={inputStyle} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#666", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>취소</button>
              <button onClick={handleCreate} disabled={!form.dealId || !form.title} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: form.dealId && form.title ? 1 : 0.5 }}>등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
