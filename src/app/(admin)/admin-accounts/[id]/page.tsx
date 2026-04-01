"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface AdminDetail {
  id: number;
  loginId: string;
  name: string;
  role: "super" | "admin";
  isActive: boolean;
  permissions: string;
  canManageAdmins: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminLog {
  id: number;
  adminId: number;
  action: string;
  detail: string | null;
  ip: string | null;
  createdAt: string;
}

const MENU_LABELS: Record<string, string> = {
  dashboard: "대시보드",
  "design/main-page": "메인 페이지 관리",
  "design/sub-page": "서브 페이지 관리",
  "design/templates": "템플릿 관리",
  popups: "팝업 관리",
  boards: "게시판 관리",
  faq: "FAQ 관리",
  settings: "설정",
  "admin-accounts": "계정 관리",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }) +
    " " +
    d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminDetail | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const checkPermission = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (!res.ok) { router.push("/login"); return; }
    const user = await res.json();
    if (user.role === "super" || user.canManageAdmins) {
      setAuthorized(true);
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [adminRes, logsRes] = await Promise.all([
      fetch(`/api/admins/${id}`),
      fetch(`/api/admins/${id}/logs`),
    ]);
    if (adminRes.ok) setAdmin(await adminRes.json());
    if (logsRes.ok) setLogs(await logsRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { checkPermission(); }, [checkPermission]);
  useEffect(() => { if (authorized) fetchData(); }, [authorized, fetchData]);

  if (!authorized || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-gray-500">계정을 찾을 수 없습니다.</p>
        <Link href="/admin-accounts" className="text-sm font-semibold text-[#3182F6] hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const permissionList = admin.permissions === "all"
    ? ["전체 권한"]
    : admin.permissions.split(",").filter(Boolean).map((p) => MENU_LABELS[p] || p);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin-accounts"
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#191F28] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록으로
        </Link>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#3182F6]/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#3182F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#191F28]">{admin.name}</h3>
              <code className="text-sm text-gray-500">{admin.loginId}</code>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {admin.role === "super" ? (
              <span className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">
                최고 관리자
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full bg-[#3182F6]/10 text-[#3182F6]">
                관리자
              </span>
            )}
            <span className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full ${
              admin.isActive ? "bg-[#03B26C]/10 text-[#03B26C]" : "bg-[#F04452]/10 text-[#F04452]"
            }`}>
              {admin.isActive ? "활성" : "비활성"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50/80 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">계정관리 권한</p>
            {admin.canManageAdmins ? (
              <span className="inline-flex items-center text-sm font-medium text-[#03B26C]">허용</span>
            ) : (
              <span className="inline-flex items-center text-sm font-medium text-gray-400">제한</span>
            )}
          </div>
          <div className="bg-gray-50/80 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">생성일</p>
            <p className="text-sm font-medium text-[#191F28]">{formatDate(admin.createdAt)}</p>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-4 md:col-span-2">
            <p className="text-xs font-semibold text-gray-500 mb-2">메뉴 권한</p>
            <div className="flex flex-wrap gap-1.5">
              {permissionList.map((perm) => (
                <span
                  key={perm}
                  className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[#3182F6]/10 text-[#3182F6]"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-[#191F28]">활동 로그</h3>
          <p className="text-xs text-gray-400 mt-1">최근 100건의 활동 기록</p>
        </div>
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400">활동 기록이 없습니다.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">일시</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">활동</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">상세</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-[#3182F6]/[0.02] transition-colors">
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[#191F28]/5 text-[#191F28]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {log.detail || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-500">{log.ip || "-"}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
