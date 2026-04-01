"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Consultation {
  id: number;
  data: Record<string, string>;
  status: "pending" | "processing" | "completed";
  adminMemo: string;
  createdAt: string;
  updatedAt: string;
}

const statusOptions = [
  { value: "pending", label: "대기" },
  { value: "processing", label: "처리중" },
  { value: "completed", label: "완료" },
];

export default function ConsultationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("pending");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchItem = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/consultations/${id}`);
    if (res.ok) {
      const data: Consultation = await res.json();
      setItem(data);
      setStatus(data.status);
      setMemo(data.adminMemo || "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/consultations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminMemo: memo }),
    });
    if (res.ok) await fetchItem();
    setSaving(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-7 h-7 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-400">데이터를 찾을 수 없습니다.</p>
        <Link href="/consultations" className="text-sm text-[#3182F6] mt-4 inline-block hover:underline">목록으로</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/consultations" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h3 className="text-xl font-bold text-[#191F28]">상담 상세</h3>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <p className="text-sm text-gray-500">접수일: {formatDate(item.createdAt)}</p>
          <p className="text-sm text-gray-400">수정일: {formatDate(item.updatedAt)}</p>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">제출 데이터</p>
          {Object.entries(item.data).map(([key, value]) => (
            <div key={key} className="grid grid-cols-[140px_1fr] items-start gap-4">
              <label className="text-sm font-semibold text-gray-500">{key}</label>
              <p className="text-sm text-[#191F28] whitespace-pre-wrap">{value || "-"}</p>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="text-sm font-semibold text-gray-500">상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full max-w-xs px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30 focus:border-[#3182F6] transition-all"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[140px_1fr] items-start gap-4">
            <label className="text-sm font-semibold text-gray-500">관리자 메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30 focus:border-[#3182F6] transition-all resize-none"
              placeholder="메모를 입력하세요"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#3182F6] text-white text-sm font-semibold rounded-xl hover:bg-[#1B64DA] disabled:opacity-50 transition-colors"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
