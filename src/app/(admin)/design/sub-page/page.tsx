"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface Template {
  id: number;
  name: string;
  category: string;
}

interface Section {
  id: number;
  sortOrder: number;
  isFixed: boolean;
  fixPosition: string | null;
  isActive: boolean;
  htmlContent: string;
  cssContent: string;
  jsContent: string;
  template: Template;
}

interface Page {
  id: number;
  title: string;
  slug: string;
  isActive: boolean;
  sections: Section[];
}

export default function SubPageManagement() {
  const [pages, setPages] = useState<Page[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  // Edit modal
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [editTab, setEditTab] = useState<"html" | "css" | "js">("html");
  const [editContent, setEditContent] = useState({ html: "", css: "", js: "" });

  // Drag
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const fetchPages = useCallback(async () => {
    const res = await fetch("/api/pages?type=sub");
    if (res.ok) {
      const allPages = await res.json();
      setPages(allPages);
      if (selectedPage) {
        setSelectedPage(allPages.find((p: Page) => p.id === selectedPage.id) ?? null);
      }
    }
  }, [selectedPage]);

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/templates");
    if (res.ok) setTemplates(await res.json());
  }, []);

  useEffect(() => {
    fetchPages();
    fetchTemplates();
  }, []);

  const refreshPages = async () => {
    const res = await fetch("/api/pages?type=sub");
    if (res.ok) {
      const allPages = await res.json();
      setPages(allPages);
      if (selectedPage) {
        setSelectedPage(allPages.find((p: Page) => p.id === selectedPage.id) ?? null);
      }
    }
  };

  const deletePage = async (page: Page) => {
    if (!confirm(`"${page.title}" 서브 페이지를 삭제하시겠습니까? 포함된 섹션도 모두 삭제됩니다.`)) return;
    await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
    if (selectedPage?.id === page.id) setSelectedPage(null);
    refreshPages();
  };

  const togglePage = async (page: Page) => {
    await fetch(`/api/pages/${page.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !page.isActive }),
    });
    refreshPages();
  };

  const createPage = async () => {
    if (!newTitle.trim()) return;
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, pageType: "sub" }),
    });
    if (res.ok) {
      setShowCreate(false);
      setNewTitle("");
      refreshPages();
    }
  };

  const addSection = async () => {
    if (!selectedPage || !selectedTemplate) return;
    await fetch(`/api/pages/${selectedPage.id}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: selectedTemplate }),
    });
    setShowAddSection(false);
    setSelectedTemplate(null);
    refreshPages();
  };

  const deleteSection = async (sectionId: number) => {
    if (!selectedPage || !confirm("이 섹션을 삭제하시겠습니까?")) return;
    await fetch(`/api/pages/${selectedPage.id}/sections/${sectionId}`, { method: "DELETE" });
    refreshPages();
  };

  const toggleSection = async (section: Section) => {
    if (!selectedPage) return;
    await fetch(`/api/pages/${selectedPage.id}/sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !section.isActive }),
    });
    refreshPages();
  };

  // Edit
  const openEdit = (section: Section) => {
    setEditSection(section);
    setEditContent({ html: section.htmlContent, css: section.cssContent, js: section.jsContent });
    setEditTab("html");
  };

  const saveEdit = async () => {
    if (!editSection || !selectedPage) return;
    await Promise.all([
      fetch(`/api/templates/${editSection.template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editSection.template.name, category: editSection.template.category, htmlContent: editContent.html, cssContent: editContent.css, jsContent: editContent.js }),
      }),
      fetch(`/api/pages/${selectedPage.id}/sections/${editSection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent: editContent.html, cssContent: editContent.css, jsContent: editContent.js }),
      }),
    ]);
    setEditSection(null);
    refreshPages();
  };

  // Drag
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    dragItem.current = idx;
    setDragIdx(idx);
    setDragging(true);
    e.dataTransfer.effectAllowed = "move";
    const el = e.currentTarget as HTMLElement;
    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.style.width = `${el.offsetWidth}px`;
    ghost.style.opacity = "0.85";
    ghost.style.transform = "rotate(1deg) scale(1.02)";
    ghost.style.boxShadow = "0 12px 40px rgba(49,130,246,0.25)";
    ghost.style.border = "2px solid #3182F6";
    ghost.style.borderRadius = "12px";
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };
  const handleDragEnter = (idx: number) => { dragOverItem.current = idx; setOverIdx(idx); };
  const handleDragEnd = async () => {
    setDragging(false);
    setDragIdx(null);
    setOverIdx(null);
    if (!selectedPage || dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    const sections = [...selectedPage.sections];
    const [removed] = sections.splice(dragItem.current, 1);
    sections.splice(dragOverItem.current, 0, removed);
    setSelectedPage({ ...selectedPage, sections });
    dragItem.current = null;
    dragOverItem.current = null;
    await fetch(`/api/pages/${selectedPage.id}/sections/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: sections.map((s, i) => ({ id: s.id, sortOrder: i })) }),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">서브 페이지를 생성하고 관리합니다. 메인 페이지의 고정 영역이 자동으로 포함됩니다.</p>
        <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-[#3182F6] hover:bg-[#1B6CF2] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#3182F6]/20">
          + 서브 페이지 생성
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Page List */}
        <div className="lg:col-span-1 space-y-3">
          {pages.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-8 text-center shadow-sm">
              <p className="text-gray-400 text-sm">서브 페이지가 없습니다.</p>
            </div>
          ) : (
            pages.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPage(p)}
                className={`w-full text-left bg-white/70 backdrop-blur-xl border rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all cursor-pointer ${
                  !p.isActive ? "opacity-50" : ""
                } ${
                  selectedPage?.id === p.id ? "border-[#3182F6] ring-1 ring-[#3182F6]" : "border-gray-200/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#191F28]">{p.title}</h4>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => togglePage(p)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${p.isActive ? "bg-[#3182F6]" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${p.isActive ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                    <a href={`/preview?id=${p.id}`} target="_blank" className="text-[10px] font-semibold text-[#3182F6] bg-[#3182F6]/10 px-2 py-1 rounded hover:bg-[#3182F6]/20 transition-colors">
                      미리보기
                    </a>
                    <button onClick={() => deletePage(p)} className="text-[10px] font-semibold text-[#F04452] bg-[#F04452]/10 px-2 py-1 rounded hover:bg-[#F04452]/20 transition-colors">
                      삭제
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {p.sections.length}개 섹션 · page?id={p.id}
                  {!p.isActive && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 font-semibold">비활성</span>}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Page Detail */}
        <div className="lg:col-span-2">
          {selectedPage ? (
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#191F28]">{selectedPage.title}</h3>
                <div className="flex gap-2">
                  <a href={`/preview?id=${selectedPage.id}`} target="_blank" className="px-4 py-2 text-xs font-bold text-white bg-[#191F28] rounded-lg hover:bg-[#333D4B] transition-colors">
                    미리보기
                  </a>
                  <button onClick={() => setShowAddSection(true)} className="px-4 py-2 text-xs font-bold text-[#3182F6] bg-[#3182F6]/10 rounded-lg hover:bg-[#3182F6]/20 transition-colors">
                    + 섹션 추가
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {selectedPage.sections.map((s, idx) => (
                  <div
                    key={s.id}
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
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-grab active:cursor-grabbing select-none ${
                      !s.isActive ? "bg-gray-50 opacity-50" : "bg-gray-50"
                    } ${overIdx === idx && dragging && dragIdx !== idx ? "ring-2 ring-[#3182F6] bg-[#3182F6]/[0.03] shadow-md" : "hover:shadow-md"}`}
                  >
                    {/* Drag indicator */}
                    <div className="text-gray-300">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                      </svg>
                    </div>

                    <span className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-xs font-bold text-gray-400 shadow-sm">{idx + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#191F28]">{s.template.name}</p>
                      <div className="flex gap-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3182F6]/10 text-[#3182F6] font-semibold">{s.template.category}</span>
                        {s.isFixed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#03B26C]/10 text-[#03B26C] font-semibold">공통</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5" onMouseDown={(e) => e.stopPropagation()} draggable={false} onDragStart={(e) => e.preventDefault()}>
                      <button onClick={() => toggleSection(s)} className={`relative w-9 h-5 rounded-full transition-colors ${s.isActive ? "bg-[#3182F6]" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.isActive ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                      <button onClick={() => openEdit(s)} className="px-2 py-1 text-[10px] font-semibold text-[#3182F6] bg-[#3182F6]/10 rounded hover:bg-[#3182F6]/20">편집</button>
                      <button onClick={() => deleteSection(s.id)} className="px-2 py-1 text-[10px] font-semibold text-[#F04452] bg-[#F04452]/10 rounded hover:bg-[#F04452]/20">삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-16 text-center shadow-sm">
              <p className="text-gray-400 text-sm">왼쪽에서 서브 페이지를 선택하세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Page Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-[#191F28] mb-4">서브 페이지 생성</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">페이지 제목</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] bg-white" placeholder="예: 회사소개" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">취소</button>
              <button onClick={createPage} className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B6CF2] shadow-lg shadow-[#3182F6]/20">생성</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-[#191F28] mb-4">섹션 추가</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">템플릿 선택</label>
              <select value={selectedTemplate ?? ""} onChange={(e) => setSelectedTemplate(Number(e.target.value))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] bg-white">
                <option value="">선택하세요</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddSection(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">취소</button>
              <button onClick={addSection} className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B6CF2] shadow-lg shadow-[#3182F6]/20">추가</button>
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
              <button onClick={saveEdit} className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B6CF2] shadow-lg shadow-[#3182F6]/20">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
