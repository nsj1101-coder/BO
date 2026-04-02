"use client";

import { useEffect, useState, useCallback } from "react";

interface SiteConfig {
  site_title: string;
  site_description: string;
  site_keywords: string;
  site_favicon: string;
  site_og_image: string;
  site_og_title: string;
  site_og_description: string;
  site_logo_url: string;
  site_copyright: string;
  site_ga_id: string;
  site_gtm_id: string;
  site_naver_verify: string;
  site_google_verify: string;
  site_custom_head: string;
  site_custom_css: string;
  site_maintenance: string;
  site_primary_color: string;
  site_contact_email: string;
  site_contact_phone: string;
  site_address: string;
  site_business_number: string;
  site_ceo_name: string;
}

const defaultConfig: SiteConfig = {
  site_title: "",
  site_description: "",
  site_keywords: "",
  site_favicon: "",
  site_og_image: "",
  site_og_title: "",
  site_og_description: "",
  site_logo_url: "",
  site_copyright: "",
  site_ga_id: "",
  site_gtm_id: "",
  site_naver_verify: "",
  site_google_verify: "",
  site_custom_head: "",
  site_custom_css: "",
  site_maintenance: "off",
  site_primary_color: "#4332f8",
  site_contact_email: "",
  site_contact_phone: "",
  site_address: "",
  site_business_number: "",
  site_ceo_name: "",
};

const sections = [
  {
    title: "기본 정보",
    desc: "사이트 제목, 설명 등 기본 메타 정보를 설정합니다.",
    fields: [
      { key: "site_title", label: "사이트 제목", type: "text", placeholder: "SJCMS 홈페이지" },
      { key: "site_description", label: "사이트 설명 (meta description)", type: "textarea", placeholder: "사이트에 대한 간단한 설명" },
      { key: "site_keywords", label: "키워드 (meta keywords)", type: "text", placeholder: "CMS, 홈페이지, 관리" },
      { key: "site_logo_url", label: "로고 이미지 URL", type: "text", placeholder: "https://..." },
      { key: "site_favicon", label: "파비콘 URL", type: "text", placeholder: "https://...favicon.ico" },
      { key: "site_copyright", label: "저작권 문구", type: "text", placeholder: "© 2026 Company. All rights reserved." },
      { key: "site_primary_color", label: "메인 컬러", type: "color" },
    ],
  },
  {
    title: "OG 태그 (소셜 미디어)",
    desc: "카카오톡, 페이스북 등에서 공유 시 표시되는 정보입니다.",
    fields: [
      { key: "site_og_title", label: "OG 제목", type: "text", placeholder: "공유 시 표시될 제목" },
      { key: "site_og_description", label: "OG 설명", type: "text", placeholder: "공유 시 표시될 설명" },
      { key: "site_og_image", label: "OG 이미지 URL", type: "text", placeholder: "https://...og-image.jpg (1200x630 권장)" },
    ],
  },
  {
    title: "SEO / 분석",
    desc: "검색 엔진 최적화 및 트래킹 코드를 설정합니다.",
    fields: [
      { key: "site_ga_id", label: "Google Analytics ID", type: "text", placeholder: "G-XXXXXXXXXX" },
      { key: "site_gtm_id", label: "Google Tag Manager ID", type: "text", placeholder: "GTM-XXXXXXX" },
      { key: "site_naver_verify", label: "네이버 사이트 인증 코드", type: "text", placeholder: "인증 메타태그 content 값" },
      { key: "site_google_verify", label: "구글 사이트 인증 코드", type: "text", placeholder: "인증 메타태그 content 값" },
    ],
  },
  {
    title: "사업자 정보",
    desc: "사이트 하단 등에 노출되는 사업자 정보를 설정합니다.",
    fields: [
      { key: "site_ceo_name", label: "대표자명", type: "text", placeholder: "" },
      { key: "site_business_number", label: "사업자등록번호", type: "text", placeholder: "000-00-00000" },
      { key: "site_address", label: "주소", type: "text", placeholder: "" },
      { key: "site_contact_email", label: "대표 이메일", type: "text", placeholder: "info@example.com" },
      { key: "site_contact_phone", label: "대표 전화번호", type: "text", placeholder: "02-0000-0000" },
    ],
  },
  {
    title: "고급 설정",
    desc: "커스텀 코드 삽입 및 점검 모드를 설정합니다.",
    fields: [
      { key: "site_custom_head", label: "커스텀 <head> 코드", type: "code", placeholder: "<!-- 추가 스크립트, 메타태그 등 -->" },
      { key: "site_custom_css", label: "전역 커스텀 CSS", type: "code", placeholder: "body { }" },
      { key: "site_maintenance", label: "점검 모드", type: "select", options: ["off", "on"] },
    ],
  },
];

export default function SiteConfigPage() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setConfig((prev) => ({ ...prev, ...data }));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-[#4332f8] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-[#111]">사이트 환경설정</h1>
          <p className="text-sm text-gray-500 mt-1">사이트 기본 정보, 메타태그, SEO, 사업자 정보를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-semibold text-green-600">저장 완료 ✓</span>}
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 text-sm font-bold text-white bg-[#4332f8] rounded-xl hover:bg-[#3a2be0] disabled:opacity-50 transition-all" style={{ boxShadow: "0 4px 20px rgba(67,50,248,0.2)" }}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-base font-bold text-[#111] mb-1">{section.title}</h2>
            <p className="text-xs text-gray-400 mb-5">{section.desc}</p>
            <div className="space-y-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={(config as Record<string, string>)[field.key] || ""}
                      onChange={(e) => update(field.key, e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4332f8] resize-none"
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "code" ? (
                    <textarea
                      value={(config as Record<string, string>)[field.key] || ""}
                      onChange={(e) => update(field.key, e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#4332f8] resize-none bg-gray-50"
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={(config as Record<string, string>)[field.key] || ""}
                      onChange={(e) => update(field.key, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4332f8] bg-white"
                    >
                      {field.options?.map((opt) => <option key={opt} value={opt}>{opt === "on" ? "점검 중 (사이트 접근 차단)" : "정상 운영"}</option>)}
                    </select>
                  ) : field.type === "color" ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={(config as Record<string, string>)[field.key] || "#4332f8"}
                        onChange={(e) => update(field.key, e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(config as Record<string, string>)[field.key] || ""}
                        onChange={(e) => update(field.key, e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#4332f8]"
                        placeholder="#4332f8"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={(config as Record<string, string>)[field.key] || ""}
                      onChange={(e) => update(field.key, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4332f8]"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
