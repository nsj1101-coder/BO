"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Deal {
  id: number;
  title: string;
  stage: string;
  amount: number;
  probability: number;
  customer?: { id: number; name: string } | null;
  assignee?: { id: number; name: string } | null;
  expectedCloseDate: string | null;
}

const ACCENT = "#4332f8";

const stages = [
  { key: "new", label: "신규", color: "#6366f1" },
  { key: "contacted", label: "접촉", color: "#8b5cf6" },
  { key: "consulting", label: "상담중", color: "#a78bfa" },
  { key: "proposal", label: "제안", color: "#f59e0b" },
  { key: "quote_sent", label: "견적발송", color: "#f97316" },
  { key: "negotiation", label: "협상", color: "#ec4899" },
  { key: "review", label: "검토", color: "#14b8a6" },
  { key: "won", label: "성사", color: "#10b981" },
  { key: "lost", label: "실패", color: "#ef4444" },
];

const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };

export default function CrmDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", stage: "new", amount: "", probability: "0", customerId: "", expectedCloseDate: "" });

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/crm/deals")
      .then((r) => r.json())
      .then((d) => setDeals(d.deals || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    await fetch("/api/crm/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        stage: form.stage,
        amount: Number(form.amount) || 0,
        probability: Number(form.probability) || 0,
        customerId: form.customerId ? Number(form.customerId) : undefined,
        expectedCloseDate: form.expectedCloseDate || undefined,
      }),
    });
    setShowModal(false);
    setForm({ title: "", stage: "new", amount: "", probability: "0", customerId: "", expectedCloseDate: "" });
    fetchData();
  };

  const dealsByStage = stages.map((s) => ({
    ...s,
    deals: deals.filter((d) => d.stage === s.key),
  }));

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div style={{ width: 32, height: 32, border: `3px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>딜 등록</button>
      </div>

      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {dealsByStage.map((stage) => (
          <div key={stage.key} style={{ minWidth: 240, width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: `${stage.color}12`, borderRadius: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: stage.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{stage.label}</span>
              <span style={{ fontSize: 12, color: "#999", marginLeft: "auto" }}>{stage.deals.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 100 }}>
              {stage.deals.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "#ddd", fontSize: 12, border: "1px dashed #e5e7eb", borderRadius: 12 }}>비어있음</div>
              )}
              {stage.deals.map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => router.push(`/crm/deals/${deal.id}`)}
                  style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, cursor: "pointer", transition: "box-shadow 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 6 }}>{deal.title}</div>
                  <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>{deal.customer?.name || "-"}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: stage.color }}>{deal.amount ? `${(deal.amount / 10000).toLocaleString()}만` : "-"}</span>
                    <span style={{ fontSize: 12, color: "#999" }}>{deal.probability}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowModal(false)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", width: 480, background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 20, marginTop: 0 }}>딜 등록</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>제목 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>단계</label>
                <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} style={inputStyle}>
                  {stages.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>금액 (원)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>성사확률 (%)</label>
                  <input type="number" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} style={inputStyle} min="0" max="100" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>고객 ID</label>
                <input value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} style={inputStyle} placeholder="선택사항" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>예상 마감일</label>
                <input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} style={inputStyle} />
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
