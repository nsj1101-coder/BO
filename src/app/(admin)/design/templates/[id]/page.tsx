"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Template {
  id: number;
  name: string;
  slug: string;
  folderId: number | null;
  category: string;
  htmlContent: string;
  cssContent: string;
  jsContent: string;
  banners?: Banner[];
}

interface Banner {
  id: number;
  slotKey: string;
  imageUrl: string;
  linkUrl: string | null;
  altText: string | null;
  isActive: boolean;
}

interface Version {
  id: number;
  version: number;
  htmlContent: string;
  cssContent: string;
  jsContent: string;
  memo: string;
  createdAt: string;
}

const CATEGORIES = [
  { value: "header", label: "헤더" },
  { value: "footer", label: "푸터" },
  { value: "hero", label: "히어로" },
  { value: "content", label: "콘텐츠" },
  { value: "banner", label: "배너" },
  { value: "general", label: "일반" },
];

function applyBanners(html: string, banners: Banner[]) {
  let result = html;
  banners.filter((b) => b.isActive).forEach((b) => {
    const tag = `{{BANNER:${b.slotKey}}}`;
    const escaped = tag.replace(/[{}]/g, "\\$&");
    result = result.replace(new RegExp(`url\\(['"]?${escaped}['"]?\\)`, "g"), `url('${b.imageUrl}')`);
    const img = b.linkUrl
      ? `<a href="${b.linkUrl}"><img src="${b.imageUrl}" alt="${b.altText || ""}" style="max-width:100%;height:auto;display:block;" /></a>`
      : `<img src="${b.imageUrl}" alt="${b.altText || ""}" style="max-width:100%;height:auto;display:block;" />`;
    result = result.replaceAll(tag, img);
  });
  return result;
}

function buildIframeDoc(html: string, css: string, js: string, banners: Banner[] = []) {
  const processed = applyBanners(html, banners);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"><\/script><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet"><style>body{margin:0;font-family:'DM Sans',sans-serif}${css.replace(/</g, "\\x3c")}</style></head><body>${processed}${js ? `<script>${js.replace(/</g, "\\x3c")}<\/script>` : ""}</body></html>`;
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [template, setTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);

  // Versions
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchTemplate = useCallback(async () => {
    const res = await fetch(`/api/templates/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setTemplate(data);
    setHtml(data.htmlContent);
    setCss(data.cssContent);
    setJs(data.jsContent);
    if (data.banners) setBanners(data.banners);
  }, [id]);

  const fetchVersions = useCallback(async () => {
    const res = await fetch(`/api/templates/${id}/versions`);
    if (res.ok) setVersions(await res.json());
  }, [id]);

  useEffect(() => { fetchTemplate(); fetchVersions(); }, [fetchTemplate, fetchVersions]);

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    const res = await fetch(`/api/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: template.name, category: template.category, htmlContent: html, cssContent: css, jsContent: js }),
    });
    if (!res.ok) {
      alert("저장 실패: " + (await res.text()));
      setSaving(false);
      return;
    }
    // Sync page_sections that use this template
    const pagesRes = await fetch("/api/pages?type=main");
    if (pagesRes.ok) {
      const pages = await pagesRes.json();
      for (const page of pages) {
        for (const section of page.sections || []) {
          if (section.templateId === id || section.template?.id === id) {
            await fetch(`/api/pages/${page.id}/sections/${section.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ htmlContent: html, cssContent: css, jsContent: js }),
            });
          }
        }
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetchVersions();
  };

  const restoreVersion = async (versionId: number) => {
    if (!confirm("이 버전으로 복원하시겠습니까? 현재 코드는 자동 백업됩니다.")) return;
    setRestoring(true);
    await fetch(`/api/templates/${id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    setRestoring(false);
    setPreviewVersion(null);
    setShowVersions(false);
    fetchTemplate();
    fetchVersions();
  };

  const currentCode = activeTab === "html" ? html : activeTab === "css" ? css : js;
  const setCurrentCode = (val: string) => {
    if (activeTab === "html") setHtml(val);
    else if (activeTab === "css") setCss(val);
    else setJs(val);
  };

  const fmtDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  if (!template) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-[#191F28] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="font-bold text-lg text-[#191F28]">{template.name}</h2>
          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#3182F6]/10 text-[#3182F6]">
            {CATEGORIES.find((c) => c.value === template.category)?.label ?? template.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm font-semibold text-[#03B26C] flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              저장됨
            </span>
          )}
          <button
            onClick={() => setShowVersions(!showVersions)}
            className={`px-4 py-2.5 text-sm font-bold rounded-xl transition-all border ${
              showVersions ? "bg-[#191F28] text-white border-[#191F28]" : "bg-white text-[#191F28] border-gray-200 hover:bg-gray-50"
            }`}
          >
            버전 기록 ({versions.length})
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-[#3182F6] hover:bg-[#1B6CF2] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#3182F6]/20 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Code Editor */}
        <div className={`flex flex-col bg-white border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden transition-all ${showVersions ? "w-[40%]" : "w-1/2"}`}>
          <div className="flex items-center gap-1 px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
            {(["html", "css", "js"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab ? "bg-[#191F28] text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
            <div className="flex-1" />
            <span className="text-[10px] text-gray-400">{currentCode.length}자</span>
          </div>
          <textarea
            value={currentCode}
            onChange={(e) => setCurrentCode(e.target.value)}
            className="flex-1 px-4 py-3 text-sm font-mono text-gray-800 bg-[#FAFBFC] resize-none focus:outline-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Center: Live Preview */}
        <div className={`flex flex-col bg-white border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden transition-all ${showVersions ? "w-[30%]" : "w-1/2"}`}>
          <div className="flex items-center px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
            <span className="text-xs font-semibold text-gray-500">
              {previewVersion ? `v${previewVersion.version} 미리보기` : "실시간 미리보기"}
            </span>
            {previewVersion && (
              <button onClick={() => setPreviewVersion(null)} className="ml-2 text-[10px] text-[#3182F6] font-semibold hover:underline">현재 버전 보기</button>
            )}
          </div>
          <div className="flex-1 overflow-auto bg-[#F8FAFC]">
            <iframe
              srcDoc={previewVersion
                ? buildIframeDoc(previewVersion.htmlContent, previewVersion.cssContent, previewVersion.jsContent, banners)
                : buildIframeDoc(html, css, js, banners)
              }
              className="w-full h-full border-0"
              sandbox="allow-scripts"
            />
          </div>
        </div>

        {/* Right: Version History (conditional) */}
        {showVersions && (
          <div className="w-[30%] flex flex-col bg-white border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
              <span className="text-xs font-semibold text-gray-500">버전 기록</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {versions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  저장 기록이 없습니다
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        previewVersion?.id === v.id
                          ? "border-[#3182F6] bg-[#3182F6]/5 ring-1 ring-[#3182F6]"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setPreviewVersion(v)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#191F28]">v{v.version}</span>
                        <span className="text-[10px] text-gray-400">{fmtDate(v.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{v.memo}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-gray-400">HTML {v.htmlContent.length}자</span>
                        {previewVersion?.id === v.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); restoreVersion(v.id); }}
                            disabled={restoring}
                            className="ml-auto px-3 py-1 text-[10px] font-bold text-white bg-[#F59E0B] rounded-lg hover:bg-[#D97706] transition-colors disabled:opacity-50"
                          >
                            {restoring ? "복원 중..." : "이 버전으로 복원"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
