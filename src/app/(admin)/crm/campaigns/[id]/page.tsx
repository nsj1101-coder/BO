"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Campaign {
  id: number;
  name: string;
  campaignType: string;
  status: string;
  targetSegment: string;
  content: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  convertCount: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

const ACCENT = "#4332f8";
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 };

const typeLabels: Record<string, string> = { email: "이메일", sms: "SMS", push: "푸시", kakao: "카카오" };
const statusLabels: Record<string, string> = { draft: "초안", scheduled: "예약", sending: "발송중", sent: "발송완료", cancelled: "취소" };

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Campaign>>({});

  const fetchData = useCallback(() => {
    fetch(`/api/crm/campaigns/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setForm(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    await fetch(`/api/crm/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        campaignType: form.campaignType,
        targetSegment: form.targetSegment,
        content: form.content,
        status: form.status,
      }),
    });
    setEditing(false);
    fetchData();
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div style={{ width: 32, height: 32, border: `3px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#ccc" }}>캠페인을 찾을 수 없습니다.</div>;

  const pct = (num: number, denom: number) => denom > 0 ? ((num / denom) * 100).toFixed(1) : "0";

  const statCards = [
    { label: "발송수", value: data.sentCount.toLocaleString(), sub: "", color: ACCENT },
    { label: "오픈", value: data.openCount.toLocaleString(), sub: `${pct(data.openCount, data.sentCount)}%`, color: "#10b981" },
    { label: "클릭", value: data.clickCount.toLocaleString(), sub: `${pct(data.clickCount, data.sentCount)}%`, color: "#f59e0b" },
    { label: "전환", value: data.convertCount.toLocaleString(), sub: `${pct(data.convertCount, data.sentCount)}%`, color: "#ec4899" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#999", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 18 }}>&larr;</span> 목록으로
        </button>
        <button onClick={() => setEditing(!editing)} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: ACCENT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{editing ? "취소" : "편집"}</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
        {statCards.map((s) => (
          <div key={s.label} style={cardStyle}>
            <div style={{ fontSize: 13, color: "#888", fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Campaign Info */}
      <div style={cardStyle}>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>캠페인명</label>
              <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>유형</label>
                <select value={form.campaignType || "email"} onChange={(e) => setForm({ ...form, campaignType: e.target.value })} style={inputStyle}>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>상태</label>
                <select value={form.status || "draft"} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>대상 세그먼트</label>
              <input value={form.targetSegment || ""} onChange={(e) => setForm({ ...form, targetSegment: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>내용</label>
              <textarea value={form.content || ""} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleSave} style={{ padding: "8px 24px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>저장</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>{data.name}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div><span style={labelStyle}>유형</span><span style={{ fontSize: 14, color: "#333" }}>{typeLabels[data.campaignType] || data.campaignType}</span></div>
              <div><span style={labelStyle}>상태</span><span style={{ fontSize: 14, color: "#333" }}>{statusLabels[data.status] || data.status}</span></div>
              <div><span style={labelStyle}>대상</span><span style={{ fontSize: 14, color: "#333" }}>{data.targetSegment || "-"}</span></div>
              <div><span style={labelStyle}>생성일</span><span style={{ fontSize: 14, color: "#333" }}>{new Date(data.createdAt).toLocaleString("ko-KR")}</span></div>
              {data.scheduledAt && <div><span style={labelStyle}>예약일</span><span style={{ fontSize: 14, color: "#333" }}>{new Date(data.scheduledAt).toLocaleString("ko-KR")}</span></div>}
              {data.sentAt && <div><span style={labelStyle}>발송일</span><span style={{ fontSize: 14, color: "#333" }}>{new Date(data.sentAt).toLocaleString("ko-KR")}</span></div>}
            </div>
            {data.content && (
              <div>
                <span style={labelStyle}>내용</span>
                <div style={{ fontSize: 14, color: "#333", lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#fafafa", padding: 16, borderRadius: 10, marginTop: 4 }}>{data.content}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
