"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface Folder {
  id: number;
  name: string;
  color: string;
  templates: Template[];
}

interface Template {
  id: number;
  name: string;
  category: string;
}

interface Banner {
  id: number;
  templateId: number;
  slotKey: string;
  imageUrl: string;
  linkUrl: string | null;
  altText: string | null;
  isActive: boolean;
}

interface Section {
  id: number;
  sortOrder: number;
  isActive: boolean;
  isFixed: boolean;
  fixPosition: string | null;
  htmlContent: string;
  cssContent: string;
  jsContent: string;
  template: Template;
}

interface Page {
  id: number;
  title: string;
  sections: Section[];
}

export default function MainPageManagement() {
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [unfiled, setUnfiled] = useState<Template[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<"single" | "folder">("single");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [fixPosition, setFixPosition] = useState<string>("none");
  const [importing, setImporting] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [editTab, setEditTab] = useState<"html" | "css" | "js">("html");
  const [editContent, setEditContent] = useState({ html: "", css: "", js: "" });

  // Banner state
  const [bannerSection, setBannerSection] = useState<Section | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerForm, setBannerForm] = useState({ slotKey: "", imageUrl: "", linkUrl: "", altText: "" });
  const [editBannerId, setEditBannerId] = useState<number | null>(null);

  // Drag state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const fetchPage = useCallback(async () => {
    const res = await fetch("/api/pages?type=main");
    if (!res.ok) return;
    const pages = await res.json();
    if (pages.length > 0) {
      setPage(pages[0]);
    } else {
      const createRes = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "메인 페이지", pageType: "main" }),
      });
      if (createRes.ok) setPage(await createRes.json());
    }
  }, []);

  const fetchFolders = useCallback(async () => {
    const res = await fetch("/api/folders");
    if (!res.ok) return;
    const data = await res.json();
    setFolders(data.folders);
    setUnfiled(data.unfiled);
  }, []);

  useEffect(() => {
    fetchPage();
    fetchFolders();
  }, [fetchPage, fetchFolders]);

  const addSection = async () => {
    if (!page) return;

    if (addMode === "folder") {
      if (!selectedFolderId) return;
      const folder = folders.find((f) => f.id === selectedFolderId);
      if (!folder || folder.templates.length === 0) return;

      setImporting(true);
      for (const t of folder.templates) {
        await fetch(`/api/pages/${page.id}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId: t.id, isFixed: false, fixPosition: null }),
        });
      }
      setImporting(false);
    } else {
      if (!selectedTemplate) return;
      await fetch(`/api/pages/${page.id}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate,
          isFixed: fixPosition !== "none",
          fixPosition: fixPosition === "none" ? null : fixPosition,
        }),
      });
    }

    setShowAdd(false);
    setSelectedTemplate(null);
    setSelectedFolderId(null);
    setFixPosition("none");
    setAddMode("single");
    fetchPage();
  };

  const toggleFixed = async (section: Section, position: "top" | "bottom" | null) => {
    if (!page) return;
    const isAlreadyFixed = section.isFixed && section.fixPosition === position;
    await fetch(`/api/pages/${page.id}/sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isFixed: !isAlreadyFixed,
        fixPosition: isAlreadyFixed ? null : position,
      }),
    });
    fetchPage();
  };

  const toggleSection = async (section: Section) => {
    if (!page) return;
    await fetch(`/api/pages/${page.id}/sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !section.isActive }),
    });
    fetchPage();
  };

  const deleteSection = async (section: Section) => {
    if (!page || !confirm("이 섹션을 삭제하시겠습니까?")) return;
    await fetch(`/api/pages/${page.id}/sections/${section.id}`, { method: "DELETE" });
    fetchPage();
  };

  // Drag handlers - entire row is draggable
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    dragItem.current = idx;
    setDragIdx(idx);
    setDragging(true);
    e.dataTransfer.effectAllowed = "move";
    // Ghost image
    const el = e.currentTarget as HTMLElement;
    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.style.width = `${el.offsetWidth}px`;
    ghost.style.opacity = "0.85";
    ghost.style.transform = "rotate(1deg) scale(1.02)";
    ghost.style.boxShadow = "0 12px 40px rgba(49,130,246,0.25)";
    ghost.style.border = "2px solid #3182F6";
    ghost.style.borderRadius = "16px";
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragEnter = (idx: number) => {
    dragOverItem.current = idx;
    setOverIdx(idx);
  };

  const handleDragEnd = async () => {
    setDragging(false);
    setDragIdx(null);
    setOverIdx(null);
    if (!page || dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;

    const sections = [...page.sections];
    const [removed] = sections.splice(dragItem.current, 1);
    sections.splice(dragOverItem.current, 0, removed);

    const reordered = sections.map((s, i) => ({ ...s, sortOrder: i }));
    setPage({ ...page, sections: reordered });

    dragItem.current = null;
    dragOverItem.current = null;

    await fetch(`/api/pages/${page.id}/sections/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: reordered.map((s, i) => ({ id: s.id, sortOrder: i })) }),
    });
  };

  // Edit section
  const openEditSection = (section: Section) => {
    setEditSection(section);
    setEditContent({ html: section.htmlContent, css: section.cssContent, js: section.jsContent });
    setEditTab("html");
  };

  const saveSection = async () => {
    if (!editSection || !page) return;
    await Promise.all([
      fetch(`/api/templates/${editSection.template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editSection.template.name,
          category: editSection.template.category,
          htmlContent: editContent.html,
          cssContent: editContent.css,
          jsContent: editContent.js,
        }),
      }),
      fetch(`/api/pages/${page.id}/sections/${editSection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          htmlContent: editContent.html,
          cssContent: editContent.css,
          jsContent: editContent.js,
        }),
      }),
    ]);
    setEditSection(null);
    fetchPage();
  };

  // Banner handlers
  const openBannerManager = async (section: Section) => {
    setBannerSection(section);
    const res = await fetch(`/api/banners?templateId=${section.template.id}`);
    if (res.ok) setBanners(await res.json());
    setBannerForm({ slotKey: "", imageUrl: "", linkUrl: "", altText: "" });
    setEditBannerId(null);
  };

  const saveBanner = async () => {
    if (!bannerSection) return;
    if (editBannerId) {
      await fetch(`/api/banners/${editBannerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bannerForm),
      });
    } else {
      await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bannerForm, templateId: bannerSection.template.id }),
      });
    }
    const res = await fetch(`/api/banners?templateId=${bannerSection.template.id}`);
    if (res.ok) setBanners(await res.json());
    setBannerForm({ slotKey: "", imageUrl: "", linkUrl: "", altText: "" });
    setEditBannerId(null);
  };

  const editBanner = (b: Banner) => {
    setEditBannerId(b.id);
    setBannerForm({ slotKey: b.slotKey, imageUrl: b.imageUrl, linkUrl: b.linkUrl || "", altText: b.altText || "" });
  };

  const deleteBanner = async (id: number) => {
    if (!bannerSection || !confirm("배너를 삭제하시겠습니까?")) return;
    await fetch(`/api/banners/${id}`, { method: "DELETE" });
    const res = await fetch(`/api/banners?templateId=${bannerSection.template.id}`);
    if (res.ok) setBanners(await res.json());
  };

  const toggleBanner = async (b: Banner) => {
    if (!bannerSection) return;
    await fetch(`/api/banners/${b.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    const res = await fetch(`/api/banners?templateId=${bannerSection.template.id}`);
    if (res.ok) setBanners(await res.json());
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">메인 페이지의 컨테이너(템플릿)를 관리합니다. 드래그로 순서를 변경할 수 있습니다.</p>
        <div className="flex gap-3">
          <a href="/preview" target="_blank" className="px-5 py-2.5 bg-[#191F28] hover:bg-[#333D4B] text-white text-sm font-bold rounded-xl transition-all">
            미리보기
          </a>
          <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 bg-[#3182F6] hover:bg-[#1B6CF2] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#3182F6]/20">
            + 섹션 추가
          </button>
        </div>
      </div>

      {!page || page.sections.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-16 text-center shadow-sm">
          <p className="text-gray-400 text-sm">등록된 섹션이 없습니다.</p>
          <p className="text-gray-400 text-xs mt-1">먼저 템플릿 관리에서 템플릿을 등록한 후, 여기에서 섹션을 추가하세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {page.sections.map((section, idx) => (
            <div
              key={section.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragEnter={() => handleDragEnter(idx)}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
              style={{
                transition: "all 0.2s cubic-bezier(0.2,0,0,1)",
                transform: dragIdx === idx ? "scale(0.97) rotate(0.5deg)" : overIdx === idx && dragging && dragIdx !== idx ? "translateY(4px)" : "none",
                opacity: dragIdx === idx ? 0.4 : 1,
              }}
              className={`bg-white/70 backdrop-blur-xl border rounded-2xl p-5 shadow-sm cursor-grab active:cursor-grabbing select-none ${
                !section.isActive ? "opacity-50" : ""
              } ${
                overIdx === idx && dragging && dragIdx !== idx
                  ? "border-[#3182F6] border-2 shadow-lg shadow-[#3182F6]/10 bg-[#3182F6]/[0.03]"
                  : "border-gray-200/50 hover:shadow-lg"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Drag indicator */}
                  <div className="flex flex-col gap-0.5 text-gray-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                    </svg>
                  </div>

                  <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-xs font-bold text-gray-500">
                    {idx + 1}
                  </span>

                  <div>
                    <h4 className="font-bold text-[#191F28] text-sm">{section.template.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#3182F6]/10 text-[#3182F6] font-semibold">
                        {section.template.category}
                      </span>
                      {section.isFixed && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#03B26C]/10 text-[#03B26C] font-semibold">
                          {section.fixPosition === "top" ? "상단 고정" : "하단 고정"}
                        </span>
                      )}
                      {!section.isActive && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 font-semibold">
                          비활성
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()} draggable={false} onDragStart={(e) => e.preventDefault()}>
                  {/* On/Off Toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSection(section); }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      section.isActive ? "bg-[#3182F6]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        section.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>

                  {/* Fix buttons */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFixed(section, "top"); }}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      section.isFixed && section.fixPosition === "top"
                        ? "bg-[#03B26C] text-white"
                        : "text-[#03B26C] bg-[#03B26C]/10 hover:bg-[#03B26C]/20"
                    }`}
                  >
                    ↑ 상단
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFixed(section, "bottom"); }}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      section.isFixed && section.fixPosition === "bottom"
                        ? "bg-[#03B26C] text-white"
                        : "text-[#03B26C] bg-[#03B26C]/10 hover:bg-[#03B26C]/20"
                    }`}
                  >
                    ↓ 하단
                  </button>

                  <button onClick={() => openBannerManager(section)} className="px-3 py-2 text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 rounded-lg hover:bg-[#F59E0B]/20 transition-colors">
                    배너
                  </button>
                  <button onClick={() => router.push(`/design/templates/${section.template.id}`)} className="px-3 py-2 text-xs font-semibold text-[#3182F6] bg-[#3182F6]/10 rounded-lg hover:bg-[#3182F6]/20 transition-colors">
                    편집
                  </button>
                  <button onClick={() => deleteSection(section)} className="px-3 py-2 text-xs font-semibold text-[#F04452] bg-[#F04452]/10 rounded-lg hover:bg-[#F04452]/20 transition-colors">
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Section Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-bold text-[#191F28] mb-4">섹션 추가</h3>

            {/* Mode Toggle */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
              <button
                onClick={() => setAddMode("single")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMode === "single" ? "bg-white text-[#191F28] shadow-sm" : "text-gray-500"}`}
              >
                개별 템플릿
              </button>
              <button
                onClick={() => setAddMode("folder")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMode === "folder" ? "bg-white text-[#191F28] shadow-sm" : "text-gray-500"}`}
              >
                폴더 전체 가져오기
              </button>
            </div>

            {addMode === "single" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">템플릿 선택</label>
                  <select value={selectedTemplate ?? ""} onChange={(e) => setSelectedTemplate(Number(e.target.value))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] bg-white">
                    <option value="">선택하세요</option>
                    {folders.map((f) => (
                      <optgroup key={f.id} label={f.name}>
                        {f.templates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                        ))}
                      </optgroup>
                    ))}
                    {unfiled.length > 0 && (
                      <optgroup label="미분류">
                        {unfiled.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">고정 설정</label>
                  <select value={fixPosition} onChange={(e) => setFixPosition(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] bg-white">
                    <option value="none">고정 안함</option>
                    <option value="top">상단 고정</option>
                    <option value="bottom">하단 고정</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">폴더(디자인 세트) 선택</label>
                  <select value={selectedFolderId ?? ""} onChange={(e) => setSelectedFolderId(e.target.value ? Number(e.target.value) : null)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] bg-white">
                    <option value="">선택하세요</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.templates.length}개 템플릿)</option>
                    ))}
                  </select>
                </div>

                {selectedFolderId && (() => {
                  const folder = folders.find((f) => f.id === selectedFolderId);
                  if (!folder) return null;
                  return (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-600 mb-2">포함된 템플릿 ({folder.templates.length}개)</p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {folder.templates.map((t, i) => (
                          <div key={t.id} className="flex items-center gap-2 text-sm">
                            <span className="w-5 h-5 flex items-center justify-center bg-white rounded text-[10px] font-bold text-gray-400 shadow-sm">{i + 1}</span>
                            <span className="font-medium text-[#191F28]">{t.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3182F6]/10 text-[#3182F6] font-semibold">{t.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowAdd(false); setAddMode("single"); }} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">취소</button>
              <button
                onClick={addSection}
                disabled={importing}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B6CF2] shadow-lg shadow-[#3182F6]/20 disabled:opacity-50"
              >
                {importing ? "추가 중..." : addMode === "folder" ? "전체 추가" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#191F28]">{editSection.template.name} 편집</h3>
              <button onClick={() => setEditSection(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex gap-1 mb-2">
                {(["html", "css", "js"] as const).map((tab) => (
                  <button key={tab} onClick={() => setEditTab(tab)} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${editTab === tab ? "bg-[#191F28] text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
              <textarea
                value={editTab === "html" ? editContent.html : editTab === "css" ? editContent.css : editContent.js}
                onChange={(e) => setEditContent({ ...editContent, [editTab]: e.target.value })}
                className="w-full h-72 px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#3182F6] resize-none bg-[#FAFBFC]"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEditSection(null)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">취소</button>
              <button onClick={saveSection} className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B6CF2] shadow-lg shadow-[#3182F6]/20">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Manager Modal */}
      {bannerSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#191F28]">배너 관리</h3>
                <p className="text-xs text-gray-400 mt-0.5">{bannerSection.template.name}</p>
              </div>
              <button onClick={() => setBannerSection(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left: Banner management */}
              <div className="w-[420px] flex-shrink-0 border-r border-gray-100 p-5 overflow-y-auto space-y-4">
                {/* Detected slots */}
                {(() => {
                  const slots = bannerSection.htmlContent.match(/\{\{BANNER:\w+\}\}/g) || [];
                  const uniqueSlots = [...new Set(slots)];
                  return uniqueSlots.length > 0 ? (
                    <div className="bg-[#3182F6]/5 rounded-xl p-3">
                      <p className="text-[11px] font-bold text-[#3182F6] mb-2">템플릿에서 감지된 배너 슬롯</p>
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueSlots.map((s) => (
                          <span key={s} className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-white text-[#3182F6] rounded-lg border border-[#3182F6]/20">{s}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 rounded-xl p-3">
                      <p className="text-[11px] font-bold text-amber-600">배너 슬롯이 없습니다</p>
                      <p className="text-[10px] text-amber-500 mt-1">템플릿 HTML에 <code className="bg-amber-100 px-1 rounded">{"{{BANNER:1}}"}</code> 형식으로 치환코드를 추가하세요.</p>
                    </div>
                  );
                })()}

                {/* Banner Form */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-600">{editBannerId ? "배너 수정" : "배너 추가"}</p>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">슬롯 키</label>
                      <input value={bannerForm.slotKey} onChange={(e) => setBannerForm({ ...bannerForm, slotKey: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3182F6] bg-white" placeholder="1 → {{BANNER:1}}에 매핑" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">이미지 URL</label>
                      <input value={bannerForm.imageUrl} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3182F6] bg-white" placeholder="https://..." />
                    </div>
                    {bannerForm.imageUrl && (
                      <div className="h-20 rounded-lg overflow-hidden bg-gray-100">
                        <img src={bannerForm.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">링크 URL</label>
                        <input value={bannerForm.linkUrl} onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3182F6] bg-white" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">대체 텍스트</label>
                        <input value={bannerForm.altText} onChange={(e) => setBannerForm({ ...bannerForm, altText: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3182F6] bg-white" placeholder="배너 설명" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    {editBannerId && (
                      <button onClick={() => { setEditBannerId(null); setBannerForm({ slotKey: "", imageUrl: "", linkUrl: "", altText: "" }); }} className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300">취소</button>
                    )}
                    <button onClick={saveBanner} className="px-4 py-2 text-xs font-bold text-white bg-[#3182F6] rounded-lg hover:bg-[#1B6CF2]">
                      {editBannerId ? "수정" : "추가"}
                    </button>
                  </div>
                </div>

                {/* Banner List */}
                {banners.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-600">등록된 배너 ({banners.length})</p>
                    {banners.map((b) => (
                      <div key={b.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${b.isActive ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 opacity-60"}`}>
                        <div className="w-14 h-9 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {b.imageUrl && <img src={b.imageUrl} alt={b.altText || ""} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#191F28] font-mono">{"{{BANNER:" + b.slotKey + "}}"}</p>
                          <p className="text-[10px] text-gray-400 truncate">{b.imageUrl?.slice(0, 40)}...</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button onClick={() => toggleBanner(b)} className={`relative w-8 h-4.5 rounded-full transition-colors ${b.isActive ? "bg-[#3182F6]" : "bg-gray-300"}`} style={{ width: 32, height: 18 }}>
                            <span className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full shadow transition-transform ${b.isActive ? "translate-x-[14px]" : "translate-x-0"}`} />
                          </button>
                          <button onClick={() => editBanner(b)} className="text-[10px] text-[#3182F6] font-semibold">수정</button>
                          <button onClick={() => deleteBanner(b.id)} className="text-[10px] text-[#F04452] font-semibold">삭제</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Live Preview */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                  <span className="text-xs font-semibold text-gray-500">미리보기 (배너 치환 적용)</span>
                </div>
                <div className="flex-1 overflow-auto bg-[#F8FAFC]">
                  <iframe
                    srcDoc={(() => {
                      let html = bannerSection.htmlContent;
                      banners.filter((b) => b.isActive).forEach((b) => {
                        const tag = `{{BANNER:${b.slotKey}}}`;
                        const escaped = tag.replace(/[{}]/g, "\\$&");
                        html = html.replace(new RegExp(`url\\(['"]?${escaped}['"]?\\)`, "g"), `url('${b.imageUrl}')`);
                        const img = b.linkUrl
                          ? `<a href="${b.linkUrl}"><img src="${b.imageUrl}" alt="${b.altText || ""}" style="max-width:100%;height:auto;display:block;" /></a>`
                          : `<img src="${b.imageUrl}" alt="${b.altText || ""}" style="max-width:100%;height:auto;display:block;" />`;
                        html = html.replaceAll(tag, img);
                      });
                      return `<!DOCTYPE html><html><head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"><\/script><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>body{margin:0;font-family:'DM Sans',sans-serif}</style></head><body>${html}</body></html>`;
                    })()}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
