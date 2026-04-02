"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Lead {
  id: number;
  leadType: string;
  customerName: string;
  phone: string;
  email: string;
  statusCode: string;
  priority: string;
  assignee?: { id: number; name: string } | null;
  nextActionDate: string | null;
  createdAt: string;
}

interface StatusCode {
  code: string;
  label: string;
  color: string;
}

const ACCENT = "#4332f8";

const leadTypeLabels: Record<string, string> = {
  inquiry: "문의",
  consultation: "상담",
  reservation: "예약",
  event: "이벤트",
  referral: "소개",
  inbound: "인바운드",
  outbound: "아웃바운드",
};

const priorityColors: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  normal: "#6b7280",
  low: "#d1d5db",
};

const badge = (label: string, bg: string, color: string): React.CSSProperties => ({
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 100,
  fontSize: 12,
  fontWeight: 600,
  background: bg,
  color,
  whiteSpace: "nowrap",
});

export default function CrmLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusCodes, setStatusCodes] = useState<StatusCode[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ leadType: "inquiry", customerName: "", phone: "", email: "", content: "", priority: "normal" });

  useEffect(() => {
    fetch("/api/crm/status-codes").then((r) => r.json()).then((d) => setStatusCodes(d.statusCodes || d || [])).catch(() => {});
  }, []);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filterStatus) params.set("status", filterStatus);
    if (filterType) params.set("leadType", filterType);
    if (search) params.set("search", search);
    fetch(`/api/crm/leads?${params}`)
      .then((r) => r.json())
      .then((d) => { setLeads(d.leads || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filterStatus, filterType, search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleCreate = async () => {
    await fetch("/api/crm/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowModal(false);
    setForm({ leadType: "inquiry", customerName: "", phone: "", email: "", content: "", priority: "normal" });
    fetchLeads();
  };

  const getStatusBadge = (code: string) => {
    const sc = statusCodes.find((s) => s.code === code);
    return <span style={badge(sc?.label || code, `${sc?.color || "#666"}18`, sc?.color || "#666")}>{sc?.label || code}</span>;
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => { setFilterStatus(""); setPage(1); }} style={{ padding: "6px 14px", borderRadius: 100, border: "1px solid #e5e7eb", background: !filterStatus ? ACCENT : "#fff", color: !filterStatus ? "#fff" : "#666", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>전체</button>
          {statusCodes.map((sc) => (
            <button key={sc.code} onClick={() => { setFilterStatus(sc.code); setPage(1); }} style={{ padding: "6px 14px", borderRadius: 100, border: "1px solid #e5e7eb", background: filterStatus === sc.code ? ACCENT : "#fff", color: filterStatus === sc.code ? "#fff" : "#666", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{sc.label}</button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>리드 등록</button>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, color: "#555" }}>
          <option value="">유형 전체</option>
          {Object.entries(leadTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input placeholder="고객명, 연락처 검색..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchLeads(); } }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: 240, outline: "none" }} />
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
              {["#", "접수일", "유형", "고객명", "연락처", "상태", "담당자", "우선순위", "다음액션일"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#999" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>로딩 중...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>리드가 없습니다.</td></tr>
            ) : leads.map((lead) => (
              <tr key={lead.id} onClick={() => router.push(`/crm/leads/${lead.id}`)} style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.1s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; }} onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
                <td style={{ padding: "10px 14px", color: "#999" }}>{lead.id}</td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{new Date(lead.createdAt).toLocaleDateString("ko-KR")}</td>
                <td style={{ padding: "10px 14px" }}><span style={badge(leadTypeLabels[lead.leadType] || lead.leadType, "#ede9fe", "#7c3aed")}>{leadTypeLabels[lead.leadType] || lead.leadType}</span></td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111" }}>{lead.customerName}</td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{lead.phone}</td>
                <td style={{ padding: "10px 14px" }}>{getStatusBadge(lead.statusCode)}</td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{lead.assignee?.name || "-"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: priorityColors[lead.priority] || "#ccc", marginRight: 6 }} />
                  <span style={{ fontSize: 12, color: "#666" }}>{lead.priority}</span>
                </td>
                <td style={{ padding: "10px 14px", color: "#555", fontSize: 13 }}>{lead.nextActionDate ? new Date(lead.nextActionDate).toLocaleDateString("ko-KR") : "-"}</td>
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
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 20, marginTop: 0 }}>리드 등록</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>유형</label>
                <select value={form.leadType} onChange={(e) => setForm({ ...form, leadType: e.target.value })} style={inputStyle}>
                  {Object.entries(leadTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>고객명 *</label>
                <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>연락처</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>이메일</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>내용</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>우선순위</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
                  <option value="low">낮음</option>
                  <option value="normal">보통</option>
                  <option value="high">높음</option>
                  <option value="urgent">긴급</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#666", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>취소</button>
              <button onClick={handleCreate} disabled={!form.customerName} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: form.customerName ? 1 : 0.5 }}>등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
