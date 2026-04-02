"use client";

import { useEffect, useState, useCallback } from "react";

interface PluginConfig {
  installed: boolean;
  keys: Record<string, string>;
}

const pluginList = [
  {
    id: "pg_inicis",
    name: "KG이니시스",
    category: "PG사",
    desc: "신용카드, 계좌이체, 가상계좌, 휴대폰 결제를 지원하는 국내 대표 PG사입니다.",
    icon: "💳",
    color: "#0066CC",
    fields: [
      { key: "merchant_id", label: "상점 ID (MID)" },
      { key: "api_key", label: "API Key" },
      { key: "api_secret", label: "API Secret" },
    ],
  },
  {
    id: "pg_toss",
    name: "토스페이먼츠",
    category: "PG사",
    desc: "토스페이, 카드, 계좌이체, 가상계좌 등 다양한 결제 수단을 지원합니다.",
    icon: "🔵",
    color: "#0064FF",
    fields: [
      { key: "client_key", label: "클라이언트 키" },
      { key: "secret_key", label: "시크릿 키" },
    ],
  },
  {
    id: "pg_nicepay",
    name: "나이스페이",
    category: "PG사",
    desc: "NICE페이먼츠 결제 연동. 카드/계좌이체/가상계좌/휴대폰 결제 지원.",
    icon: "🟢",
    color: "#00B050",
    fields: [
      { key: "merchant_key", label: "상점 키" },
      { key: "merchant_id", label: "상점 ID" },
    ],
  },
  {
    id: "pg_kakaopay",
    name: "카카오페이",
    category: "PG사",
    desc: "카카오페이 간편결제를 연동합니다.",
    icon: "💛",
    color: "#FEE500",
    fields: [
      { key: "cid", label: "가맹점 코드 (CID)" },
      { key: "admin_key", label: "Admin 키" },
    ],
  },
  {
    id: "pg_naverpay",
    name: "네이버페이",
    category: "PG사",
    desc: "네이버페이 간편결제 및 정기결제를 연동합니다.",
    icon: "💚",
    color: "#03C75A",
    fields: [
      { key: "partner_id", label: "파트너 ID" },
      { key: "client_id", label: "클라이언트 ID" },
      { key: "client_secret", label: "클라이언트 시크릿" },
    ],
  },
  {
    id: "api_claude",
    name: "Claude AI",
    category: "AI",
    desc: "Anthropic Claude API 연동. .pen 파일 자동 분석 및 코드 변환에 사용됩니다.",
    icon: "🤖",
    color: "#D97706",
    fields: [
      { key: "claude_api_key", label: "API Key" },
      { key: "claude_model", label: "모델 (claude-sonnet-4-20250514 등)" },
    ],
  },
  {
    id: "api_openai",
    name: "OpenAI (ChatGPT)",
    category: "AI",
    desc: "OpenAI GPT API 연동. 콘텐츠 자동 생성, 번역 등에 활용합니다.",
    icon: "🧠",
    color: "#10A37F",
    fields: [
      { key: "openai_api_key", label: "API Key" },
      { key: "openai_model", label: "모델 (gpt-4o 등)" },
    ],
  },
  {
    id: "api_kakao",
    name: "카카오 API",
    category: "소셜/인증",
    desc: "카카오 로그인, 카카오톡 메시지 발송, 카카오맵 연동.",
    icon: "🟡",
    color: "#FEE500",
    fields: [
      { key: "kakao_app_key", label: "JavaScript 키" },
      { key: "kakao_rest_key", label: "REST API 키" },
      { key: "kakao_admin_key", label: "Admin 키" },
    ],
  },
  {
    id: "api_naver",
    name: "네이버 API",
    category: "소셜/인증",
    desc: "네이버 로그인, 네이버 지도, 검색 API 연동.",
    icon: "🟩",
    color: "#03C75A",
    fields: [
      { key: "naver_client_id", label: "Client ID" },
      { key: "naver_client_secret", label: "Client Secret" },
    ],
  },
  {
    id: "api_google",
    name: "Google API",
    category: "소셜/인증",
    desc: "구글 로그인, Google Maps, reCAPTCHA 연동.",
    icon: "🔴",
    color: "#4285F4",
    fields: [
      { key: "google_client_id", label: "Client ID" },
      { key: "google_client_secret", label: "Client Secret" },
      { key: "google_recaptcha_key", label: "reCAPTCHA Site Key" },
    ],
  },
  {
    id: "api_sms",
    name: "SMS 발송 (알리고)",
    category: "메시징",
    desc: "문자 메시지(SMS/LMS/MMS) 발송 연동. 회원 인증, 알림 등에 사용.",
    icon: "📱",
    color: "#6366F1",
    fields: [
      { key: "aligo_key", label: "API Key" },
      { key: "aligo_user_id", label: "사용자 ID" },
      { key: "aligo_sender", label: "발신 번호" },
    ],
  },
  {
    id: "api_email",
    name: "이메일 발송 (SendGrid)",
    category: "메시징",
    desc: "이메일 발송 연동. 회원가입 인증, 비밀번호 재설정 등에 사용.",
    icon: "📧",
    color: "#1A82E2",
    fields: [
      { key: "sendgrid_api_key", label: "API Key" },
      { key: "sendgrid_sender", label: "발신 이메일" },
    ],
  },
  {
    id: "api_aws_s3",
    name: "AWS S3",
    category: "스토리지",
    desc: "이미지, 파일 업로드를 위한 AWS S3 스토리지 연동.",
    icon: "☁️",
    color: "#FF9900",
    fields: [
      { key: "aws_access_key", label: "Access Key ID" },
      { key: "aws_secret_key", label: "Secret Access Key" },
      { key: "aws_region", label: "리전 (ap-northeast-2)" },
      { key: "aws_bucket", label: "버킷 이름" },
    ],
  },
  {
    id: "api_analytics",
    name: "Google Analytics 4",
    category: "분석",
    desc: "웹사이트 트래픽 분석 및 사용자 행동 추적.",
    icon: "📈",
    color: "#E37400",
    fields: [
      { key: "ga4_measurement_id", label: "측정 ID (G-XXXXXXXXXX)" },
    ],
  },
];

const categories = ["전체", ...Array.from(new Set(pluginList.map((p) => p.category)))];

export default function PluginsPage() {
  const [configs, setConfigs] = useState<Record<string, PluginConfig>>({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [editPlugin, setEditPlugin] = useState<typeof pluginList[0] | null>(null);
  const [editKeys, setEditKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      const parsed: Record<string, PluginConfig> = {};
      pluginList.forEach((p) => {
        const keys: Record<string, string> = {};
        let hasKey = false;
        p.fields.forEach((f) => {
          const val = data[`plugin_${p.id}_${f.key}`] || "";
          keys[f.key] = val;
          if (val) hasKey = true;
        });
        const installed = data[`plugin_${p.id}_installed`] === "true";
        parsed[p.id] = { installed: installed || hasKey, keys };
      });
      setConfigs(parsed);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const openEdit = (plugin: typeof pluginList[0]) => {
    setEditPlugin(plugin);
    setEditKeys(configs[plugin.id]?.keys || {});
  };

  const handleInstall = async (plugin: typeof pluginList[0]) => {
    const settings: Record<string, string> = { [`plugin_${plugin.id}_installed`]: "true" };
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    fetchConfigs();
  };

  const handleUninstall = async (plugin: typeof pluginList[0]) => {
    if (!confirm(`${plugin.name} 플러그인을 제거하시겠습니까?`)) return;
    const settings: Record<string, string> = { [`plugin_${plugin.id}_installed`]: "false" };
    plugin.fields.forEach((f) => { settings[`plugin_${plugin.id}_${f.key}`] = ""; });
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    fetchConfigs();
  };

  const handleSaveKeys = async () => {
    if (!editPlugin) return;
    setSaving(true);
    const settings: Record<string, string> = { [`plugin_${editPlugin.id}_installed`]: "true" };
    editPlugin.fields.forEach((f) => { settings[`plugin_${editPlugin.id}_${f.key}`] = editKeys[f.key] || ""; });
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    setSaving(false);
    setEditPlugin(null);
    fetchConfigs();
  };

  const filtered = activeCategory === "전체" ? pluginList : pluginList.filter((p) => p.category === activeCategory);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-[#4332f8] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#111]">플러그인</h1>
          <p className="text-sm text-gray-500 mt-1">PG사, API 연동, 외부 서비스를 설치하고 관리합니다.</p>
        </div>
        <span className="text-sm text-gray-400">{Object.values(configs).filter((c) => c.installed).length}개 설치됨</span>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className="px-4 py-2 rounded-full text-[13px] font-semibold transition-all"
            style={{ background: activeCategory === cat ? "#4332f8" : "#f3f4f6", color: activeCategory === cat ? "#fff" : "#666", boxShadow: activeCategory === cat ? "0 2px 12px rgba(67,50,248,0.15)" : "none" }}
          >{cat}</button>
        ))}
      </div>

      {/* Plugin cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((plugin) => {
          const cfg = configs[plugin.id];
          const installed = cfg?.installed;
          return (
            <div key={plugin.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col transition-all hover:shadow-lg hover:border-gray-200">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: `${plugin.color}15` }}>
                    {plugin.icon}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#111]">{plugin.name}</h3>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${plugin.color}15`, color: plugin.color }}>{plugin.category}</span>
                  </div>
                </div>
                {installed && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">설치됨</span>
                )}
              </div>

              {/* Description */}
              <p className="text-[13px] text-gray-500 leading-relaxed mb-4 flex-1">{plugin.desc}</p>

              {/* Price */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-bold text-[#111]">무료</span>
                <span className="text-[11px] text-gray-400">설치비 ₩0</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {installed ? (
                  <>
                    <button onClick={() => openEdit(plugin)} className="flex-1 py-2.5 text-[13px] font-semibold text-[#4332f8] bg-[#4332f8]/10 rounded-xl hover:bg-[#4332f8]/20 transition-all">설정</button>
                    <button onClick={() => handleUninstall(plugin)} className="px-4 py-2.5 text-[13px] font-semibold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-all">제거</button>
                  </>
                ) : (
                  <button onClick={() => handleInstall(plugin)} className="flex-1 py-2.5 text-[13px] font-bold text-white bg-[#4332f8] rounded-xl hover:bg-[#3a2be0] transition-all" style={{ boxShadow: "0 2px 12px rgba(67,50,248,0.2)" }}>설치하기</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editPlugin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setEditPlugin(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden" style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${editPlugin.color}15` }}>{editPlugin.icon}</div>
                <div>
                  <h3 className="text-base font-bold text-[#111]">{editPlugin.name}</h3>
                  <p className="text-[11px] text-gray-400">{editPlugin.category}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {editPlugin.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">{field.label}</label>
                  <input
                    type={field.key.includes("secret") || field.key.includes("key") || field.key.includes("admin") ? "password" : "text"}
                    value={editKeys[field.key] || ""}
                    onChange={(e) => setEditKeys((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#4332f8]"
                    placeholder={`${field.label} 입력`}
                  />
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEditPlugin(null)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">취소</button>
              <button onClick={handleSaveKeys} disabled={saving} className="px-5 py-2.5 text-sm font-bold text-white bg-[#4332f8] rounded-xl hover:bg-[#3a2be0] disabled:opacity-50" style={{ boxShadow: "0 2px 12px rgba(67,50,248,0.2)" }}>
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
