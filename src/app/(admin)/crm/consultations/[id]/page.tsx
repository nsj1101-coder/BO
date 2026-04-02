"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Consultation {
  id: number;
  consultType: string;
  content: string;
  summary: string;
  needs: string;
  budget: string;
  desiredDate: string;
  requestedService: string;
  result: string;
  failReason: string;
  nextAction: string;
  createdAt: string;
  customer?: { id: number; name: string; phone: string; email: string } | null;
  lead?: { id: number; customerName: string } | null;
  assignee?: { id: number; name: string } | null;
}

const ACCENT = "#4332f8";
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 };

const consultTypeLabels: Record<string, string> = { phone: "전화", visit: "방문", online: "온라인", email: "이메일", chat: "채팅" };
const resultLabels: Record<string, string> = { pending: "대기", positive: "긍정", negative: "부정", followup: "후속필요", closed: "종결" };
const resultColors: Record<string, string> = { pending: "#f59e0b", positive: "#10b981", negative: "#ef4444", followup: "#6366f1", closed: "#6b7280" };

export default function ConsultationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Consultation>>({});

  const fetchData = useCallback(() => {
    fetch(`/api/crm/consultations/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setForm(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    await fetch(`/api/crm/consultations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultType: form.consultType,
        content: form.content,
        summary: form.summary,
        needs: form.needs,
        budget: form.budget,
        desiredDate: form.desiredDate,
        requestedService: form.requestedService,
        result: form.result,
        failReason: form.failReason,
        nextAction: form.nextAction,
      }),
    });
    setEditing(false);
    fetchData();
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div style={{ width: 32, height: 32, border: `3px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#ccc" }}>상담 기록을 찾을 수 없습니다.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#999", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 18 }}>&larr;</span> 목록으로
        </button>
        <button onClick={() => setEditing(!editing)} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: ACCENT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{editing ? "취소" : "편집"}</button>
      </div>

      {/* Customer Info */}
      {data.customer && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 12 }}>고객 정보</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div><span style={labelStyle}>이름</span><span style={{ fontSize: 14, color: "#111", cursor: "pointer", textDecoration: "underline" }} onClick={() => router.push(`/crm/customers/${data.customer!.id}`)}>{data.customer.name}</span></div>
            <div><span style={labelStyle}>연락처</span><span style={{ fontSize: 14, color: "#111" }}>{data.customer.phone}</span></div>
            <div><span style={labelStyle}>이메일</span><span style={{ fontSize: 14, color: "#111" }}>{data.customer.email}</span></div>
          </div>
        </div>
      )}

      {/* Consultation Content */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>상담 내용</div>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>상담유형</label>
                <select value={form.consultType || ""} onChange={(e) => setForm({ ...form, consultType: e.target.value })} style={inputStyle}>
                  {Object.entries(consultTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>결과</label>
                <select value={form.result || ""} onChange={(e) => setForm({ ...form, result: e.target.value })} style={inputStyle}>
                  {Object.entries(resultLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>내용</label>
              <textarea value={form.content || ""} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={labelStyle}>요약</label>
              <textarea value={form.summary || ""} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>니즈</label><input value={form.needs || ""} onChange={(e) => setForm({ ...form, needs: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>예산</label><input value={form.budget || ""} onChange={(e) => setForm({ ...form, budget: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>희망일</label><input value={form.desiredDate || ""} onChange={(e) => setForm({ ...form, desiredDate: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>요청 서비스</label><input value={form.requestedService || ""} onChange={(e) => setForm({ ...form, requestedService: e.target.value })} style={inputStyle} /></div>
            </div>
            {form.result === "negative" && (
              <div><label style={labelStyle}>실패 사유</label><input value={form.failReason || ""} onChange={(e) => setForm({ ...form, failReason: e.target.value })} style={inputStyle} /></div>
            )}
            <div><label style={labelStyle}>다음 액션</label><input value={form.nextAction || ""} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} style={inputStyle} /></div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleSave} style={{ padding: "8px 24px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>저장</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <span style={labelStyle}>유형</span>
                <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: "#ede9fe", color: "#7c3aed" }}>{consultTypeLabels[data.consultType] || data.consultType}</span>
              </div>
              <div>
                <span style={labelStyle}>결과</span>
                <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: `${resultColors[data.result] || "#666"}18`, color: resultColors[data.result] || "#666" }}>{resultLabels[data.result] || data.result}</span>
              </div>
              <div>
                <span style={labelStyle}>상담일</span>
                <span style={{ fontSize: 14, color: "#111" }}>{new Date(data.createdAt).toLocaleString("ko-KR")}</span>
              </div>
            </div>
            <div>
              <span style={labelStyle}>내용</span>
              <div style={{ fontSize: 14, color: "#333", lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#fafafa", padding: 16, borderRadius: 10 }}>{data.content || "-"}</div>
            </div>
            <div>
              <span style={labelStyle}>요약</span>
              <div style={{ fontSize: 14, color: "#333" }}>{data.summary || "-"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div><span style={labelStyle}>니즈</span><span style={{ fontSize: 14, color: "#333" }}>{data.needs || "-"}</span></div>
              <div><span style={labelStyle}>예산</span><span style={{ fontSize: 14, color: "#333" }}>{data.budget || "-"}</span></div>
              <div><span style={labelStyle}>희망일</span><span style={{ fontSize: 14, color: "#333" }}>{data.desiredDate || "-"}</span></div>
              <div><span style={labelStyle}>요청 서비스</span><span style={{ fontSize: 14, color: "#333" }}>{data.requestedService || "-"}</span></div>
            </div>
            {data.failReason && <div><span style={labelStyle}>실패 사유</span><span style={{ fontSize: 14, color: "#ef4444" }}>{data.failReason}</span></div>}
            {data.nextAction && <div><span style={labelStyle}>다음 액션</span><span style={{ fontSize: 14, color: "#333" }}>{data.nextAction}</span></div>}
            {data.assignee && <div><span style={labelStyle}>담당자</span><span style={{ fontSize: 14, color: "#333" }}>{data.assignee.name}</span></div>}
          </div>
        )}
      </div>
    </div>
  );
}
