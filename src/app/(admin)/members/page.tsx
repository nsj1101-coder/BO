"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

interface PaginatedResponse {
  data: Member[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 20;

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    const res = await fetch(`/api/members?${params}`);
    if (res.ok) {
      const data: PaginatedResponse = await res.json();
      setMembers(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const toggleActive = async (id: number, current: boolean) => {
    const res = await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.ok) fetchMembers();
  };

  const handleExport = async () => {
    const res = await fetch("/api/members/export");
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#191F28]">회원 목록</h3>
          <p className="text-sm text-gray-500 mt-1">총 {total}명의 회원</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/members/settings"
            className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            필드 설정
          </Link>
          <button
            onClick={handleExport}
            className="px-5 py-2.5 bg-[#03B26C] text-white text-sm font-semibold rounded-xl hover:bg-[#029A5E] transition-colors"
          >
            엑셀 다운로드
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="이름, 이메일, 연락처 검색"
            className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30 focus:border-[#3182F6] transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 bg-[#3182F6] text-white text-sm font-semibold rounded-xl hover:bg-[#1B64DA] transition-colors"
        >
          검색
        </button>
      </form>

      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            {search ? "검색 결과가 없습니다." : "등록된 회원이 없습니다."}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">이메일</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">연락처</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">가입일</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((member, idx) => (
                <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-400">{(page - 1) * limit + idx + 1}</td>
                  <td className="px-6 py-4">
                    <Link href={`/members/${member.id}`} className="text-sm font-medium text-[#3182F6] hover:underline">
                      {member.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{member.phone || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(member.createdAt)}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleActive(member.id, member.isActive)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${member.isActive ? "bg-[#3182F6]" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${member.isActive ? "translate-x-5" : ""}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | "...")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-10 h-10 text-sm font-medium rounded-xl transition-colors ${
                    page === p
                      ? "bg-[#3182F6] text-white"
                      : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
