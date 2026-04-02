"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Customer {
  id: number;
  customerType: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  grade: string;
  tags: string;
  expectedRevenue: number;
  _count?: { leads: number };
  createdAt: string;
}

const ACCENT = "#4332f8";

const gradeColors: Record<string, string> = {
  VIP: "#ef4444",
  "우수": "#f59e0b",
  "일반": "#6b7280",
  "잠재": "#6366f1",
};

const badge = (label: string, bg: string, color: string): React.CSSProperties => ({
  display: "inline-block", padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: bg, color, whiteSpace: "nowrap",
});

const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };

export default function CrmCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customerType: "individual", name: "", companyName: "", phone: "", email: "", grade: "일반" });

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (filterGrade) params.set("grade", filterGrade);
    fetch(`/api/crm/customers?${params}`)
      .then((r) => r.json())
      .then((d) => { setCustomers(d.customers || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, filterGrade]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleCreate = async () => {
    await fetch("/api/crm/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowModal(false);
    setForm({ customerType: "individual", name: "", companyName: "", phone: "", email: "", grade: "일반" });
    fetchCustomers();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <select value={filterGrade} onChange={(e) => { setFilterGrade(e.target.value); setPage(1); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, color: "#555" }}>
            <option value="">등급 전체</option>
            {["VIP", "우수", "일반", "잠재"].map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <input placeholder="이름, 연락처, 이메일 검색..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchCustomers(); } }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: 260, outline: "none" }} />
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>고객 등록</button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
              {["고객ID", "구분", "이름", "연락처", "이메일", "등급", "리드수", "예상매출", "태그"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#999" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>로딩 중...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>고객이 없습니다.</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} onClick={() => router.push(`/crm/customers/${c.id}`)} style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.1s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; }} onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
                <td style={{ padding: "10px 14px", color: "#999" }}>{c.id}</td>
                <td style={{ padding: "10px 14px" }}><span style={badge(c.customerType === "individual" ? "개인" : "법인", "#f3f4f6", "#555")}>{c.customerType === "individual" ? "개인" : "법인"}</span></td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111" }}>{c.name}</td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{c.phone}</td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{c.email}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={badge(c.grade, `${gradeColors[c.grade] || "#666"}18`, gradeColors[c.grade] || "#666")}>{c.grade}</span>
                </td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{c._count?.leads ?? "-"}</td>
                <td style={{ padding: "10px 14px", color: "#555" }}>{c.expectedRevenue ? `${(c.expectedRevenue / 10000).toLocaleString()}만` : "-"}</td>
                <td style={{ padding: "10px 14px" }}>
                  {c.tags && c.tags.split(",").filter(Boolean).map((t) => (
                    <span key={t} style={{ ...badge(t.trim(), "#ede9fe", "#7c3aed"), marginRight: 4 }}>{t.trim()}</span>
                  ))}
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
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 20, marginTop: 0 }}>고객 등록</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>구분</label>
                <select value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value })} style={inputStyle}>
                  <option value="individual">개인</option>
                  <option value="corporate">법인</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>이름 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>회사명</label>
                <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>연락처</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>이메일</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>등급</label>
                <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} style={inputStyle}>
                  {["VIP", "우수", "일반", "잠재"].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#666", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>취소</button>
              <button onClick={handleCreate} disabled={!form.name} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: form.name ? 1 : 0.5 }}>등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
