"use client";

import { useEffect, useState, useCallback } from "react";

interface Quote {
  id: number;
  quoteNumber: string;
  title: string;
  totalAmount: number;
  status: string;
  validUntil: string | null;
  deal?: { id: number; title: string } | null;
  createdAt: string;
}

interface QuoteItem {
  name: string;
  qty: number;
  price: number;
}

const ACCENT = "#4332f8";
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };

const statusLabels: Record<string, string> = { draft: "초안", sent: "발송", accepted: "수락", rejected: "거절", expired: "만료" };
const statusColors: Record<string, string> = { draft: "#6b7280", sent: "#2563eb", accepted: "#10b981", rejected: "#ef4444", expired: "#f59e0b" };

export default function CrmQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ dealId: "", title: "", validUntil: "" });
  const [items, setItems] = useState<QuoteItem[]>([{ name: "", qty: 1, price: 0 }]);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    fetch(`/api/crm/quotes?${params}`)
      .then((r) => r.json())
      .then((d) => { setQuotes(d.quotes || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalAmount = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  const handleCreate = async () => {
    await fetch("/api/crm/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealId: Number(form.dealId),
        title: form.title,
        items: JSON.stringify(items.filter((i) => i.name)),
        totalAmount,
        validUntil: form.validUntil || undefined,
      }),
    });
    setShowModal(false);
    setForm({ dealId: "", title: "", validUntil: "" });
    setItems([{ name: "", qty: 1, price: 0 }]);
    fetchData();
  };

  const updateItem = (idx: number, field: keyof QuoteItem, value: string | number) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>견적 작성</button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
              {["견적번호", "딜명", "제목", "금액", "상태", "유효기간"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#999" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>로딩 중...</td></tr>
            ) : quotes.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>견적서가 없습니다.</td></tr>
            ) : quotes.map((q) => (
              <tr key={q.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 14px", color: ACCENT, fontWeight: 600 }}>{q.quoteNumber}</td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{q.deal?.title || "-"}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111" }}>{q.title}</td>
                <td style={{ padding: "10px 14px", color: "#333", fontWeight: 600 }}>{q.totalAmount ? `${(q.totalAmount / 10000).toLocaleString()}만` : "-"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: `${statusColors[q.status] || "#666"}18`, color: statusColors[q.status] || "#666" }}>{statusLabels[q.status] || q.status}</span>
                </td>
                <td style={{ padding: "10px 14px", color: "#666" }}>{q.validUntil ? new Date(q.validUntil).toLocaleDateString("ko-KR") : "-"}</td>
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
          <div style={{ position: "relative", width: 600, background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 24px 60px rgba(0,0,0,0.15)", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 20, marginTop: 0 }}>견적 작성</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>딜 ID *</label>
                <input value={form.dealId} onChange={(e) => setForm({ ...form, dealId: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>제목</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>유효기간</label>
                <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} style={inputStyle} />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>항목</label>
                  <button onClick={() => setItems([...items, { name: "", qty: 1, price: 0 }])} style={{ fontSize: 12, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>+ 항목 추가</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 30px", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>품목명</span>
                    <span style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>수량</span>
                    <span style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>단가</span>
                    <span style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>소계</span>
                    <span />
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 30px", gap: 8, alignItems: "center" }}>
                      <input value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)} style={inputStyle} placeholder="품목명" />
                      <input type="number" value={item.qty} onChange={(e) => updateItem(idx, "qty", Number(e.target.value))} style={inputStyle} min="1" />
                      <input type="number" value={item.price} onChange={(e) => updateItem(idx, "price", Number(e.target.value))} style={inputStyle} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{(item.qty * item.price).toLocaleString()}</span>
                      {items.length > 1 && <button onClick={() => setItems(items.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16 }}>&times;</button>}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>합계: {totalAmount.toLocaleString()}원</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#666", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>취소</button>
              <button onClick={handleCreate} disabled={!form.dealId} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: form.dealId ? 1 : 0.5 }}>등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
