"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
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
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  imageUrl: string | null;
  isSecret: boolean;
  viewCount: number;
  _count: { comments: number };
  createdAt: string;
}

interface PostForm {
  title: string;
  content: string;
  author: string;
  imageUrl: string;
}

const defaultPostForm: PostForm = {
  title: "",
  content: "",
  author: "",
  imageUrl: "",
};

export default function BoardDetailPage() {
  const params = useParams();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<PostForm>(defaultPostForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchBoard = useCallback(async () => {
    const res = await fetch(`/api/boards/${boardId}`);
    if (res.ok) {
      const data = await res.json();
      setBoard(data);
    }
  }, [boardId]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/posts?boardId=${boardId}&page=${page}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [boardId, page]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async () => {
    setSaving(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, boardId: Number(boardId) }),
    });
    setSaving(false);
    if (res.ok) {
      setShowModal(false);
      setForm(defaultPostForm);
      fetchPosts();
    }
  };

  const handleDeletePost = async (id: number) => {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteConfirm(null);
      fetchPosts();
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  if (!board) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/boards"
          className="p-2 text-gray-400 hover:text-[#191F28] hover:bg-gray-100 rounded-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-[#191F28]">{board.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded-md text-gray-500">{board.boardId}</code>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              board.boardType === "album" ? "bg-[#7C3AED]/10 text-[#7C3AED]" : "bg-[#3182F6]/10 text-[#3182F6]"
            }`}>
              {board.boardType === "album" ? "앨범형" : "리스트형"}
            </span>
            {board.isSecret && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">비밀글</span>
            )}
            {board.useComment && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#03B26C]/10 text-[#03B26C]">댓글</span>
            )}
            {!board.isActive && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#F04452]/10 text-[#F04452]">비활성</span>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setForm(defaultPostForm);
            setShowModal(true);
          }}
          className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B64DA] shadow-lg shadow-[#3182F6]/20 transition-all"
        >
          글쓰기
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#3182F6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#3182F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">게시글이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-center px-4 py-4 font-semibold text-gray-500 text-xs w-14">#</th>
                <th className="text-left px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">제목</th>
                <th className="text-left px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider w-24">작성자</th>
                <th className="text-center px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider w-20">조회수</th>
                <th className="text-center px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider w-20">댓글</th>
                <th className="text-center px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider w-28">작성일</th>
                <th className="text-right px-4 py-4 font-semibold text-gray-500 text-xs w-16">관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, idx) => (
                <tr key={post.id} className="border-b border-gray-50 hover:bg-[#3182F6]/[0.02] transition-colors">
                  <td className="px-4 py-3.5 text-center text-gray-400 text-xs">
                    {(page - 1) * 20 + idx + 1}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {post.isSecret && (
                        <svg className="w-4 h-4 text-[#F59E0B] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                      <span className="font-medium text-[#191F28] truncate">{post.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{post.author}</td>
                  <td className="px-4 py-3.5 text-center text-gray-500">{post.viewCount}</td>
                  <td className="px-4 py-3.5 text-center">
                    {post._count.comments > 0 ? (
                      <span className="text-[#3182F6] font-semibold">{post._count.comments}</span>
                    ) : (
                      <span className="text-gray-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-400 text-xs">{formatDate(post.createdAt)}</td>
                  <td className="px-4 py-3.5 text-right">
                    {deleteConfirm === post.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDeletePost(post.id)}
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
                        onClick={() => setDeleteConfirm(post.id)}
                        className="p-1.5 text-gray-400 hover:text-[#F04452] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-[#191F28] disabled:opacity-30 transition-colors"
              >
                이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                    p === page
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-[#191F28] disabled:opacity-30 transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#191F28]">글쓰기</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">제목</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                  placeholder="게시글 제목"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">작성자</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                  placeholder="작성자명"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">내용</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all resize-none"
                  placeholder="게시글 내용을 입력하세요"
                />
              </div>
              {board.boardType === "album" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">이미지 URL</label>
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreatePost}
                disabled={saving || !form.title || !form.content || !form.author}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B64DA] shadow-lg shadow-[#3182F6]/20 disabled:opacity-50 transition-all"
              >
                {saving ? "저장 중..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
