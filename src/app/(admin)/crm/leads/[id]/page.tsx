"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Lead {
  id: number;
  leadType: string;
  customerName: string;
  phone: string;
  email: string;
  companyName: string;
  content: string;
  statusCode: string;
  priority: string;
  assigneeId: number | null;
  customerId: number | null;
  nextActionDate: string | null;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  landingPageUrl: string;
  referrerUrl: string;
  createdAt: string;
  assignee?: { id: number; name: string } | null;
  customer?: { id: number; name: string } | null;
}

interface StatusCode {
  code: string;
  label: string;
  color: string;
}

interface Assignee {
  id: number;
  name: string;
}

interface Consultation {
  id: number;
  consultType: string;
  summary: string;
  result: string;
  createdAt: string;
  assignee?: { name: string } | null;
}

interface Followup {
  id: number;
  title: string;
  taskType: string;
  status: string;
  dueDate: string | null;
  assignee?: { name: string } | null;
}

interface StatusHistory {
  id: number;
  fromStatus: string;
  toStatus: string;
  memo: string;
  createdAt: string;
}

const ACCENT = "#4332f8";
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 };
const valStyle: React.CSSProperties = { fontSize: 14, color: "#111", fontWeight: 500 };

const consultTypeLabels: Record<string, string> = { phone: "전화", visit: "방문", online: "온라인", email: "이메일", chat: "채팅" };
const resultLabels: Record<string, string> = { pending: "대기", positive: "긍정", negative: "부정", followup: "후속필요", closed: "종결" };
const resultColors: Record<string, string> = { pending: "#f59e0b", positive: "#10b981", negative: "#ef4444", followup: "#6366f1", closed: "#6b7280" };

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [statusCodes, setStatusCodes] = useState<StatusCode[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [activeTab, setActiveTab] = useState("consultations");
  const [loading, setLoading] = useState(true);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [consultForm, setConsultForm] = useState({ consultType: "phone", content: "", summary: "", result: "pending" });
  const [followupForm, setFollowupForm] = useState({ title: "", taskType: "call", dueDate: "", memo: "" });
  const [memo, setMemo] = useState("");

  const fetchLead = useCallback(() => {
    fetch(`/api/crm/leads/${id}`)
      .then((r) => r.json())
      .then((d) => { setLead(d); setMemo(d.content || ""); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchLead();
    fetch("/api/crm/status-codes").then((r) => r.json()).then((d) => setStatusCodes(d.statusCodes || d || [])).catch(() => {});
    fetch("/api/crm/assignees").then((r) => r.json()).then((d) => setAssignees(d.assignees || d || [])).catch(() => {});
    fetch(`/api/crm/leads/${id}/consultations`).then((r) => r.json()).then((d) => setConsultations(d.consultations || d || [])).catch(() => {});
    fetch(`/api/crm/leads/${id}/followups`).then((r) => r.json()).then((d) => setFollowups(d.followups || d || [])).catch(() => {});
    fetch(`/api/crm/leads/${id}/status-history`).then((r) => r.json()).then((d) => setStatusHistory(d.history || d || [])).catch(() => {});
  }, [fetchLead, id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!lead || lead.statusCode === newStatus) return;
    await fetch(`/api/crm/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusCode: newStatus, _statusChange: { fromStatus: lead.statusCode, toStatus: newStatus } }),
    });
    fetchLead();
    fetch(`/api/crm/leads/${id}/status-history`).then((r) => r.json()).then((d) => setStatusHistory(d.history || d || [])).catch(() => {});
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    await fetch(`/api/crm/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: assigneeId ? Number(assigneeId) : null }),
    });
    fetchLead();
  };

  const handlePriorityChange = async (priority: string) => {
    await fetch(`/api/crm/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    fetchLead();
  };

  const handleCreateCustomer = async () => {
    if (!lead) return;
    const res = await fetch("/api/crm/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: lead.customerName, phone: lead.phone, email: lead.email, companyName: lead.companyName }),
    });
    const customer = await res.json();
    await fetch(`/api/crm/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: customer.id }),
    });
    fetchLead();
  };

  const handleAddConsultation = async () => {
    await fetch("/api/crm/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...consultForm, leadId: Number(id), customerId: lead?.customerId }),
    });
    setShowConsultModal(false);
    setConsultForm({ consultType: "phone", content: "", summary: "", result: "pending" });
    fetch(`/api/crm/leads/${id}/consultations`).then((r) => r.json()).then((d) => setConsultations(d.consultations || d || [])).catch(() => {});
  };

  const handleAddFollowup = async () => {
    await fetch("/api/crm/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...followupForm, leadId: Number(id), customerId: lead?.customerId, dueDate: followupForm.dueDate || undefined }),
    });
    setShowFollowupModal(false);
    setFollowupForm({ title: "", taskType: "call", dueDate: "", memo: "" });
    fetch(`/api/crm/leads/${id}/followups`).then((r) => r.json()).then((d) => setFollowups(d.followups || d || [])).catch(() => {});
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div style={{ width: 32, height: 32, border: `3px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;
  if (!lead) return <div style={{ padding: 40, textAlign: "center", color: "#ccc" }}>리드를 찾을 수 없습니다.</div>;

  const tabs = [
    { key: "consultations", label: "상담이력", count: consultations.length },
    { key: "followups", label: "후속일정", count: followups.length },
    { key: "history", label: "상태변경이력", count: statusHistory.length },
    { key: "memo", label: "메모" },
  ];

  return (
    <div style={{ display: "flex", gap: 24 }}>
      {/* Left Panel */}
      <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{lead.customerName}</span>
            {lead.customerId ? (
              <button onClick={() => router.push(`/crm/customers/${lead.customerId}`)} style={{ fontSize: 12, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>고객카드 보기</button>
            ) : (
              <button onClick={handleCreateCustomer} style={{ fontSize: 12, color: "#fff", background: ACCENT, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>고객 카드 생성</button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><span style={labelStyle}>연락처</span><span style={valStyle}>{lead.phone || "-"}</span></div>
            <div><span style={labelStyle}>이메일</span><span style={valStyle}>{lead.email || "-"}</span></div>
            <div><span style={labelStyle}>회사명</span><span style={valStyle}>{lead.companyName || "-"}</span></div>
            <div><span style={labelStyle}>접수일</span><span style={valStyle}>{new Date(lead.createdAt).toLocaleString("ko-KR")}</span></div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <span style={labelStyle}>상태</span>
              <select value={lead.statusCode} onChange={(e) => handleStatusChange(e.target.value)} style={{ ...inputStyle, fontWeight: 600 }}>
                {statusCodes.map((sc) => <option key={sc.code} value={sc.code}>{sc.label}</option>)}
                {statusCodes.length === 0 && <option value={lead.statusCode}>{lead.statusCode}</option>}
              </select>
            </div>
            <div>
              <span style={labelStyle}>담당자</span>
              <select value={lead.assigneeId ?? ""} onChange={(e) => handleAssigneeChange(e.target.value)} style={inputStyle}>
                <option value="">미배정</option>
                {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <span style={labelStyle}>우선순위</span>
              <select value={lead.priority} onChange={(e) => handlePriorityChange(e.target.value)} style={inputStyle}>
                <option value="low">낮음</option>
                <option value="normal">보통</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
            </div>
            <div><span style={labelStyle}>다음 액션일</span><span style={valStyle}>{lead.nextActionDate ? new Date(lead.nextActionDate).toLocaleDateString("ko-KR") : "-"}</span></div>
          </div>
        </div>

        {(lead.utmSource || lead.utmMedium || lead.utmCampaign || lead.landingPageUrl) && (
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 12 }}>UTM 정보</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lead.utmSource && <div><span style={labelStyle}>Source</span><span style={valStyle}>{lead.utmSource}</span></div>}
              {lead.utmMedium && <div><span style={labelStyle}>Medium</span><span style={valStyle}>{lead.utmMedium}</span></div>}
              {lead.utmCampaign && <div><span style={labelStyle}>Campaign</span><span style={valStyle}>{lead.utmCampaign}</span></div>}
              {lead.landingPageUrl && <div><span style={labelStyle}>Landing</span><span style={{ ...valStyle, fontSize: 12, wordBreak: "break-all" }}>{lead.landingPageUrl}</span></div>}
              {lead.referrerUrl && <div><span style={labelStyle}>Referrer</span><span style={{ ...valStyle, fontSize: 12, wordBreak: "break-all" }}>{lead.referrerUrl}</span></div>}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowConsultModal(true)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>상담 등록</button>
          <button onClick={() => setShowFollowupModal(true)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#333", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>후속 일정 등록</button>
        </div>

        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e7eb", paddingBottom: 0 }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: "10px 16px", border: "none", borderBottom: activeTab === t.key ? `2px solid ${ACCENT}` : "2px solid transparent", background: "none", color: activeTab === t.key ? ACCENT : "#999", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {t.label}{t.count !== undefined && <span style={{ marginLeft: 4, fontSize: 12, color: "#bbb" }}>{t.count}</span>}
            </button>
          ))}
        </div>

        <div style={cardStyle}>
          {activeTab === "consultations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {consultations.length === 0 && <div style={{ color: "#ccc", fontSize: 13, padding: 20, textAlign: "center" }}>상담 이력이 없습니다.</div>}
              {consultations.map((c) => (
                <div key={c.id} style={{ padding: 16, border: "1px solid #f3f4f6", borderRadius: 12, cursor: "pointer" }} onClick={() => router.push(`/crm/consultations/${c.id}`)}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 100, background: "#ede9fe", color: "#7c3aed", fontSize: 12, fontWeight: 600 }}>{consultTypeLabels[c.consultType] || c.consultType}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 100, background: `${resultColors[c.result] || "#666"}18`, color: resultColors[c.result] || "#666", fontSize: 12, fontWeight: 600 }}>{resultLabels[c.result] || c.result}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#bbb" }}>{new Date(c.createdAt).toLocaleString("ko-KR")}</span>
                  </div>
                  <div style={{ fontSize: 14, color: "#333" }}>{c.summary || "(요약 없음)"}</div>
                  {c.assignee && <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>담당: {c.assignee.name}</div>}
                </div>
              ))}
            </div>
          )}

          {activeTab === "followups" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {followups.length === 0 && <div style={{ color: "#ccc", fontSize: 13, padding: 20, textAlign: "center" }}>후속 일정이 없습니다.</div>}
              {followups.map((f) => {
                const overdue = f.dueDate && f.status !== "completed" && new Date(f.dueDate) < new Date();
                return (
                  <div key={f.id} style={{ padding: 16, border: `1px solid ${overdue ? "#fecaca" : "#f3f4f6"}`, borderRadius: 12, background: overdue ? "#fff5f5" : "transparent" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: "#111" }}>{f.title}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: f.status === "completed" ? "#dcfce7" : "#fef3c7", color: f.status === "completed" ? "#16a34a" : "#d97706" }}>{f.status === "completed" ? "완료" : "대기"}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#666" }}>
                      {f.taskType} {f.dueDate && `| 마감: ${new Date(f.dueDate).toLocaleDateString("ko-KR")}`} {f.assignee && `| ${f.assignee.name}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {statusHistory.length === 0 && <div style={{ color: "#ccc", fontSize: 13, padding: 20, textAlign: "center" }}>변경 이력이 없습니다.</div>}
              {statusHistory.map((h) => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 12, color: "#bbb", width: 140, flexShrink: 0 }}>{new Date(h.createdAt).toLocaleString("ko-KR")}</span>
                  <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 500 }}>{h.fromStatus}</span>
                  <span style={{ color: "#ccc" }}>→</span>
                  <span style={{ fontSize: 13, color: "#10b981", fontWeight: 500 }}>{h.toStatus}</span>
                  {h.memo && <span style={{ fontSize: 12, color: "#999" }}>({h.memo})</span>}
                </div>
              ))}
            </div>
          )}

          {activeTab === "memo" && (
            <div>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={8} style={{ ...inputStyle, resize: "vertical" }} placeholder="메모를 입력하세요..." />
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={async () => { await fetch(`/api/crm/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: memo }) }); }} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>저장</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Consultation Modal */}
      {showConsultModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowConsultModal(false)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", width: 500, background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 20, marginTop: 0 }}>상담 등록</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>상담유형</label>
                <select value={consultForm.consultType} onChange={(e) => setConsultForm({ ...consultForm, consultType: e.target.value })} style={inputStyle}>
                  {Object.entries(consultTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>내용</label>
                <textarea value={consultForm.content} onChange={(e) => setConsultForm({ ...consultForm, content: e.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label style={labelStyle}>요약</label>
                <input value={consultForm.summary} onChange={(e) => setConsultForm({ ...consultForm, summary: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>결과</label>
                <select value={consultForm.result} onChange={(e) => setConsultForm({ ...consultForm, result: e.target.value })} style={inputStyle}>
                  {Object.entries(resultLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
              <button onClick={() => setShowConsultModal(false)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#666", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>취소</button>
              <button onClick={handleAddConsultation} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>등록</button>
            </div>
          </div>
        </div>
      )}

      {/* Followup Modal */}
      {showFollowupModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowFollowupModal(false)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", width: 500, background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 20, marginTop: 0 }}>후속 일정 등록</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>제목 *</label>
                <input value={followupForm.title} onChange={(e) => setFollowupForm({ ...followupForm, title: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>유형</label>
                <select value={followupForm.taskType} onChange={(e) => setFollowupForm({ ...followupForm, taskType: e.target.value })} style={inputStyle}>
                  <option value="call">전화</option>
                  <option value="email">이메일</option>
                  <option value="visit">방문</option>
                  <option value="meeting">미팅</option>
                  <option value="other">기타</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>마감일</label>
                <input type="date" value={followupForm.dueDate} onChange={(e) => setFollowupForm({ ...followupForm, dueDate: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>메모</label>
                <textarea value={followupForm.memo} onChange={(e) => setFollowupForm({ ...followupForm, memo: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
              <button onClick={() => setShowFollowupModal(false)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#666", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>취소</button>
              <button onClick={handleAddFollowup} disabled={!followupForm.title} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: followupForm.title ? 1 : 0.5 }}>등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
