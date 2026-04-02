"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Customer {
  id: number;
  customerType: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  birthOrBizNo: string;
  grade: string;
  tags: string;
  consentSms: boolean;
  consentEmail: boolean;
  currentStatus: string;
  expectedRevenue: number;
  isBlacklisted: boolean;
  memo: string;
  createdAt: string;
}

interface TimelineItem {
  id: number;
  type: "lead" | "consultation" | "followup" | "deal";
  title: string;
  summary: string;
  status: string;
  date: string;
}

const ACCENT = "#4332f8";
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 };

const gradeColors: Record<string, string> = { VIP: "#ef4444", "우수": "#f59e0b", "일반": "#6b7280", "잠재": "#6366f1" };
const typeColors: Record<string, string> = { lead: "#6366f1", consultation: "#10b981", followup: "#f59e0b", deal: "#ec4899" };
const typeLabels: Record<string, string> = { lead: "리드", consultation: "상담", followup: "후속", deal: "딜" };

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [activeTab, setActiveTab] = useState("timeline");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [memo, setMemo] = useState("");

  const fetchCustomer = useCallback(() => {
    fetch(`/api/crm/customers/${id}`)
      .then((r) => r.json())
      .then((d) => { setCustomer(d); setEditForm(d); setMemo(d.memo || ""); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchCustomer();
    fetch(`/api/crm/customers/${id}/timeline`)
      .then((r) => r.json())
      .then((d) => setTimeline(d.timeline || d || []))
      .catch(() => {});
  }, [fetchCustomer, id]);

  const handleSave = async () => {
    await fetch(`/api/crm/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditing(false);
    fetchCustomer();
  };

  const handleSaveMemo = async () => {
    await fetch(`/api/crm/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memo }),
    });
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div style={{ width: 32, height: 32, border: `3px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;
  if (!customer) return <div style={{ padding: 40, textAlign: "center", color: "#ccc" }}>고객을 찾을 수 없습니다.</div>;

  const tags = customer.tags ? customer.tags.split(",").filter(Boolean) : [];

  const tabs = [
    { key: "timeline", label: "타임라인" },
    { key: "leads", label: "리드" },
    { key: "consultations", label: "상담" },
    { key: "followups", label: "후속일정" },
    { key: "deals", label: "딜/계약" },
    { key: "memo", label: "메모" },
  ];

  const filteredTimeline = activeTab === "timeline"
    ? timeline
    : activeTab === "memo"
      ? []
      : timeline.filter((t) => {
          if (activeTab === "leads") return t.type === "lead";
          if (activeTab === "consultations") return t.type === "consultation";
          if (activeTab === "followups") return t.type === "followup";
          if (activeTab === "deals") return t.type === "deal";
          return true;
        });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Customer Info Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: ACCENT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>{customer.name[0]}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>{customer.name}</span>
                <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: `${gradeColors[customer.grade] || "#666"}18`, color: gradeColors[customer.grade] || "#666" }}>{customer.grade}</span>
                <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: "#f3f4f6", color: "#666" }}>{customer.customerType === "individual" ? "개인" : "법인"}</span>
                {customer.isBlacklisted && <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: "#fef2f2", color: "#ef4444" }}>블랙리스트</span>}
              </div>
              {customer.companyName && <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>{customer.companyName}</div>}
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: ACCENT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{editing ? "취소" : "편집"}</button>
        </div>

        {editing ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div><label style={labelStyle}>이름</label><input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>회사명</label><input value={editForm.companyName || ""} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>연락처</label><input value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>이메일</label><input value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>등급</label><select value={editForm.grade || "일반"} onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })} style={inputStyle}>{["VIP", "우수", "일반", "잠재"].map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
            <div><label style={labelStyle}>태그 (쉼표 구분)</label><input value={editForm.tags || ""} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} style={inputStyle} /></div>
            <div style={{ gridColumn: "span 3", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleSave} style={{ padding: "8px 24px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>저장</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20 }}>
            <div><span style={labelStyle}>연락처</span><span style={{ fontSize: 14, color: "#111" }}>{customer.phone || "-"}</span></div>
            <div><span style={labelStyle}>이메일</span><span style={{ fontSize: 14, color: "#111" }}>{customer.email || "-"}</span></div>
            <div><span style={labelStyle}>예상매출</span><span style={{ fontSize: 14, color: "#111" }}>{customer.expectedRevenue ? `${(customer.expectedRevenue / 10000).toLocaleString()}만원` : "-"}</span></div>
            <div><span style={labelStyle}>상태</span><span style={{ fontSize: 14, color: "#111" }}>{customer.currentStatus}</span></div>
            <div style={{ gridColumn: "span 4" }}>
              <span style={labelStyle}>태그</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {tags.length === 0 && <span style={{ fontSize: 13, color: "#ccc" }}>-</span>}
                {tags.map((t) => <span key={t} style={{ padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: "#ede9fe", color: "#7c3aed" }}>{t.trim()}</span>)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e7eb" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: "10px 16px", border: "none", borderBottom: activeTab === t.key ? `2px solid ${ACCENT}` : "2px solid transparent", background: "none", color: activeTab === t.key ? ACCENT : "#999", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "memo" ? (
        <div style={cardStyle}>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={8} style={{ ...inputStyle, resize: "vertical" }} placeholder="메모를 입력하세요..." />
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleSaveMemo} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>저장</button>
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          {filteredTimeline.length === 0 && <div style={{ color: "#ccc", fontSize: 13, padding: 20, textAlign: "center" }}>데이터가 없습니다.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {filteredTimeline.map((item, idx) => (
              <div key={`${item.type}-${item.id}`} style={{ display: "flex", gap: 16, paddingBottom: 20, position: "relative" }}>
                {idx < filteredTimeline.length - 1 && <div style={{ position: "absolute", left: 15, top: 32, bottom: 0, width: 2, background: "#f3f4f6" }} />}
                <div style={{ width: 32, height: 32, borderRadius: 16, background: `${typeColors[item.type]}18`, color: typeColors[item.type], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, zIndex: 1 }}>{typeLabels[item.type]?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111", cursor: "pointer" }} onClick={() => {
                        if (item.type === "lead") router.push(`/crm/leads/${item.id}`);
                        else if (item.type === "consultation") router.push(`/crm/consultations/${item.id}`);
                        else if (item.type === "deal") router.push(`/crm/deals/${item.id}`);
                      }}>{item.title}</span>
                      <span style={{ padding: "1px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: `${typeColors[item.type]}18`, color: typeColors[item.type] }}>{typeLabels[item.type]}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#bbb" }}>{new Date(item.date).toLocaleDateString("ko-KR")}</span>
                  </div>
                  {item.summary && <div style={{ fontSize: 13, color: "#666" }}>{item.summary}</div>}
                  {item.status && <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{item.status}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
