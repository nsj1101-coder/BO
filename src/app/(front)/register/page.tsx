"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface MemberField {
  id: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  required: boolean;
  options: string[];
  sortOrder: number;
  isActive: boolean;
}

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

function addFocusHandlers(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null) {
  if (!el) return;
  el.onfocus = () => { el.style.borderColor = "#3182f6"; };
  el.onblur = () => { el.style.borderColor = "#e5e8eb"; };
}

function renderDynamicField(
  field: MemberField,
  value: string | string[],
  onChange: (fieldName: string, val: string | string[]) => void,
) {
  const { fieldName, fieldLabel, fieldType, required, options } = field;

  const label = (
    <label style={LABEL_STYLE}>
      {fieldLabel}
      {required && <span style={{ color: "#f04452", marginLeft: 4 }}>*</span>}
    </label>
  );

  switch (fieldType) {
    case "textarea":
      return (
        <div key={fieldName}>
          {label}
          <textarea
            ref={addFocusHandlers}
            style={{ ...INPUT_STYLE, minHeight: 100, resize: "vertical" }}
            value={value as string}
            onChange={(e) => onChange(fieldName, e.target.value)}
            required={required}
          />
        </div>
      );

    case "select":
      return (
        <div key={fieldName}>
          {label}
          <select
            ref={addFocusHandlers}
            style={{ ...INPUT_STYLE, appearance: "none" as const }}
            value={value as string}
            onChange={(e) => onChange(fieldName, e.target.value)}
            required={required}
          >
            <option value="">선택하세요</option>
            {(options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );

    case "checkbox":
      return (
        <div key={fieldName}>
          {label}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {(options || []).map((opt) => {
              const checked = Array.isArray(value) && value.includes(opt);
              return (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#333d4b", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const arr = Array.isArray(value) ? [...value] : [];
                      if (checked) onChange(fieldName, arr.filter((v) => v !== opt));
                      else onChange(fieldName, [...arr, opt]);
                    }}
                    style={{ accentColor: "#3182f6" }}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </div>
      );

    case "radio":
      return (
        <div key={fieldName}>
          {label}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {(options || []).map((opt) => (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#333d4b", cursor: "pointer" }}>
                <input
                  type="radio"
                  name={fieldName}
                  checked={value === opt}
                  onChange={() => onChange(fieldName, opt)}
                  style={{ accentColor: "#3182f6" }}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      );

    default: {
      const inputType = fieldType === "phone" ? "tel" : fieldType === "email" ? "email" : "text";
      return (
        <div key={fieldName}>
          {label}
          <input
            ref={addFocusHandlers}
            type={inputType}
            style={INPUT_STYLE}
            value={value as string}
            onChange={(e) => onChange(fieldName, e.target.value)}
            required={required}
          />
        </div>
      );
    }
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [topHtml, setTopHtml] = useState<string[]>([]);
  const [bottomHtml, setBottomHtml] = useState<string[]>([]);
  const [fields, setFields] = useState<MemberField[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dynamicValues, setDynamicValues] = useState<Record<string, string | string[]>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/front/fixed-sections").then((r) => r.json()).catch(() => ({ top: [], bottom: [] })),
      fetch("/api/member-fields").then((r) => r.json()).catch(() => []),
    ]).then(([sections, mf]) => {
      setTopHtml(sections.top || []);
      setBottomHtml(sections.bottom || []);
      const activeFields = (Array.isArray(mf) ? mf : []).filter((f: MemberField) => f.isActive).sort((a: MemberField, b: MemberField) => a.sortOrder - b.sortOrder);
      setFields(activeFields);
      setLoading(false);
    });
  }, []);

  const handleDynamic = (fieldName: string, val: string | string[]) => {
    setDynamicValues((prev) => ({ ...prev, [fieldName]: val }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone, extra: dynamicValues }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "회원가입에 실패했습니다.");
      }
      router.push("/register-complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #3182f6", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      {topHtml.map((h, i) => <div key={`t${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}

      <div style={{ background: "#fff", minHeight: "60vh", fontFamily: "'Pretendard',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
        <div style={{ maxWidth: 440, margin: "0 auto", padding: "60px 24px 80px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#191f28", margin: 0, letterSpacing: "-0.5px" }}>회원가입</h1>
            <p style={{ fontSize: 15, color: "#8b95a1", marginTop: 8, lineHeight: 1.5 }}>간편하게 회원가입하세요</p>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: "#fff0f0", borderRadius: 10, fontSize: 14, color: "#f04452", marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={LABEL_STYLE}>이메일 <span style={{ color: "#f04452" }}>*</span></label>
              <input ref={addFocusHandlers} type="email" style={INPUT_STYLE} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@email.com" />
            </div>

            <div>
              <label style={LABEL_STYLE}>비밀번호 <span style={{ color: "#f04452" }}>*</span></label>
              <input ref={addFocusHandlers} type="password" style={INPUT_STYLE} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="8자 이상 입력하세요" />
            </div>

            <div>
              <label style={LABEL_STYLE}>비밀번호 확인 <span style={{ color: "#f04452" }}>*</span></label>
              <input ref={addFocusHandlers} type="password" style={INPUT_STYLE} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required placeholder="비밀번호를 다시 입력하세요" />
            </div>

            <div>
              <label style={LABEL_STYLE}>이름 <span style={{ color: "#f04452" }}>*</span></label>
              <input ref={addFocusHandlers} type="text" style={INPUT_STYLE} value={name} onChange={(e) => setName(e.target.value)} required placeholder="이름을 입력하세요" />
            </div>

            <div>
              <label style={LABEL_STYLE}>연락처 <span style={{ color: "#f04452" }}>*</span></label>
              <input ref={addFocusHandlers} type="tel" style={INPUT_STYLE} value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="010-0000-0000" />
            </div>

            {fields.map((field) =>
              renderDynamicField(field, dynamicValues[field.fieldName] || (field.fieldType === "checkbox" ? [] : ""), handleDynamic)
            )}

            <button type="submit" disabled={submitting} style={{ ...BTN_STYLE, marginTop: 8, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "처리 중..." : "가입하기"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#8b95a1" }}>
            이미 계정이 있으신가요?{" "}
            <a href="/user-login" style={{ color: "#3182f6", fontWeight: 500, textDecoration: "none" }}>로그인</a>
          </p>
        </div>
      </div>

      {bottomHtml.map((h, i) => <div key={`b${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}
    </>
  );
}
