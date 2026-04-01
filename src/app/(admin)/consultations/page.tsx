"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Consultation {
  id: number;
  data: Record<string, string>;
  status: "pending" | "processing" | "completed";
  createdAt: string;
}

interface PaginatedResponse {
  data: Consultation[];
  total: number;
  page: number;
  totalPages: number;
}

const statusConfig = {
  pending: { label: "대기", color: "bg-amber-50 text-amber-700" },
  processing: { label: "처리중", color: "bg-blue-50 text-blue-700" },
  completed: { label: "완료", color: "bg-green-50 text-green-700" },
} as const;

type StatusFilter = "all" | "pending" | "processing" | "completed";

export default function ConsultationsPage() {
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/consultations?${params}`);
    if (res.ok) {
      const data: PaginatedResponse = await res.json();
      setItems(data.consultations || data.data || []);
      setTotalPages(data.totalPages || 1);
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "pending", label: "대기" },
    { key: "processing", label: "처리중" },
    { key: "completed", label: "완료" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[#191F28]">상담 신청 목록</h3>
        <div className="flex gap-2">
          <a href="/consultation" target="_blank" className="px-4 py-2.5 text-sm font-bold text-white bg-[#191F28] rounded-xl hover:bg-[#333D4B] transition-all">사용자 페이지</a>
          <Link href="/consultations/settings" className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">설정</Link>
        </div>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              statusFilter === tab.key
                ? "bg-[#3182F6] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">데이터가 없습니다.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">내용</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">날짜</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item, idx) => {
                const dataEntries = Object.entries(item.data);
                const preview = dataEntries.slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(" / ");
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-400">{(page - 1) * 20 + idx + 1}</td>
                    <td className="px-6 py-4">
                      <Link href={`/consultations/${item.id}`} className="text-sm font-medium text-[#3182F6] hover:underline truncate block max-w-md">
                        {preview || "데이터 없음"}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${statusConfig[item.status].color}`}>
                        {statusConfig[item.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(item.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">이전</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | "...")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className="px-2 text-gray-400">...</span>
              ) : (
                <button key={p} onClick={() => setPage(p as number)} className={`w-10 h-10 text-sm font-medium rounded-xl transition-colors ${page === p ? "bg-[#3182F6] text-white" : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"}`}>{p}</button>
              )
            )}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">다음</button>
        </div>
      )}
    </div>
  );
}
