"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Deal {
  id: number;
  title: string;
  stage: string;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  wonLost: string | null;
  lostReason: string;
  memo: string;
  createdAt: string;
  customer?: { id: number; name: string } | null;
  lead?: { id: number; customerName: string } | null;
  assignee?: { id: number; name: string } | null;
  quotes?: { id: number; quoteNumber: string; title: string; totalAmount: number; status: string; validUntil: string | null }[];
  contracts?: { id: number; contractNumber: string; title: string; amount: number; status: string; startDate: string | null; endDate: string | null }[];
}

const ACCENT = "#4332f8";
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };

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

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [lostReason, setLostReason] = useState("");

  const fetchDeal = useCallback(() => {
    fetch(`/api/crm/deals/${id}`)
      .then((r) => r.json())
      .then((d) => { setDeal(d); setLostReason(d.lostReason || ""); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchDeal(); }, [fetchDeal]);

  const handleStageChange = async (stage: string) => {
    await fetch(`/api/crm/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    fetchDeal();
  };

  const handleWonLost = async (result: "won" | "lost") => {
    await fetch(`/api/crm/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wonLost: result,
        stage: result,
        ...(result === "lost" ? { lostReason } : {}),
      }),
    });
    fetchDeal();
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div style={{ width: 32, height: 32, border: `3px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;
  if (!deal) return <div style={{ padding: 40, textAlign: "center", color: "#ccc" }}>딜을 찾을 수 없습니다.</div>;

  const currentStage = stages.find((s) => s.key === deal.stage);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <button onClick={() => router.back()} style={{ alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#999", display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 18 }}>&larr;</span> 목록으로
      </button>

      {/* Deal Info */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 4 }}>{deal.title}</div>
            {deal.customer && (
              <span style={{ fontSize: 14, color: ACCENT, cursor: "pointer" }} onClick={() => router.push(`/crm/customers/${deal.customer!.id}`)}>{deal.customer.name}</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => router.push(`/crm/quotes?dealId=${deal.id}`)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#333", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>견적서 작성</button>
            <button onClick={() => router.push(`/crm/contracts?dealId=${deal.id}`)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>계약서 작성</button>
          </div>
        </div>

        {/* Stage Pipeline */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
          {stages.map((s) => (
            <button
              key={s.key}
              onClick={() => handleStageChange(s.key)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                background: deal.stage === s.key ? s.color : "#f3f4f6",
                color: deal.stage === s.key ? "#fff" : "#999",
                fontSize: 11, fontWeight: 600, transition: "all 0.15s",
              }}
            >{s.label}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20 }}>
          <div>
            <span style={labelStyle}>현재 단계</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: currentStage?.color || "#666" }}>{currentStage?.label || deal.stage}</span>
          </div>
          <div>
            <span style={labelStyle}>금액</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{deal.amount ? `${(deal.amount / 10000).toLocaleString()}만원` : "-"}</span>
          </div>
          <div>
            <span style={labelStyle}>성사확률</span>
            <span style={{ fontSize: 14, color: "#111" }}>{deal.probability}%</span>
          </div>
          <div>
            <span style={labelStyle}>예상 마감일</span>
            <span style={{ fontSize: 14, color: "#111" }}>{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString("ko-KR") : "-"}</span>
          </div>
        </div>
      </div>

      {/* Won/Lost */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>결과 처리</div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>실패 사유 (실패 시)</label>
            <input value={lostReason} onChange={(e) => setLostReason(e.target.value)} style={inputStyle} placeholder="실패 사유를 입력하세요" />
          </div>
          <button onClick={() => handleWonLost("won")} style={{ padding: "8px 24px", borderRadius: 10, border: "none", background: "#10b981", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>성사</button>
          <button onClick={() => handleWonLost("lost")} style={{ padding: "8px 24px", borderRadius: 10, border: "none", background: "#ef4444", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>실패</button>
        </div>
        {deal.wonLost && (
          <div style={{ marginTop: 12, padding: "8px 14px", borderRadius: 8, background: deal.wonLost === "won" ? "#dcfce7" : "#fef2f2", color: deal.wonLost === "won" ? "#16a34a" : "#ef4444", fontSize: 14, fontWeight: 600 }}>
            현재 상태: {deal.wonLost === "won" ? "성사" : "실패"}{deal.lostReason && ` - ${deal.lostReason}`}
          </div>
        )}
      </div>

      {/* Quotes */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>견적서</div>
        {(!deal.quotes || deal.quotes.length === 0) ? (
          <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: 20 }}>연결된 견적서가 없습니다.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                {["견적번호", "제목", "금액", "상태", "유효기간"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#999" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deal.quotes.map((q) => (
                <tr key={q.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 12px", color: ACCENT, fontWeight: 600 }}>{q.quoteNumber}</td>
                  <td style={{ padding: "8px 12px", color: "#333" }}>{q.title}</td>
                  <td style={{ padding: "8px 12px", color: "#333" }}>{q.totalAmount ? `${(q.totalAmount / 10000).toLocaleString()}만` : "-"}</td>
                  <td style={{ padding: "8px 12px" }}><span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: q.status === "sent" ? "#dbeafe" : "#f3f4f6", color: q.status === "sent" ? "#2563eb" : "#666" }}>{q.status}</span></td>
                  <td style={{ padding: "8px 12px", color: "#666" }}>{q.validUntil ? new Date(q.validUntil).toLocaleDateString("ko-KR") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Contracts */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>계약</div>
        {(!deal.contracts || deal.contracts.length === 0) ? (
          <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: 20 }}>연결된 계약이 없습니다.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                {["계약번호", "제목", "금액", "상태", "기간"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#999" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deal.contracts.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 12px", color: ACCENT, fontWeight: 600 }}>{c.contractNumber}</td>
                  <td style={{ padding: "8px 12px", color: "#333" }}>{c.title}</td>
                  <td style={{ padding: "8px 12px", color: "#333" }}>{c.amount ? `${(c.amount / 10000).toLocaleString()}만` : "-"}</td>
                  <td style={{ padding: "8px 12px" }}><span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: c.status === "active" ? "#dcfce7" : "#f3f4f6", color: c.status === "active" ? "#16a34a" : "#666" }}>{c.status}</span></td>
                  <td style={{ padding: "8px 12px", color: "#666", fontSize: 13 }}>
                    {c.startDate ? new Date(c.startDate).toLocaleDateString("ko-KR") : "?"} ~ {c.endDate ? new Date(c.endDate).toLocaleDateString("ko-KR") : "?"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
