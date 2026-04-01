"use client";

import { useEffect, useState, useCallback } from "react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("claude-sonnet-4-20250514");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showKey, setShowKey] = useState(false);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (!res.ok) return;
    const data = await res.json();
    if (data.claude_api_key) setApiKey(data.claude_api_key);
    if (data.claude_model) setModel(data.claude_model);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claude_api_key: apiKey, claude_model: model }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/settings/test", { method: "POST" });
    const data = await res.json();
    setTesting(false);
    setTestResult({ ok: res.ok, message: data.message || data.error });
  };

  const maskedKey = apiKey ? apiKey.slice(0, 10) + "••••••••" + apiKey.slice(-4) : "";

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <p className="text-sm text-gray-500">CMS 시스템 설정을 관리합니다.</p>
      </div>

      {/* Claude API Settings */}
      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7C3AED]/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[#191F28]">Claude API 연동</h3>
              <p className="text-xs text-gray-400 mt-0.5">.pen 파일 자동 분석에 사용됩니다</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* API Key */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">API Key</label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={showKey ? apiKey : (apiKey ? maskedKey : "")}
                onChange={(e) => { setApiKey(e.target.value); setShowKey(true); }}
                onFocus={() => setShowKey(true)}
                className="w-full px-4 py-3 pr-20 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                placeholder="sk-ant-api03-..."
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showKey ? "숨기기" : "보기"}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Anthropic Console에서 발급받은 API 키를 입력하세요.
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="text-[#7C3AED] font-semibold ml-1 hover:underline">
                키 발급하기
              </a>
            </p>
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">모델</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] bg-white transition-all"
            >
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (권장, 빠르고 정확)</option>
              <option value="claude-opus-4-20250514">Claude Opus 4 (최고 성능)</option>
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (빠르고 저렴)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !apiKey}
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#7C3AED] rounded-xl hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/20 disabled:opacity-50 transition-all"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={handleTest}
              disabled={testing || !apiKey}
              className="px-5 py-2.5 text-sm font-semibold text-[#7C3AED] bg-[#7C3AED]/10 rounded-xl hover:bg-[#7C3AED]/20 disabled:opacity-50 transition-all"
            >
              {testing ? "테스트 중..." : "연결 테스트"}
            </button>
            {saved && (
              <span className="text-sm font-semibold text-[#03B26C] flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                저장 완료
              </span>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`px-4 py-3 rounded-xl text-sm font-medium ${testResult.ok ? "bg-[#03B26C]/10 text-[#03B26C]" : "bg-[#F04452]/10 text-[#F04452]"}`}>
              {testResult.ok ? "연결 성공! " : "연결 실패: "}{testResult.message}
            </div>
          )}
        </div>
      </div>

      {/* Usage Guide */}
      <div className="mt-6 bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-[#191F28] mb-3">사용 가이드</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>1. 위에서 Claude API 키를 입력하고 <strong>저장</strong>합니다.</p>
          <p>2. <strong>연결 테스트</strong>로 정상 연결을 확인합니다.</p>
          <p>3. <strong>템플릿 관리</strong> → <strong>.pen 업로드</strong>에서 Pencil AI 파일을 업로드합니다.</p>
          <p>4. Claude가 자동으로 디자인을 분석하여 컨테이너별 템플릿을 생성합니다.</p>
        </div>
      </div>
    </div>
  );
}
