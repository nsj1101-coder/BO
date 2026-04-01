"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

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

function addFocusHandlers(el: HTMLInputElement | null) {
  if (!el) return;
  el.onfocus = () => { el.style.borderColor = "#3182f6"; };
  el.onblur = () => { el.style.borderColor = "#e5e8eb"; };
}

export default function UserLoginPage() {
  const router = useRouter();
  const [topHtml, setTopHtml] = useState<string[]>([]);
  const [bottomHtml, setBottomHtml] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      const res = await fetch("/api/auth/user-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "로그인에 실패했습니다.");
      }
      router.push("/");
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
        <div style={{ maxWidth: 400, margin: "0 auto", padding: "80px 24px 80px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#191f28", margin: 0, letterSpacing: "-0.5px" }}>로그인</h1>
            <p style={{ fontSize: 15, color: "#8b95a1", marginTop: 8, lineHeight: 1.5 }}>이메일과 비밀번호를 입력하세요</p>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: "#fff0f0", borderRadius: 10, fontSize: 14, color: "#f04452", marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#333d4b", marginBottom: 8 }}>이메일</label>
              <input ref={addFocusHandlers} type="email" style={INPUT_STYLE} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@email.com" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#333d4b", marginBottom: 8 }}>비밀번호</label>
              <input ref={addFocusHandlers} type="password" style={INPUT_STYLE} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="비밀번호를 입력하세요" />
            </div>

            <button type="submit" disabled={submitting} style={{ ...BTN_STYLE, marginTop: 8, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#8b95a1" }}>
            아직 회원이 아니신가요?{" "}
            <a href="/register" style={{ color: "#3182f6", fontWeight: 500, textDecoration: "none" }}>회원가입</a>
          </p>
        </div>
      </div>

      {bottomHtml.map((h, i) => <div key={`b${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}
    </>
  );
}
