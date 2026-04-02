"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Campaign {
  id: number;
  name: string;
  campaignType: string;
  status: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  convertCount: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

const ACCENT = "#4332f8";
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };

const typeLabels: Record<string, string> = { email: "이메일", sms: "SMS", push: "푸시", kakao: "카카오" };
const statusLabels: Record<string, string> = { draft: "초안", scheduled: "예약", sending: "발송중", sent: "발송완료", cancelled: "취소" };
const statusColors: Record<string, string> = { draft: "#6b7280", scheduled: "#f59e0b", sending: "#2563eb", sent: "#10b981", cancelled: "#ef4444" };

export default function CrmCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", campaignType: "email", content: "", targetSegment: "" });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    fetch(`/api/crm/campaigns?${params}`)
      .then((r) => r.json())
      .then((d) => { setCampaigns(d.campaigns || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    await fetch("/api/crm/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ name: "", campaignType: "email", content: "", targetSegment: "" });
    fetchData();
  };

  const pct = (num: number, denom: number) => denom > 0 ? `${((num / denom) * 100).toFixed(1)}%` : "-";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>캠페인 생성</button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
              {["캠페인명", "유형", "상태", "발송수", "오픈율", "클릭율", "전환수"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#999" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>로딩 중...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>캠페인이 없습니다.</td></tr>
            ) : campaigns.map((c) => (
              <tr key={c.id} onClick={() => router.push(`/crm/campaigns/${c.id}`)} style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.1s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; }} onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111" }}>{c.name}</td>
                <td style={{ padding: "10px 14px" }}><span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: "#ede9fe", color: "#7c3aed" }}>{typeLabels[c.campaignType] || c.campaignType}</span></td>
                <td style={{ padding: "10px 14px" }}><span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: `${statusColors[c.status] || "#666"}18`, color: statusColors[c.status] || "#666" }}>{statusLabels[c.status] || c.status}</span></td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{c.sentCount.toLocaleString()}</td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{pct(c.openCount, c.sentCount)}</td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{pct(c.clickCount, c.sentCount)}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: ACCENT }}>{c.convertCount}</td>
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
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 20, marginTop: 0 }}>캠페인 생성</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>캠페인명 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>유형</label>
                <select value={form.campaignType} onChange={(e) => setForm({ ...form, campaignType: e.target.value })} style={inputStyle}>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>대상 세그먼트</label>
                <input value={form.targetSegment} onChange={(e) => setForm({ ...form, targetSegment: e.target.value })} style={inputStyle} placeholder="전체, VIP, 등" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>내용</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#666", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>취소</button>
              <button onClick={handleCreate} disabled={!form.name} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: form.name ? 1 : 0.5 }}>생성</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
