"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Consultation {
  id: number;
  consultType: string;
  summary: string;
  result: string;
  createdAt: string;
  customer?: { id: number; name: string } | null;
  lead?: { id: number; customerName: string } | null;
  assignee?: { id: number; name: string } | null;
}

const ACCENT = "#4332f8";

const consultTypeLabels: Record<string, string> = { phone: "전화", visit: "방문", online: "온라인", email: "이메일", chat: "채팅" };
const resultLabels: Record<string, string> = { pending: "대기", positive: "긍정", negative: "부정", followup: "후속필요", closed: "종결" };
const resultColors: Record<string, string> = { pending: "#f59e0b", positive: "#10b981", negative: "#ef4444", followup: "#6366f1", closed: "#6b7280" };

const badge = (label: string, bg: string, color: string): React.CSSProperties => ({
  display: "inline-block", padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: bg, color, whiteSpace: "nowrap",
});

const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };

export default function CrmConsultationsPage() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterResult, setFilterResult] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ consultType: "phone", content: "", summary: "", result: "pending", customerId: "", leadId: "" });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filterResult) params.set("result", filterResult);
    if (filterType) params.set("consultType", filterType);
    fetch(`/api/crm/consultations?${params}`)
      .then((r) => r.json())
      .then((d) => { setConsultations(d.consultations || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filterResult, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    await fetch("/api/crm/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        customerId: form.customerId ? Number(form.customerId) : undefined,
        leadId: form.leadId ? Number(form.leadId) : undefined,
      }),
    });
    setShowModal(false);
    setForm({ consultType: "phone", content: "", summary: "", result: "pending", customerId: "", leadId: "" });
    fetchData();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, color: "#555" }}>
            <option value="">유형 전체</option>
            {Object.entries(consultTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterResult} onChange={(e) => { setFilterResult(e.target.value); setPage(1); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, color: "#555" }}>
            <option value="">결과 전체</option>
            {Object.entries(resultLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>상담 등록</button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
              {["상담일", "고객명", "유형", "담당자", "결과", "요약"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#999" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>로딩 중...</td></tr>
            ) : consultations.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>상담 내역이 없습니다.</td></tr>
            ) : consultations.map((c) => (
              <tr key={c.id} onClick={() => router.push(`/crm/consultations/${c.id}`)} style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.1s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; }} onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
                <td style={{ padding: "10px 14px", color: "#555" }}>{new Date(c.createdAt).toLocaleDateString("ko-KR")}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111" }}>{c.customer?.name || c.lead?.customerName || "-"}</td>
                <td style={{ padding: "10px 14px" }}><span style={badge(consultTypeLabels[c.consultType] || c.consultType, "#ede9fe", "#7c3aed")}>{consultTypeLabels[c.consultType] || c.consultType}</span></td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{c.assignee?.name || "-"}</td>
                <td style={{ padding: "10px 14px" }}><span style={badge(resultLabels[c.result] || c.result, `${resultColors[c.result] || "#666"}18`, resultColors[c.result] || "#666")}>{resultLabels[c.result] || c.result}</span></td>
                <td style={{ padding: "10px 14px", color: "#666", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.summary || "-"}</td>
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
          <div style={{ position: "relative", width: 520, background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 20, marginTop: 0 }}>상담 등록</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>고객 ID</label>
                  <input value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} style={inputStyle} placeholder="선택사항" />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>리드 ID</label>
                  <input value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} style={inputStyle} placeholder="선택사항" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>상담유형</label>
                <select value={form.consultType} onChange={(e) => setForm({ ...form, consultType: e.target.value })} style={inputStyle}>
                  {Object.entries(consultTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>내용</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>요약</label>
                <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>결과</label>
                <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} style={inputStyle}>
                  {Object.entries(resultLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#666", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>취소</button>
              <button onClick={handleCreate} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
