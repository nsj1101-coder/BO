"use client";

import { useEffect, useState } from "react";

export default function RegisterCompletePage() {
  const [topHtml, setTopHtml] = useState<string[]>([]);
  const [bottomHtml, setBottomHtml] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/front/fixed-sections")
      .then((r) => r.json())
      .then((d) => { setTopHtml(d.top || []); setBottomHtml(d.bottom || []); })
      .catch(() => {});
  }, []);

  return (
    <>
      {topHtml.map((h, i) => <div key={`t${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}

      <div style={{ background: "#fff", minHeight: "60vh", fontFamily: "'Pretendard',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
        <div style={{ maxWidth: 440, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#e8f3ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M10 18L16 24L26 12" stroke="#3182f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#191f28", margin: 0, letterSpacing: "-0.5px" }}>
            회원가입이 완료되었습니다
          </h1>
          <p style={{ fontSize: 15, color: "#8b95a1", marginTop: 12, lineHeight: 1.5 }}>
            환영합니다! 이제 로그인하여 서비스를 이용하실 수 있습니다.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 40, maxWidth: 320, margin: "40px auto 0" }}>
            <a
              href="/user-login"
              style={{
                display: "block",
                width: "100%",
                padding: "16px",
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                background: "#191f28",
                border: "none",
                borderRadius: 12,
                textAlign: "center",
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              로그인하기
            </a>
            <a
              href="/"
              style={{
                display: "block",
                width: "100%",
                padding: "16px",
                fontSize: 16,
                fontWeight: 600,
                color: "#4e5968",
                background: "#f2f4f6",
                border: "none",
                borderRadius: 12,
                textAlign: "center",
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              홈으로
            </a>
          </div>
        </div>
      </div>

      {bottomHtml.map((h, i) => <div key={`b${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}
    </>
  );
}
