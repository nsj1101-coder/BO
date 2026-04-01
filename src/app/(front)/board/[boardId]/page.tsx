"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

interface Board {
  id: number;
  name: string;
  boardId: string;
  boardType: string;
  isSecret: boolean;
  useComment: boolean;
  writeRole: string;
  customCss: string;
  isActive: boolean;
}

interface Post {
  id: number;
  title: string;
  author: string;
  isSecret: boolean;
  viewCount: number;
  imageUrl: string | null;
  createdAt: string;
  _count: { comments: number };
}

interface PostForm {
  title: string;
  content: string;
  author: string;
  password: string;
  imageUrl: string;
}

const emptyForm: PostForm = { title: "", content: "", author: "", password: "", imageUrl: "" };

function BoardListContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const boardSlug = params.boardId as string;
  const currentPage = Number(searchParams.get("page") || "1");

  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [writeOpen, setWriteOpen] = useState(false);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [topHtml, setTopHtml] = useState<string[]>([]);
  const [bottomHtml, setBottomHtml] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => { if (r.ok) setIsAdmin(true); }).catch(() => {});
    fetch("/api/front/fixed-sections").then((r) => r.json()).then((d) => { setTopHtml(d.top || []); setBottomHtml(d.bottom || []); }).catch(() => {});
  }, []);

  const fetchBoard = useCallback(async () => {
    const res = await fetch("/api/boards");
    const boards: Board[] = await res.json();
    const found = boards.find((b) => b.boardId === boardSlug);
    if (found) setBoard(found);
    return found || null;
  }, [boardSlug]);

  const fetchPosts = useCallback(async (boardDbId: number) => {
    setLoading(true);
    const res = await fetch(`/api/posts?boardId=${boardDbId}&page=${currentPage}`);
    const data = await res.json();
    setPosts(data.posts); setTotalPages(data.totalPages); setTotal(data.total);
    setLoading(false);
  }, [currentPage]);

  useEffect(() => { fetchBoard().then((b) => { if (b) fetchPosts(b.id); }); }, [fetchBoard, fetchPosts]);

  const canWrite = board && (board.writeRole === "all" || (board.writeRole === "admin" && isAdmin));

  const handleWrite = async () => {
    if (!board) return;
    setSaving(true);
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId: board.id, title: form.title, content: form.content, author: form.author, password: form.password || null, isSecret: !!form.password, imageUrl: form.imageUrl || null }),
    });
    setSaving(false); setWriteOpen(false); setForm(emptyForm); fetchPosts(board.id);
  };

  const fmt = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "");
  };

  const goPage = (p: number) => router.push(`/board/${boardSlug}?page=${p}`);

  const S: Record<string, React.CSSProperties> = {
    wrap: { background: "#fff", minHeight: "60vh", fontFamily: "'Pretendard',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },
    container: { maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" },
    containerAlbum: { maxWidth: 1080, margin: "0 auto", padding: "48px 24px 80px" },
    title: { fontSize: 24, fontWeight: 700, color: "#191f28", margin: 0, letterSpacing: "-0.5px" },
    subtitle: { fontSize: 14, color: "#8b95a1", marginTop: 8 },
    row: { display: "flex", alignItems: "center", padding: "20px 0", borderBottom: "1px solid #f2f4f6", cursor: "pointer", gap: 16, transition: "background 0.1s" },
    rowNum: { width: 32, textAlign: "center" as const, fontSize: 13, color: "#b0b8c1", flexShrink: 0 },
    rowTitle: { flex: 1, fontSize: 15, fontWeight: 500, color: "#333d4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
    rowMeta: { fontSize: 13, color: "#8b95a1", flexShrink: 0 },
    commentBadge: { marginLeft: 6, fontSize: 12, color: "#3182f6", fontWeight: 600 },
    card: { borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" },
    cardImg: { width: "100%", aspectRatio: "1/0.67", objectFit: "cover" as const, display: "block", background: "#f2f4f6" },
    cardBody: { padding: "16px 4px" },
    cardTitle: { fontSize: 16, fontWeight: 600, color: "#191f28", margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
    cardMeta: { fontSize: 13, color: "#8b95a1", marginTop: 8 },
    btn: { padding: "10px 24px", fontSize: 14, fontWeight: 600, color: "#fff", background: "#191f28", border: "none", borderRadius: 8, cursor: "pointer" },
    pageBtn: { width: 36, height: 36, borderRadius: 8, fontSize: 14, border: "none", cursor: "pointer", fontWeight: 500 },
  };

  if (!board && !loading) {
    return <div style={{ ...S.wrap, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}><p style={{ color: "#b0b8c1", fontSize: 15 }}>게시판을 찾을 수 없습니다.</p></div>;
  }

  const isAlbum = board?.boardType === "album";

  return (
    <>
      <style>{`body{margin:0;background:#fff;font-family:'Pretendard',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}`}</style>

      {topHtml.map((h, i) => <div key={`t${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}
      {board?.customCss && <style dangerouslySetInnerHTML={{ __html: board.customCss }} />}

      <div className="board-wrap" style={S.wrap}>
        <div style={isAlbum ? S.containerAlbum : S.container}>
          {board && (
            <>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid #f2f4f6" }}>
                <div>
                  <h1 style={S.title}>{board.name}</h1>
                  <p style={S.subtitle}>총 {total}건</p>
                </div>
                {canWrite && (
                  <button onClick={() => { setForm(emptyForm); setWriteOpen(true); }} style={S.btn}>글쓰기</button>
                )}
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: "#b0b8c1", fontSize: 14 }}>불러오는 중...</div>
              ) : posts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: "#b0b8c1", fontSize: 15 }}>게시글이 없습니다.</div>
              ) : isAlbum ? (
                /* ===== Album Grid (토스피드 스타일) ===== */
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
                  {posts.map((p) => (
                    <a key={p.id} href={`/board/${boardSlug}/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div
                        className="album-card"
                        style={S.card}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.title} style={S.cardImg} />
                        ) : (
                          <div style={{ ...S.cardImg, display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 14, background: "#f9fafb" }}>No Image</div>
                        )}
                        <div style={S.cardBody}>
                          <p style={S.cardTitle}>{p.isSecret ? "🔒 " : ""}{p.title}</p>
                          <div style={{ ...S.cardMeta, display: "flex", justifyContent: "space-between" }}>
                            <span>{p.author}</span>
                            <span>{fmt(p.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                /* ===== List (토스 공지 스타일) ===== */
                <div>
                  {posts.map((p, idx) => (
                    <div
                      key={p.id}
                      style={S.row}
                      onClick={() => router.push(`/board/${boardSlug}/${p.id}`)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#fafbfc"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={S.rowNum}>{total - (currentPage - 1) * 20 - idx}</span>
                      <span style={S.rowTitle}>
                        {p.isSecret ? "🔒 " : ""}{p.title}
                        {p._count.comments > 0 && <span style={S.commentBadge}>[{p._count.comments}]</span>}
                      </span>
                      <span style={{ ...S.rowMeta, width: 64 }}>{p.author}</span>
                      <span style={{ ...S.rowMeta, width: 80, textAlign: "right" }}>{fmt(p.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 48 }}>
                  {currentPage > 1 && (
                    <button onClick={() => goPage(currentPage - 1)} style={{ ...S.pageBtn, background: "#fff", color: "#4e5968", border: "1px solid #e5e8eb" }}>←</button>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => goPage(p)} style={{ ...S.pageBtn, background: p === currentPage ? "#191f28" : "#fff", color: p === currentPage ? "#fff" : "#4e5968", border: p === currentPage ? "none" : "1px solid #e5e8eb" }}>
                      {p}
                    </button>
                  ))}
                  {currentPage < totalPages && (
                    <button onClick={() => goPage(currentPage + 1)} style={{ ...S.pageBtn, background: "#fff", color: "#4e5968", border: "1px solid #e5e8eb" }}>→</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {bottomHtml.map((h, i) => <div key={`b${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}

      {/* Write Modal */}
      {writeOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setWriteOpen(false)} />
          <div style={{ position: "relative", background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#191f28", margin: "0 0 24px" }}>글쓰기</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4e5968", marginBottom: 8 }}>제목</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: "100%", padding: "12px 16px", border: "1px solid #e5e8eb", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }} placeholder="제목을 입력하세요" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4e5968", marginBottom: 8 }}>내용</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} style={{ width: "100%", padding: "12px 16px", border: "1px solid #e5e8eb", borderRadius: 10, fontSize: 15, outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }} placeholder="내용을 입력하세요" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: board?.isSecret ? "1fr 1fr" : "1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4e5968", marginBottom: 8 }}>작성자</label>
                  <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} style={{ width: "100%", padding: "12px 16px", border: "1px solid #e5e8eb", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }} placeholder="작성자" />
                </div>
                {board?.isSecret && (
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4e5968", marginBottom: 8 }}>비밀번호</label>
                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ width: "100%", padding: "12px 16px", border: "1px solid #e5e8eb", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }} placeholder="비밀번호" />
                  </div>
                )}
              </div>
              {board?.boardType === "album" && (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4e5968", marginBottom: 8 }}>이미지 URL</label>
                  <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} style={{ width: "100%", padding: "12px 16px", border: "1px solid #e5e8eb", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }} placeholder="https://..." />
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button onClick={() => setWriteOpen(false)} style={{ padding: "12px 24px", fontSize: 15, color: "#4e5968", background: "#f2f4f6", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 500 }}>취소</button>
              <button onClick={handleWrite} disabled={saving || !form.title || !form.author || !form.content} style={{ padding: "12px 24px", fontSize: 15, fontWeight: 600, color: "#fff", background: !form.title || !form.author || !form.content ? "#d1d5db" : "#191f28", border: "none", borderRadius: 10, cursor: "pointer" }}>
                {saving ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function BoardListPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 32, height: 32, border: "3px solid #3182f6", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
      <BoardListContent />
    </Suspense>
  );
}
