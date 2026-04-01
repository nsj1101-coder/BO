"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Board {
  id: number;
  name: string;
  boardId: string;
  boardType: string;
  useComment: boolean;
}

interface Comment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  isSecret: boolean;
  viewCount: number;
  imageUrl: string | null;
  createdAt: string;
  board: Board;
  comments: Comment[];
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boardSlug = params.boardId as string;
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [topHtml, setTopHtml] = useState<string[]>([]);
  const [bottomHtml, setBottomHtml] = useState<string[]>([]);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/posts/${postId}`);
    if (res.ok) setPost(await res.json());
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchPost();
    fetch("/api/front/fixed-sections").then((r) => r.json()).then((d) => { setTopHtml(d.top || []); setBottomHtml(d.bottom || []); }).catch(() => {});
  }, [fetchPost]);

  const handleComment = async () => {
    if (!commentAuthor || !commentContent) return;
    setSubmitting(true);
    await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: commentAuthor, content: commentContent }),
    });
    setCommentAuthor("");
    setCommentContent("");
    setSubmitting(false);
    fetchPost();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const base: React.CSSProperties = {
    maxWidth: 800,
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  if (loading) {
    return (
      <div style={base}>
        <p style={{ textAlign: "center", color: "#aaa", fontSize: 14 }}>불러오는 중...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={base}>
        <p style={{ textAlign: "center", color: "#aaa", fontSize: 14 }}>게시글을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <>
    {topHtml.map((h, i) => <div key={`t${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}
    <div style={base}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0, lineHeight: 1.4 }}>
          {post.title}
        </h1>
        <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 13, color: "#999" }}>
          <span style={{ color: "#555", fontWeight: 500 }}>{post.author}</span>
          <span>{formatDate(post.createdAt)}</span>
          <span>조회 {post.viewCount}</span>
        </div>
      </div>

      <div
        style={{
          border: "1px solid #e8e8e8",
          borderRadius: 12,
          backgroundColor: "#fff",
          padding: 28,
          marginBottom: 32,
          minHeight: 200,
        }}
      >
        {post.imageUrl && (
          <div style={{ marginBottom: 20 }}>
            <img
              src={post.imageUrl}
              alt={post.title}
              style={{ maxWidth: "100%", borderRadius: 8 }}
            />
          </div>
        )}
        <div
          style={{ fontSize: 15, lineHeight: 1.8, color: "#333", whiteSpace: "pre-wrap" }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      {post.board.useComment && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 16 }}>
            댓글 {post.comments.length}
          </h3>

          {post.comments.length > 0 && (
            <div style={{ border: "1px solid #e8e8e8", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
              {post.comments.map((c, idx) => (
                <div
                  key={c.id}
                  style={{
                    padding: "14px 20px",
                    borderBottom: idx < post.comments.length - 1 ? "1px solid #f2f2f2" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{c.author}</span>
                    <span style={{ fontSize: 12, color: "#bbb" }}>{formatDate(c.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#555", margin: 0, lineHeight: 1.6 }}>{c.content}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ border: "1px solid #e8e8e8", borderRadius: 12, padding: 16, backgroundColor: "#fafafa" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <input
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                placeholder="작성자"
                style={{
                  width: 140,
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  backgroundColor: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="댓글을 입력하세요"
                rows={3}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  resize: "none",
                  backgroundColor: "#fff",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleComment}
                disabled={submitting || !commentAuthor || !commentContent}
                style={{
                  padding: "0 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                  backgroundColor: !commentAuthor || !commentContent ? "#ccc" : "#111",
                  border: "none",
                  borderRadius: 8,
                  cursor: !commentAuthor || !commentContent ? "default" : "pointer",
                  alignSelf: "flex-end",
                  height: 40,
                }}
              >
                {submitting ? "..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <button
          onClick={() => router.push(`/board/${boardSlug}`)}
          style={{
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 500,
            color: "#666",
            backgroundColor: "#f2f2f2",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          목록으로
        </button>
      </div>
    </div>
    {bottomHtml.map((h, i) => <div key={`b${i}`} dangerouslySetInnerHTML={{ __html: h }} />)}
    </>
  );
}
