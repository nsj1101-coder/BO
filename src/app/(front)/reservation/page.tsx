"use client";

import { useEffect, useState, FormEvent } from "react";

interface FormField {
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

function renderField(
  field: FormField,
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

export default function ReservationPage() {
  const [topHtml, setTopHtml] = useState<string[]>([]);
  const [bottomHtml, setBottomHtml] = useState<string[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/front/fixed-sections").then((r) => r.json()).catch(() => ({ top: [], bottom: [] })),
      fetch("/api/form-configs/reservation").then((r) => r.json()).catch(() => []),
    ]).then(([sections, fc]) => {
      setTopHtml(sections.top || []);
      setBottomHtml(sections.bottom || []);
      let raw = fc?.fields ?? fc ?? [];
      if (typeof raw === "string") try { raw = JSON.parse(raw); } catch { raw = []; }
      if (!Array.isArray(raw)) raw = [];
      setFields(raw.map((f: Record<string, unknown>) => ({
        fieldName: f.fieldName || f.key || "",
        fieldLabel: f.fieldLabel || f.label || "",
        fieldType: f.fieldType || f.type || "text",
        required: f.required || false,
        options: f.options || "",
      })));
      setLoading(false);
    });
  }, []);

  const handleChange = (fieldName: string, val: string | string[]) => {
    setValues((prev) => ({ ...prev, [fieldName]: val }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: JSON.stringify(values) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "예약 신청에 실패했습니다.");
      }
      setSuccess(true);
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
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "60px 24px 80px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#191f28", margin: 0, letterSpacing: "-0.5px" }}>예약 신청</h1>
            <p style={{ fontSize: 15, color: "#8b95a1", marginTop: 8, lineHeight: 1.5 }}>아래 내용을 작성해 주시면 예약을 도와드리겠습니다</p>
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
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#191f28", margin: 0 }}>예약 신청이 완료되었습니다</h2>
              <p style={{ fontSize: 15, color: "#8b95a1", marginTop: 12, lineHeight: 1.5 }}>확인 후 연락드리겠습니다.</p>
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
                {fields.map((field) =>
                  renderField(field, values[field.fieldName] || (field.fieldType === "checkbox" ? [] : ""), handleChange)
                )}

                {fields.length === 0 && (
                  <p style={{ textAlign: "center", color: "#8b95a1", fontSize: 14 }}>등록된 예약 양식이 없습니다.</p>
                )}

                {fields.length > 0 && (
                  <button type="submit" disabled={submitting} style={{ ...BTN_STYLE, marginTop: 8, opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? "신청 중..." : "예약 신청하기"}
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      </div>

      {bottomHtml.map((h, i) => <div key={`b${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}
    </>
  );
}
