"use client";

import { useEffect, useState, useCallback } from "react";

interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openId, setOpenId] = useState<number | null>(null);
  const [topHtml, setTopHtml] = useState<string[]>([]);
  const [bottomHtml, setBottomHtml] = useState<string[]>([]);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/faqs");
    const data: Faq[] = await res.json();
    setFaqs(data.filter((f) => f.isActive));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFaqs();
    fetch("/api/front/fixed-sections").then((r) => r.json()).then((d) => { setTopHtml(d.top || []); setBottomHtml(d.bottom || []); }).catch(() => {});
  }, [fetchFaqs]);

  const categories = ["전체", ...Array.from(new Set(faqs.map((f) => f.category)))];
  const filtered = activeCategory === "전체" ? faqs : faqs.filter((f) => f.category === activeCategory);

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 32, height: 32, border: "3px solid #3182f6", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  }

  return (
    <>
    {topHtml.map((h, i) => <div key={`t${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}

    <div style={{ background: "#fff", minHeight: "60vh", fontFamily: "'Pretendard',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      {/* Hero */}
      <div style={{ padding: "80px 24px 48px", textAlign: "center" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#191f28", margin: 0, letterSpacing: "-0.5px" }}>자주 묻는 질문</h1>
        <p style={{ fontSize: 16, color: "#8b95a1", marginTop: 12, lineHeight: 1.5 }}>궁금한 점을 빠르게 찾아보세요</p>
      </div>

      {/* Category Tabs */}
      {categories.length > 2 && (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 32px", display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 20px",
                fontSize: 14,
                fontWeight: activeCategory === cat ? 600 : 400,
                color: activeCategory === cat ? "#fff" : "#4e5968",
                background: activeCategory === cat ? "#191f28" : "#f2f4f6",
                border: "none",
                borderRadius: 100,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* FAQ List */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 80px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#b0b8c1", fontSize: 15 }}>등록된 FAQ가 없습니다.</div>
        ) : (
          <div>
            {filtered.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div key={faq.id} style={{ borderBottom: "1px solid #f2f4f6" }}>
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "24px 0",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      gap: 16,
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 500, color: "#333d4b", lineHeight: 1.5, flex: 1 }}>{faq.question}</span>
                    <svg
                      width="20" height="20" viewBox="0 0 20 20" fill="none"
                      style={{ flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}
                    >
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="#b0b8c1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div
                    style={{
                      maxHeight: isOpen ? 500 : 0,
                      overflow: "hidden",
                      transition: "max-height 0.3s ease",
                    }}
                  >
                    <div style={{ padding: "0 0 24px", fontSize: 15, color: "#6b7684", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {bottomHtml.map((h, i) => <div key={`b${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}
    </>
  );
}
