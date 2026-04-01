"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface Template {
  id: number;
  name: string;
  slug: string;
  folderId: number | null;
  category: string;
  htmlContent: string;
  cssContent: string;
  jsContent: string;
  createdAt: string;
}

interface Folder {
  id: number;
  name: string;
  description: string;
  color: string;
  templates: Template[];
}

const CATEGORIES = [
  { value: "header", label: "헤더" },
  { value: "footer", label: "푸터" },
  { value: "hero", label: "히어로" },
  { value: "content", label: "콘텐츠" },
  { value: "banner", label: "배너" },
  { value: "general", label: "일반" },
];

const FOLDER_COLORS = ["#3182F6", "#03B26C", "#F59E0B", "#F04452", "#7C3AED", "#EC4899", "#06B6D4", "#191F28"];

export default function TemplatesPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [unfiled, setUnfiled] = useState<Template[]>([]);
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Template modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", category: "general", folderId: null as number | null, htmlContent: "", cssContent: "", jsContent: "" });
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");

  // Folder modal
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editFolderId, setEditFolderId] = useState<number | null>(null);
  const [folderForm, setFolderForm] = useState({ name: "", description: "", color: "#3182F6" });

  // Pen upload
  const [showPenModal, setShowPenModal] = useState(false);
  const [penFile, setPenFile] = useState<File | null>(null);
  const [penFolderName, setPenFolderName] = useState("");
  const [penUploading, setPenUploading] = useState(false);
  const [penStatus, setPenStatus] = useState("");
  const [penLogs, setPenLogs] = useState<Array<{ step: string; detail: string; isError?: boolean; time?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const activeFolderRef = useRef(activeFolder);
  activeFolderRef.current = activeFolder;

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/folders");
    if (!res.ok) return;
    const data = await res.json();
    setFolders(data.folders);
    setUnfiled(data.unfiled);
    const af = activeFolderRef.current;
    if (af) {
      if (af.id === 0) {
        setActiveFolder({ id: 0, name: "미분류", description: "", color: "#64748B", templates: data.unfiled });
      } else {
        const updated = data.folders.find((f: Folder) => f.id === af.id);
        if (updated) setActiveFolder(updated);
        else setActiveFolder(null);
      }
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Template CRUD
  const openCreate = (folderId?: number) => {
    setEditId(null);
    setForm({ name: "", category: "general", folderId: folderId ?? null, htmlContent: "", cssContent: "", jsContent: "" });
    setActiveTab("html");
    setShowModal(true);
  };

  const openEdit = async (id: number) => {
    const res = await fetch(`/api/templates/${id}`);
    if (!res.ok) return;
    const t = await res.json();
    setEditId(id);
    setForm({ name: t.name, category: t.category, folderId: t.folderId, htmlContent: t.htmlContent, cssContent: t.cssContent, jsContent: t.jsContent });
    setActiveTab("html");
    setShowModal(true);
  };

  const handleSave = async () => {
    const url = editId ? `/api/templates/${editId}` : "/api/templates";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setShowModal(false); fetchData(); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    if (previewTemplate?.id === id) setPreviewTemplate(null);
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    fetchData();
  };

  // Create sub page from folder
  const createSubPageFromFolder = async () => {
    if (!activeFolder || activeFolder.id === 0 || activeFolder.templates.length === 0) return;
    if (!confirm(`"${activeFolder.name}" 폴더의 ${activeFolder.templates.length}개 템플릿으로 서브 페이지를 생성하시겠습니까?`)) return;

    const pageRes = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: activeFolder.name, pageType: "sub" }),
    });
    if (!pageRes.ok) return;
    const page = await pageRes.json();

    for (const t of activeFolder.templates) {
      await fetch(`/api/pages/${page.id}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: t.id }),
      });
    }

    alert(`서브 페이지 "${activeFolder.name}" 생성 완료! (${activeFolder.templates.length}개 섹션)`);
    router.push("/design/sub-page");
  };

  // Drag reorder in folder detail
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
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
  const handleDragEnd = () => {
    setDragging(false);
    setDragIdx(null);
    setOverIdx(null);
    if (!activeFolder || dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    const templates = [...activeFolder.templates];
    const [removed] = templates.splice(dragItem.current, 1);
    templates.splice(dragOverItem.current, 0, removed);
    setActiveFolder({ ...activeFolder, templates });
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Folder CRUD
  const openCreateFolder = () => {
    setEditFolderId(null);
    setFolderForm({ name: "", description: "", color: "#3182F6" });
    setShowFolderModal(true);
  };

  const openEditFolder = (f: Folder) => {
    setEditFolderId(f.id);
    setFolderForm({ name: f.name, description: f.description, color: f.color });
    setShowFolderModal(true);
  };

  const saveFolder = async () => {
    const url = editFolderId ? `/api/folders/${editFolderId}` : "/api/folders";
    const method = editFolderId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(folderForm) });
    if (res.ok) { setShowFolderModal(false); fetchData(); }
  };

  const deleteFolder = async (id: number) => {
    if (!confirm("폴더를 삭제하시겠습니까? 안의 템플릿은 미분류로 이동됩니다.")) return;
    await fetch(`/api/folders/${id}`, { method: "DELETE" });
    fetchData();
  };

  // Pen upload
  const handlePenUpload = async () => {
    if (!penFile) return;
    setPenUploading(true);
    setPenStatus("파일 업로드 중...");

    const formData = new FormData();
    formData.append("file", penFile);
    formData.append("folderName", penFolderName || penFile.name.replace(".pen", ""));

    const uploadRes = await fetch("/api/pen-upload", { method: "POST", body: formData });
    if (!uploadRes.ok) {
      setPenStatus("업로드 실패");
      setPenUploading(false);
      return;
    }

    const { filePath, folderName } = await uploadRes.json();

    setPenStatus("폴더 생성 중...");
    const folderRes = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName, description: `${penFile.name}에서 자동 생성`, color: FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)] }),
    });

    if (!folderRes.ok) {
      setPenStatus("폴더 생성 실패");
      setPenUploading(false);
      return;
    }

    const folder = await folderRes.json();

    setPenStatus("분석 시작...");
    setPenLogs([]);

    try {
      const analyzeRes = await fetch("/api/pen-upload/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, folderId: folder.id }),
      });

      const reader = analyzeRes.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setPenStatus("스트림 연결 실패");
        setPenUploading(false);
        return;
      }

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.step === "done" && data.success) {
              setPenStatus(`완료! ${data.count}개 템플릿 생성: ${data.containers?.join(", ") ?? ""}`);
            } else {
              setPenLogs((prev) => [...prev, data]);
              setPenStatus(`[${data.step}] ${data.detail}`);
              if (data.isError) setPenStatus(`실패: [${data.step}] ${data.detail}`);
            }
          } catch {}
        }
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (e) {
      setPenStatus(`실패: ${e instanceof Error ? e.message : "네트워크 오류"}`);
    }

    setPenUploading(false);
    fetchData();
  };

  const TemplateCard = ({ t }: { t: Template }) => (
    <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-[#191F28] text-sm truncate">{t.name}</h4>
          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#3182F6]/10 text-[#3182F6]">
            {CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
          </span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button onClick={() => openEdit(t.id)} className="px-2.5 py-1 text-[11px] font-semibold text-[#3182F6] bg-[#3182F6]/10 rounded-lg hover:bg-[#3182F6]/20">수정</button>
          <button onClick={() => handleDelete(t.id)} className="px-2.5 py-1 text-[11px] font-semibold text-[#F04452] bg-[#F04452]/10 rounded-lg hover:bg-[#F04452]/20">삭제</button>
        </div>
      </div>
      <div className="bg-gray-100 rounded-lg p-2 h-16 overflow-hidden">
        <pre className="text-[9px] text-gray-500 whitespace-pre-wrap break-all leading-relaxed">{t.htmlContent.slice(0, 150)}</pre>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {activeFolder ? (
          <div className="flex items-center gap-3">
            <button onClick={() => { setActiveFolder(null); setPreviewTemplate(null); }} className="text-gray-400 hover:text-[#191F28] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: activeFolder.color + "18" }}>
              <svg className="w-4 h-4" style={{ color: activeFolder.color }} fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
            </div>
            <div>
              <h3 className="font-bold text-[#191F28] text-sm">{activeFolder.name}</h3>
              <p className="text-[11px] text-gray-400">{activeFolder.templates.length}개 템플릿</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">디자인 세트(폴더)별로 템플릿을 관리합니다.</p>
        )}
        <div className="flex gap-2">
          {!activeFolder && (
            <>
              <button onClick={() => setShowPenModal(true)} className="px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#7C3AED]/20 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                .pen 업로드
              </button>
              <button onClick={openCreateFolder} className="px-4 py-2.5 bg-[#191F28] hover:bg-[#333D4B] text-white text-sm font-bold rounded-xl transition-all">
                + 폴더
              </button>
            </>
          )}
          {activeFolder && activeFolder.id !== 0 && activeFolder.templates.length > 0 && (
            <button onClick={createSubPageFromFolder} className="px-4 py-2.5 bg-[#03B26C] hover:bg-[#029960] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#03B26C]/20">
              서브 페이지 생성
            </button>
          )}
          <button onClick={() => openCreate(activeFolder?.id)} className="px-4 py-2.5 bg-[#3182F6] hover:bg-[#1B6CF2] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#3182F6]/20">
            + 템플릿
          </button>
        </div>
      </div>

      {activeFolder ? (
        /* ===== Left: Template List + Right: Preview ===== */
        <div className="flex gap-6" style={{ height: "calc(100vh - 200px)" }}>
          {/* Left: Template list */}
          <div className="w-[340px] flex-shrink-0 overflow-y-auto space-y-2 pr-2">
            {activeFolder.templates.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-xl p-8 text-center">
                <p className="text-gray-400 text-sm">비어 있는 폴더입니다.</p>
                <button onClick={() => openCreate(activeFolder.id)} className="text-sm text-[#3182F6] font-semibold mt-2 hover:underline">템플릿 추가</button>
              </div>
            ) : (
              activeFolder.templates.map((t, idx) => (
                <div
                  key={t.id}
                  draggable
                  onClick={() => setPreviewTemplate(t)}
                  onDragStart={(e) => { handleDragStart(e, idx); }}
                  onDragEnd={handleDragEnd}
                  onDragEnter={() => handleDragEnter(idx)}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                  style={{
                    transition: "all 0.2s cubic-bezier(0.2,0,0,1)",
                    transform: dragIdx === idx ? "scale(0.97) rotate(0.5deg)" : overIdx === idx && dragging && dragIdx !== idx ? "translateY(3px)" : "none",
                    opacity: dragIdx === idx ? 0.4 : 1,
                  }}
                  className={`bg-white/70 backdrop-blur-xl border rounded-xl p-3 cursor-grab active:cursor-grabbing select-none transition-all group ${
                    previewTemplate?.id === t.id ? "border-[#3182F6] ring-1 ring-[#3182F6] shadow-md" : "border-gray-200/50 hover:shadow-md"
                  } ${overIdx === idx && dragging && dragIdx !== idx ? "ring-2 ring-[#3182F6] bg-[#3182F6]/[0.03]" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {/* Drag indicator */}
                    <div className="text-gray-300 flex-shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" /></svg>
                    </div>
                    <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-[10px] font-bold text-gray-400 flex-shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#191F28] text-sm truncate">{t.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#3182F6]/10 text-[#3182F6]">
                          {CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1" onMouseDown={(e) => e.stopPropagation()} draggable={false} onDragStart={(e) => e.preventDefault()}>
                      <button onClick={(e) => { e.stopPropagation(); router.push(`/design/templates/${t.id}`); }} className="px-2 py-1 text-[10px] font-semibold text-[#3182F6] bg-[#3182F6]/10 rounded hover:bg-[#3182F6]/20">수정</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="px-2 py-1 text-[10px] font-semibold text-[#F04452] bg-[#F04452]/10 rounded hover:bg-[#F04452]/20">삭제</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Preview */}
          <div className="flex-1 bg-white border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {(() => {
              const iframeCss = `body{margin:0;font-family:'DM Sans',sans-serif}`;
              const iframeHead = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"><\/script><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet"><style>${iframeCss}</style></head><body>`;
              const iframeFoot = `</body></html>`;

              const previewHtml = previewTemplate
                ? previewTemplate.htmlContent
                : activeFolder.templates.map((t) => t.htmlContent).join("\n");
              const previewLabel = previewTemplate ? previewTemplate.name : "전체 미리보기";

              return (
                <>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      {previewTemplate && (
                        <button onClick={() => setPreviewTemplate(null)} className="text-gray-400 hover:text-[#191F28] mr-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                      )}
                      <span className="font-bold text-sm text-[#191F28]">{previewLabel}</span>
                      {previewTemplate && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#3182F6]/10 text-[#3182F6]">
                          {CATEGORIES.find((c) => c.value === previewTemplate.category)?.label ?? previewTemplate.category}
                        </span>
                      )}
                    </div>
                    {previewTemplate && (
                      <button onClick={() => router.push(`/design/templates/${previewTemplate.id}`)} className="px-3 py-1.5 text-xs font-semibold text-[#3182F6] bg-[#3182F6]/10 rounded-lg hover:bg-[#3182F6]/20">
                        코드 편집
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-auto bg-[#F8FAFC]">
                    <iframe
                      srcDoc={`${iframeHead}${previewHtml}${iframeFoot}`}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts"
                    />
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : (
        /* ===== Folder List ===== */
        <div className="space-y-3">
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => setActiveFolder(folder)}
              className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: folder.color + "18" }}>
                    <svg className="w-6 h-6" style={{ color: folder.color }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#191F28] text-[15px]">{folder.name}</h3>
                    <p className="text-[12px] text-gray-400 mt-0.5">{folder.templates.length}개 템플릿{folder.description ? ` · ${folder.description}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openEditFolder(folder); }} className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">편집</button>
                    <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className="px-3 py-1.5 text-[11px] font-semibold text-[#F04452] bg-[#F04452]/10 rounded-lg hover:bg-[#F04452]/20">삭제</button>
                  </div>
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          ))}

          {/* Unfiled */}
          {unfiled.length > 0 && (
            <div
              onClick={() => setActiveFolder({ id: 0, name: "미분류", description: "", color: "#64748B", templates: unfiled })}
              className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#191F28] text-[15px]">미분류</h3>
                    <p className="text-[12px] text-gray-400 mt-0.5">{unfiled.length}개 템플릿</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          )}

          {folders.length === 0 && unfiled.length === 0 && (
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-16 text-center shadow-sm">
              <p className="text-gray-400 text-sm">등록된 폴더가 없습니다.</p>
              <div className="flex justify-center gap-3 mt-4">
                <button onClick={() => setShowPenModal(true)} className="text-sm text-[#7C3AED] font-semibold hover:underline">.pen 파일로 시작하기</button>
                <span className="text-gray-300">|</span>
                <button onClick={openCreateFolder} className="text-sm text-[#191F28] font-semibold hover:underline">폴더 만들기</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#191F28]">{editId ? "템플릿 수정" : "템플릿 등록"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">템플릿 이름</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]" placeholder="예: 메인 헤더" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">폴더</label>
                  <select value={form.folderId ?? ""} onChange={(e) => setForm({ ...form, folderId: e.target.value ? Number(e.target.value) : null })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] bg-white">
                    <option value="">미분류</option>
                    {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">카테고리</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] bg-white">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex gap-1 mb-2">
                  {(["html", "css", "js"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === tab ? "bg-[#191F28] text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>
                <textarea
                  value={activeTab === "html" ? form.htmlContent : activeTab === "css" ? form.cssContent : form.jsContent}
                  onChange={(e) => setForm({ ...form, [activeTab === "html" ? "htmlContent" : activeTab === "css" ? "cssContent" : "jsContent"]: e.target.value })}
                  className="w-full h-64 px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#3182F6] resize-none bg-[#FAFBFC]"
                  placeholder={`${activeTab.toUpperCase()} 코드를 입력하세요...`}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">취소</button>
              <button onClick={handleSave} className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B6CF2] shadow-lg shadow-[#3182F6]/20">{editId ? "수정" : "등록"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-[#191F28] mb-4">{editFolderId ? "폴더 수정" : "폴더 생성"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">폴더 이름</label>
                <input value={folderForm.name} onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6]" placeholder="예: 메인 디자인 세트" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">설명</label>
                <input value={folderForm.description} onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6]" placeholder="선택 사항" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">컬러</label>
                <div className="flex gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setFolderForm({ ...folderForm, color: c })}
                      className={`w-8 h-8 rounded-full transition-all ${folderForm.color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowFolderModal(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">취소</button>
              <button onClick={saveFolder} className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B6CF2] shadow-lg shadow-[#3182F6]/20">{editFolderId ? "수정" : "생성"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Pen Upload Modal */}
      {showPenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#191F28]">.pen 파일 업로드</h3>
                <p className="text-xs text-gray-400 mt-0.5">Pencil AI 디자인 파일을 업로드하면 자동으로 컨테이너별 템플릿이 생성됩니다.</p>
              </div>
              <button onClick={() => { setShowPenModal(false); setPenFile(null); setPenStatus(""); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">디자인 세트 이름</label>
                <input value={penFolderName} onChange={(e) => setPenFolderName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7C3AED]" placeholder="예: 메인 디자인 v1" />
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  penFile ? "border-[#7C3AED] bg-[#7C3AED]/5" : "border-gray-200 hover:border-[#7C3AED]/50 hover:bg-gray-50"
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".pen" className="hidden" onChange={(e) => setPenFile(e.target.files?.[0] ?? null)} />
                {penFile ? (
                  <div>
                    <div className="w-12 h-12 mx-auto mb-3 bg-[#7C3AED]/10 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-sm font-semibold text-[#191F28]">{penFile.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(penFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-600">클릭하여 .pen 파일 선택</p>
                    <p className="text-xs text-gray-400 mt-1">Pencil AI에서 내보낸 디자인 파일</p>
                  </div>
                )}
              </div>

              {/* Status */}
              {penStatus && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  penStatus.includes("실패") ? "bg-[#F04452]/10 text-[#F04452]" :
                  penStatus.includes("완료!") ? "bg-[#03B26C]/10 text-[#03B26C]" :
                  "bg-[#3182F6]/10 text-[#3182F6]"
                }`}>
                  {penUploading && <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 align-middle" />}
                  {penStatus}
                </div>
              )}

              {/* Log Console */}
              {penLogs.length > 0 && (
                <div className="bg-[#0F0D2E] rounded-xl p-4 max-h-64 overflow-y-auto font-mono text-xs">
                  {penLogs.map((log, i) => (
                    <div key={i} className={`py-0.5 ${log.isError ? "text-red-400" : "text-gray-300"}`}>
                      <span className="text-gray-500">{log.time?.split("T")[1]?.slice(0, 8) ?? ""}</span>
                      {" "}
                      <span className={log.isError ? "text-red-400 font-bold" : "text-cyan-400"}>[{log.step}]</span>
                      {" "}
                      <span className={log.isError ? "text-red-300" : "text-gray-200"}>{log.detail}</span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowPenModal(false); setPenFile(null); setPenStatus(""); }} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">취소</button>
              <button
                onClick={handlePenUpload}
                disabled={!penFile || penUploading}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#7C3AED] rounded-xl hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/20 disabled:opacity-50 transition-all"
              >
                {penUploading ? "처리 중..." : "업로드 및 분석"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
