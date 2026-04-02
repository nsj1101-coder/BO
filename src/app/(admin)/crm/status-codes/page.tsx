"use client";

import { useEffect, useState, useCallback } from "react";

interface StatusCode {
  id: number;
  code: string;
  label: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  isFinal: boolean;
}

const ACCENT = "#4332f8";
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };

export default function CrmStatusCodesPage() {
  const [codes, setCodes] = useState<StatusCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ code: "", label: "", color: "#666666", sortOrder: 0, isDefault: false, isFinal: false });
  const [showAdd, setShowAdd] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/crm/status-codes")
      .then((r) => r.json())
      .then((d) => setCodes((d.statusCodes || d || []).sort((a: StatusCode, b: StatusCode) => a.sortOrder - b.sortOrder)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    await fetch("/api/crm/status-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowAdd(false);
    setForm({ code: "", label: "", color: "#666666", sortOrder: 0, isDefault: false, isFinal: false });
    fetchData();
  };

  const handleUpdate = async (id: number) => {
    const item = codes.find((c) => c.id === id);
    if (!item) return;
    await fetch(`/api/crm/status-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: item.code, label: item.label, color: item.color, sortOrder: item.sortOrder, isDefault: item.isDefault, isFinal: item.isFinal }),
    });
    setEditId(null);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch(`/api/crm/status-codes/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleReorder = async (id: number, direction: "up" | "down") => {
    const idx = codes.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= codes.length) return;
    const updated = [...codes];
    const tempOrder = updated[idx].sortOrder;
    updated[idx].sortOrder = updated[swapIdx].sortOrder;
    updated[swapIdx].sortOrder = tempOrder;
    await Promise.all([
      fetch(`/api/crm/status-codes/${updated[idx].id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: updated[idx].sortOrder }) }),
      fetch(`/api/crm/status-codes/${updated[swapIdx].id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: updated[swapIdx].sortOrder }) }),
    ]);
    fetchData();
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div style={{ width: 32, height: 32, border: `3px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{showAdd ? "취소" : "상태 추가"}</button>
      </div>

      {showAdd && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 60px", gap: 12, alignItems: "end" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>코드</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={inputStyle} placeholder="new" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>라벨</label>
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} style={inputStyle} placeholder="신규" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>색상</label>
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ ...inputStyle, padding: 4, height: 38 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>순서</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555" }}>
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /> 기본값
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555" }}>
              <input type="checkbox" checked={form.isFinal} onChange={(e) => setForm({ ...form, isFinal: e.target.checked })} /> 최종상태
            </label>
            <div style={{ flex: 1 }} />
            <button onClick={handleAdd} disabled={!form.code || !form.label} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: form.code && form.label ? 1 : 0.5 }}>추가</button>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        {codes.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#ccc", fontSize: 13 }}>등록된 상태 코드가 없습니다.</div>
        ) : codes.map((sc) => (
          <div key={sc.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <button onClick={() => handleReorder(sc.id, "up")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#ccc", lineHeight: 1 }}>&#9650;</button>
              <button onClick={() => handleReorder(sc.id, "down")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#ccc", lineHeight: 1 }}>&#9660;</button>
            </div>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: sc.color, flexShrink: 0 }} />
            {editId === sc.id ? (
              <>
                <input value={sc.code} onChange={(e) => setCodes(codes.map((c) => c.id === sc.id ? { ...c, code: e.target.value } : c))} style={{ ...inputStyle, width: 100 }} />
                <input value={sc.label} onChange={(e) => setCodes(codes.map((c) => c.id === sc.id ? { ...c, label: e.target.value } : c))} style={{ ...inputStyle, width: 100 }} />
                <input type="color" value={sc.color} onChange={(e) => setCodes(codes.map((c) => c.id === sc.id ? { ...c, color: e.target.value } : c))} style={{ width: 32, height: 32, border: "none", cursor: "pointer" }} />
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                  <input type="checkbox" checked={sc.isDefault} onChange={(e) => setCodes(codes.map((c) => c.id === sc.id ? { ...c, isDefault: e.target.checked } : c))} /> 기본
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                  <input type="checkbox" checked={sc.isFinal} onChange={(e) => setCodes(codes.map((c) => c.id === sc.id ? { ...c, isFinal: e.target.checked } : c))} /> 최종
                </label>
                <button onClick={() => handleUpdate(sc.id)} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: ACCENT, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>저장</button>
                <button onClick={() => { setEditId(null); fetchData(); }} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer" }}>취소</button>
              </>
            ) : (
              <>
                <span style={{ fontSize: 13, color: "#999", width: 80 }}>{sc.code}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111", flex: 1 }}>{sc.label}</span>
                {sc.isDefault && <span style={{ padding: "1px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "#dbeafe", color: "#2563eb" }}>기본</span>}
                {sc.isFinal && <span style={{ padding: "1px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "#fef3c7", color: "#d97706" }}>최종</span>}
                <span style={{ fontSize: 12, color: "#ccc" }}>#{sc.sortOrder}</span>
                <button onClick={() => setEditId(sc.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: ACCENT, fontWeight: 600 }}>편집</button>
                <button onClick={() => handleDelete(sc.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444", fontWeight: 600 }}>삭제</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
