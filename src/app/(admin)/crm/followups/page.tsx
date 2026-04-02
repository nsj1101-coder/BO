"use client";

import { useEffect, useState, useCallback } from "react";

interface Followup {
  id: number;
  title: string;
  taskType: string;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  memo: string;
  customer?: { id: number; name: string } | null;
  lead?: { id: number; customerName: string } | null;
  assignee?: { id: number; name: string } | null;
}

const ACCENT = "#4332f8";

const taskTypeLabels: Record<string, string> = { call: "전화", email: "이메일", visit: "방문", meeting: "미팅", other: "기타" };
const priorityLabels: Record<string, string> = { urgent: "긴급", high: "높음", normal: "보통", low: "낮음" };
const priorityColors: Record<string, string> = { urgent: "#ef4444", high: "#f97316", normal: "#6b7280", low: "#d1d5db" };

const badge = (label: string, bg: string, color: string): React.CSSProperties => ({
  display: "inline-block", padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: bg, color, whiteSpace: "nowrap",
});

const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };

export default function CrmFollowupsPage() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", taskType: "call", dueDate: "", memo: "", priority: "normal", customerId: "", leadId: "" });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filterStatus) params.set("status", filterStatus);
    if (filterPriority) params.set("priority", filterPriority);
    fetch(`/api/crm/followups?${params}`)
      .then((r) => r.json())
      .then((d) => { setFollowups(d.followups || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filterStatus, filterPriority]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleComplete = async (id: number) => {
    await fetch(`/api/crm/followups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed", completedAt: new Date().toISOString() }),
    });
    fetchData();
  };

  const handleCreate = async () => {
    await fetch("/api/crm/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        customerId: form.customerId ? Number(form.customerId) : undefined,
        leadId: form.leadId ? Number(form.leadId) : undefined,
        dueDate: form.dueDate || undefined,
      }),
    });
    setShowModal(false);
    setForm({ title: "", taskType: "call", dueDate: "", memo: "", priority: "normal", customerId: "", leadId: "" });
    fetchData();
  };

  const isOverdue = (f: Followup) => f.dueDate && f.status !== "completed" && new Date(f.dueDate) < new Date();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, color: "#555" }}>
            <option value="">상태 전체</option>
            <option value="pending">대기</option>
            <option value="completed">완료</option>
          </select>
          <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, color: "#555" }}>
            <option value="">우선순위 전체</option>
            {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>일정 등록</button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
              {["제목", "고객", "유형", "담당자", "상태", "마감일", "우선순위", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#999" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>로딩 중...</td></tr>
            ) : followups.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>후속 일정이 없습니다.</td></tr>
            ) : followups.map((f) => (
              <tr key={f.id} style={{ borderBottom: "1px solid #f3f4f6", background: isOverdue(f) ? "#fff5f5" : "transparent" }}>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: isOverdue(f) ? "#ef4444" : "#111" }}>{f.title}</td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{f.customer?.name || f.lead?.customerName || "-"}</td>
                <td style={{ padding: "10px 14px" }}><span style={badge(taskTypeLabels[f.taskType] || f.taskType, "#ede9fe", "#7c3aed")}>{taskTypeLabels[f.taskType] || f.taskType}</span></td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{f.assignee?.name || "-"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={badge(f.status === "completed" ? "완료" : "대기", f.status === "completed" ? "#dcfce7" : "#fef3c7", f.status === "completed" ? "#16a34a" : "#d97706")}>{f.status === "completed" ? "완료" : "대기"}</span>
                </td>
                <td style={{ padding: "10px 14px", color: isOverdue(f) ? "#ef4444" : "#555", fontWeight: isOverdue(f) ? 600 : 400 }}>
                  {f.dueDate ? new Date(f.dueDate).toLocaleDateString("ko-KR") : "-"}
                  {isOverdue(f) && <span style={{ fontSize: 11, marginLeft: 4 }}>지남</span>}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: priorityColors[f.priority] || "#ccc", marginRight: 6 }} />
                  <span style={{ fontSize: 12, color: "#666" }}>{priorityLabels[f.priority] || f.priority}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {f.status !== "completed" && (
                    <button onClick={() => handleComplete(f.id)} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#10b981", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>완료</button>
                  )}
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
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 20, marginTop: 0 }}>일정 등록</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>제목 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>유형</label>
                  <select value={form.taskType} onChange={(e) => setForm({ ...form, taskType: e.target.value })} style={inputStyle}>
                    {Object.entries(taskTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>우선순위</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
                    {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>마감일</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inputStyle} />
              </div>
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
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>메모</label>
                <textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#666", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>취소</button>
              <button onClick={handleCreate} disabled={!form.title} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: form.title ? 1 : 0.5 }}>등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
