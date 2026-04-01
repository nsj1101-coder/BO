"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Board {
  id: number;
  name: string;
  boardId: string;
  boardType: "list" | "album";
  isActive: boolean;
  isSecret: boolean;
  useComment: boolean;
  writeRole: string;
  listRole: string;
  readRole: string;
  commentRole: string;
  customCss: string;
  _count: { posts: number };
  createdAt: string;
}

interface BoardForm {
  name: string;
  boardId: string;
  boardType: "list" | "album";
  isSecret: boolean;
  useComment: boolean;
  writeRole: string;
  listRole: string;
  readRole: string;
  commentRole: string;
}

const defaultForm: BoardForm = {
  name: "",
  boardId: "",
  boardType: "list",
  isSecret: false,
  useComment: true,
  writeRole: "all",
  listRole: "all",
  readRole: "all",
  commentRole: "all",
};

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<BoardForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [cssBoard, setCssBoard] = useState<Board | null>(null);
  const [cssValue, setCssValue] = useState("");
  const [cssSaving, setCssSaving] = useState(false);

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/boards");
    if (res.ok) {
      const data = await res.json();
      setBoards(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  const DEFAULT_BOARD_CSS = `/* ============================
   게시판 기본 스타일
   .board-wrap 하위 요소를 수정하세요
   ============================ */

/* 게시판 컨테이너 */
.board-wrap {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 게시판 제목 */
.board-wrap h1 {
  font-size: 24px;
  font-weight: 700;
  color: #111;
}

/* 리스트형 테이블 */
.board-wrap table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.board-wrap table thead {
  background: #fafafa;
  border-bottom: 1px solid #eee;
}

.board-wrap table th {
  padding: 12px 16px;
  font-weight: 600;
  color: #666;
  font-size: 13px;
}

.board-wrap table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f2f2f2;
}

.board-wrap table tbody tr:hover {
  background: #fafafa;
}

/* 앨범형 카드 그리드 */
.board-wrap .album-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* 앨범형 카드 */
.board-wrap .album-card {
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

/* 페이지네이션 */
.board-wrap .pagination button {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-size: 13px;
}

/* 글쓰기 버튼 */
.board-wrap .write-btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #111;
  border-radius: 8px;
}`;

  const openCssEditor = (board: Board) => {
    setCssBoard(board);
    setCssValue(board.customCss || DEFAULT_BOARD_CSS);
  };

  const saveCss = async () => {
    if (!cssBoard) return;
    setCssSaving(true);
    await fetch(`/api/boards/${cssBoard.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customCss: cssValue }),
    });
    setCssSaving(false);
    setCssBoard(null);
    fetchBoards();
  };

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (board: Board) => {
    setEditId(board.id);
    setForm({
      name: board.name,
      boardId: board.boardId,
      boardType: board.boardType,
      isSecret: board.isSecret,
      useComment: board.useComment,
      writeRole: board.writeRole,
      listRole: board.listRole,
      readRole: board.readRole,
      commentRole: board.commentRole,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const url = editId ? `/api/boards/${editId}` : "/api/boards";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setShowModal(false);
      fetchBoards();
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/boards/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteConfirm(null);
      fetchBoards();
    }
  };

  const handleToggleActive = async (board: Board) => {
    await fetch(`/api/boards/${board.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !board.isActive }),
    });
    fetchBoards();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">게시판을 생성하고 관리합니다.</p>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B64DA] shadow-lg shadow-[#3182F6]/20 transition-all"
        >
          게시판 생성
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : boards.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#3182F6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#3182F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">등록된 게시판이 없습니다.</p>
          <button
            onClick={openCreate}
            className="mt-4 text-sm font-semibold text-[#3182F6] hover:underline"
          >
            첫 게시판 만들기
          </button>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">게시판명</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">ID</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">유형</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">게시글</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">상태</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">설정</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((board) => (
                <tr key={board.id} className="border-b border-gray-50 hover:bg-[#3182F6]/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/boards/${board.id}`} className="font-semibold text-[#191F28] hover:text-[#3182F6] transition-colors">
                      {board.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600">{board.boardId}</code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      board.boardType === "album"
                        ? "bg-[#7C3AED]/10 text-[#7C3AED]"
                        : "bg-[#3182F6]/10 text-[#3182F6]"
                    }`}>
                      {board.boardType === "album" ? "앨범형" : "리스트형"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-[#191F28]">{board._count.posts}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleActive(board)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        board.isActive ? "bg-[#3182F6]" : "bg-gray-200"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        board.isActive ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {board.isSecret && (
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">
                          비밀글
                        </span>
                      )}
                      {board.useComment && (
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-[#03B26C]/10 text-[#03B26C]">
                          댓글
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <a
                        href={`/board/${board.boardId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        미리보기
                      </a>
                      <button
                        onClick={() => openCssEditor(board)}
                        className="px-3 py-1.5 text-[11px] font-semibold text-[#7C3AED] bg-[#7C3AED]/10 rounded-lg hover:bg-[#7C3AED]/20 transition-colors"
                      >
                        CSS
                      </button>
                      <button
                        onClick={() => openEdit(board)}
                        className="px-3 py-1.5 text-[11px] font-semibold text-[#3182F6] bg-[#3182F6]/10 rounded-lg hover:bg-[#3182F6]/20 transition-colors"
                      >
                        수정
                      </button>
                      {deleteConfirm === board.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(board.id)}
                            className="text-xs font-semibold text-[#F04452] hover:underline"
                          >
                            확인
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs font-semibold text-gray-400 hover:underline"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(board.id)}
                          className="px-3 py-1.5 text-[11px] font-semibold text-[#F04452] bg-[#F04452]/10 rounded-lg hover:bg-[#F04452]/20 transition-colors"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#191F28]">
                {editId ? "게시판 수정" : "게시판 생성"}
              </h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">게시판명</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                  placeholder="공지사항"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">게시판 ID</label>
                <input
                  type="text"
                  value={form.boardId}
                  onChange={(e) => setForm({ ...form, boardId: e.target.value.replace(/[^a-z0-9-]/g, "") })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                  placeholder="notice"
                  disabled={!!editId}
                />
                <p className="text-[11px] text-gray-400 mt-1">영문 소문자, 숫자, 하이픈만 사용 가능</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">유형</label>
                <div className="flex gap-3">
                  {(["list", "album"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setForm({ ...form, boardType: type })}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                        form.boardType === type
                          ? "border-[#3182F6] bg-[#3182F6]/5 text-[#3182F6]"
                          : "border-gray-200 text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {type === "list" ? "리스트형" : "앨범형"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-500">비밀글</label>
                  <button
                    onClick={() => setForm({ ...form, isSecret: !form.isSecret })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.isSecret ? "bg-[#3182F6]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      form.isSecret ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-500">댓글</label>
                  <button
                    onClick={() => setForm({ ...form, useComment: !form.useComment })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.useComment ? "bg-[#3182F6]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      form.useComment ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-3">권한 설정</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: "writeRole" as const, label: "글쓰기 권한" },
                    { key: "listRole" as const, label: "리스트 권한" },
                    { key: "readRole" as const, label: "글내용 권한" },
                    { key: "commentRole" as const, label: "댓글쓰기 권한" },
                  ]).map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-[11px] text-gray-400 mb-1">{label}</label>
                      <select
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] bg-white transition-all"
                      >
                        <option value="all">전체</option>
                        <option value="admin">관리자</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.boardId}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B64DA] shadow-lg shadow-[#3182F6]/20 disabled:opacity-50 transition-all"
              >
                {saving ? "저장 중..." : editId ? "수정" : "생성"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Editor Modal */}
      {cssBoard && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Header */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setCssBoard(null)} className="text-gray-400 hover:text-[#191F28] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div>
                <h3 className="font-bold text-[#191F28]">{cssBoard.name} — CSS 편집</h3>
                <p className="text-[11px] text-gray-400">.board-wrap 하위 요소를 수정하면 유저 페이지에 실시간 반영됩니다</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setCssValue(DEFAULT_BOARD_CSS)} className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">
                기본값 복원
              </button>
              <button onClick={saveCss} disabled={cssSaving} className="px-5 py-2 text-sm font-bold text-white bg-[#7C3AED] rounded-lg hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/20 disabled:opacity-50">
                {cssSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>

          {/* Editor + Preview */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: CSS editor */}
            <div className="w-1/2 flex flex-col border-r border-gray-200">
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">CSS 에디터</span>
                <span className="text-[10px] text-gray-400">{cssValue.length}자</span>
              </div>
              <textarea
                value={cssValue}
                onChange={(e) => setCssValue(e.target.value)}
                className="flex-1 px-5 py-4 text-[13px] font-mono text-gray-800 bg-[#1E1B2E] text-gray-200 resize-none focus:outline-none leading-relaxed"
                style={{ color: "#E2E8F0", background: "#1E1B2E", caretColor: "#3182F6", tabSize: 2 }}
                spellCheck={false}
              />
            </div>

            {/* Right: Preview */}
            <div className="w-1/2 flex flex-col">
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">실시간 미리보기</span>
                <a href={`/board/${cssBoard.boardId}`} target="_blank" className="text-[10px] font-semibold text-[#3182F6] hover:underline">유저 페이지 열기 ↗</a>
              </div>
              <div className="flex-1 overflow-auto bg-white">
                <iframe
                  srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}${cssValue.replace(/</g,'\\x3c')}</style></head><body><div class="board-wrap" style="padding:40px 20px;max-width:960px;margin:0 auto"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px"><div><h1 style="margin:0">${cssBoard.name}</h1><p style="color:#888;font-size:14px;margin-top:6px">총 5개의 게시글</p></div><button class="write-btn" style="border:none;cursor:pointer">글쓰기</button></div><table><thead><tr><th style="width:60px;text-align:center">번호</th><th>제목</th><th style="width:100px;text-align:center">작성자</th><th style="width:100px;text-align:center">날짜</th><th style="width:60px;text-align:center">조회</th></tr></thead><tbody><tr><td style="text-align:center">5</td><td style="font-weight:500">신규 프로그램 안내</td><td style="text-align:center;font-size:13px">관리자</td><td style="text-align:center;font-size:13px">2026.04.01</td><td style="text-align:center;font-size:13px">42</td></tr><tr><td style="text-align:center">4</td><td style="font-weight:500">🔒 비밀 게시글입니다</td><td style="text-align:center;font-size:13px">사용자</td><td style="text-align:center;font-size:13px">2026.03.31</td><td style="text-align:center;font-size:13px">12</td></tr><tr><td style="text-align:center">3</td><td style="font-weight:500">시스템 점검 안내 <span style="color:#3182F6;font-size:12px;font-weight:600">[2]</span></td><td style="text-align:center;font-size:13px">관리자</td><td style="text-align:center;font-size:13px">2026.03.30</td><td style="text-align:center;font-size:13px">89</td></tr><tr><td style="text-align:center">2</td><td style="font-weight:500">이용약관 변경 안내</td><td style="text-align:center;font-size:13px">관리자</td><td style="text-align:center;font-size:13px">2026.03.28</td><td style="text-align:center;font-size:13px">156</td></tr><tr><td style="text-align:center">1</td><td style="font-weight:500">서비스 오픈 안내</td><td style="text-align:center;font-size:13px">관리자</td><td style="text-align:center;font-size:13px">2026.03.25</td><td style="text-align:center;font-size:13px">203</td></tr></tbody></table><div class="pagination" style="display:flex;justify-content:center;gap:4px;margin-top:32px"><button style="border:1px solid #111;background:#111;color:#fff;cursor:pointer">1</button><button style="border:1px solid #e8e8e8;background:#fff;color:#666;cursor:pointer">2</button><button style="border:1px solid #e8e8e8;background:#fff;color:#666;cursor:pointer">3</button></div></div></body></html>`}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
