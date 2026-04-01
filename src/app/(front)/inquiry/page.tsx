"use client";

import { useEffect, useState, FormEvent } from "react";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "1px solid #e5e8eb",
  borderRadius: 12,
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  color: "#191f28",
  background: "#fff",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 500,
  color: "#333d4b",
  marginBottom: 8,
};

const BTN_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  fontSize: 16,
  fontWeight: 600,
  color: "#fff",
  background: "#191f28",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontFamily: "inherit",
};

function addFocusHandlers(el: HTMLInputElement | HTMLTextAreaElement | null) {
  if (!el) return;
  el.onfocus = () => { el.style.borderColor = "#3182f6"; };
  el.onblur = () => { el.style.borderColor = "#e5e8eb"; };
}

export default function InquiryPage() {
  const [topHtml, setTopHtml] = useState<string[]>([]);
  const [bottomHtml, setBottomHtml] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/front/fixed-sections")
      .then((r) => r.json())
      .then((d) => { setTopHtml(d.top || []); setBottomHtml(d.bottom || []); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "문의 등록에 실패했습니다.");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {topHtml.map((h, i) => <div key={`t${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}

      <div style={{ background: "#fff", minHeight: "60vh", fontFamily: "'Pretendard',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "60px 24px 80px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#191f28", margin: 0, letterSpacing: "-0.5px" }}>문의하기</h1>
            <p style={{ fontSize: 15, color: "#8b95a1", marginTop: 8, lineHeight: 1.5 }}>궁금한 사항을 남겨주시면 답변드리겠습니다</p>
          </div>

          {success ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#e8f3ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M10 18L16 24L26 12" stroke="#3182f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#191f28", margin: 0 }}>문의가 접수되었습니다</h2>
              <p style={{ fontSize: 15, color: "#8b95a1", marginTop: 12, lineHeight: 1.5 }}>빠른 시일 내에 답변드리겠습니다.</p>
              <a href="/" style={{
                display: "inline-block",
                marginTop: 32,
                padding: "14px 40px",
                fontSize: 15,
                fontWeight: 600,
                color: "#fff",
                background: "#191f28",
                borderRadius: 12,
                textDecoration: "none",
              }}>홈으로</a>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ padding: "12px 16px", background: "#fff0f0", borderRadius: 10, fontSize: 14, color: "#f04452", marginBottom: 20 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={LABEL_STYLE}>성함 <span style={{ color: "#f04452" }}>*</span></label>
                  <input ref={addFocusHandlers} type="text" style={INPUT_STYLE} value={name} onChange={(e) => setName(e.target.value)} required placeholder="이름을 입력하세요" />
                </div>

                <div>
                  <label style={LABEL_STYLE}>연락처 <span style={{ color: "#f04452" }}>*</span></label>
                  <input ref={addFocusHandlers} type="tel" style={INPUT_STYLE} value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="010-0000-0000" />
                </div>

                <div>
                  <label style={LABEL_STYLE}>이메일</label>
                  <input ref={addFocusHandlers} type="email" style={INPUT_STYLE} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
                </div>

                <div>
                  <label style={LABEL_STYLE}>문의 내용 <span style={{ color: "#f04452" }}>*</span></label>
                  <textarea
                    ref={addFocusHandlers}
                    style={{ ...INPUT_STYLE, minHeight: 160, resize: "vertical" }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    placeholder="문의 내용을 입력하세요"
                  />
                </div>

                <button type="submit" disabled={submitting} style={{ ...BTN_STYLE, marginTop: 8, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "접수 중..." : "문의하기"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {bottomHtml.map((h, i) => <div key={`b${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}
    </>
  );
}
