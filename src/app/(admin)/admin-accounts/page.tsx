"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Admin {
  id: number;
  loginId: string;
  name: string;
  role: "super" | "admin";
  isActive: boolean;
  permissions: string;
  canManageAdmins: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { logs: number };
}

interface CurrentUser {
  id: number;
  loginId: string;
  name: string;
  role: string;
  permissions: string;
  canManageAdmins: boolean;
}

interface AdminForm {
  name: string;
  loginId: string;
  password: string;
  role: "super" | "admin";
  canManageAdmins: boolean;
  permissions: string;
}

const MENU_PATHS = [
  { value: "dashboard", label: "대시보드" },
  { value: "design/main-page", label: "메인 페이지 관리" },
  { value: "design/sub-page", label: "서브 페이지 관리" },
  { value: "design/templates", label: "템플릿 관리" },
  { value: "popups", label: "팝업 관리" },
  { value: "boards", label: "게시판 관리" },
  { value: "faq", label: "FAQ 관리" },
  { value: "settings", label: "설정" },
  { value: "admin-accounts", label: "계정 관리" },
] as const;

const defaultForm: AdminForm = {
  name: "",
  loginId: "",
  password: "",
  role: "admin",
  canManageAdmins: false,
  permissions: "all",
};

export default function AdminAccountsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const checkPermission = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (!res.ok) { router.push("/login"); return; }
    const user: CurrentUser = await res.json();
    setCurrentUser(user);
    if (user.role === "super" || user.canManageAdmins) {
      setAuthorized(true);
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admins");
    if (res.ok) setAdmins(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { checkPermission(); }, [checkPermission]);
  useEffect(() => { if (authorized) fetchAdmins(); }, [authorized, fetchAdmins]);

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (admin: Admin) => {
    setEditId(admin.id);
    setForm({
      name: admin.name,
      loginId: admin.loginId,
      password: "",
      role: admin.role,
      canManageAdmins: admin.canManageAdmins,
      permissions: admin.permissions,
    });
    setError("");
    setShowModal(true);
  };

  const selectedPaths = form.permissions === "all" ? MENU_PATHS.map((m) => m.value) : form.permissions.split(",").filter(Boolean);
  const isAllSelected = form.permissions === "all";

  const toggleAllPermissions = (checked: boolean) => {
    setForm({ ...form, permissions: checked ? "all" : "" });
  };

  const togglePermission = (path: string) => {
    if (isAllSelected) {
      const next = MENU_PATHS.map((m) => m.value).filter((v) => v !== path);
      setForm({ ...form, permissions: next.join(",") });
      return;
    }
    const current = new Set(selectedPaths);
    if (current.has(path)) current.delete(path);
    else current.add(path);
    const arr = Array.from(current);
    if (arr.length === MENU_PATHS.length) {
      setForm({ ...form, permissions: "all" });
    } else {
      setForm({ ...form, permissions: arr.join(",") });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const url = editId ? `/api/admins/${editId}` : "/api/admins";
    const method = editId ? "PUT" : "POST";
    const body: Record<string, unknown> = {
      name: form.name,
      role: form.role,
      canManageAdmins: form.canManageAdmins,
      permissions: form.permissions,
    };
    if (!editId) {
      body.loginId = form.loginId;
      body.password = form.password;
    } else if (form.password) {
      body.password = form.password;
    }
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setShowModal(false);
      fetchAdmins();
    } else {
      const data = await res.json();
      setError(data.error || "오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/admins/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteConfirm(null);
      fetchAdmins();
    } else {
      const data = await res.json();
      alert(data.error || "삭제 실패");
      setDeleteConfirm(null);
    }
  };

  const handleToggleActive = async (admin: Admin) => {
    await fetch(`/api/admins/${admin.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !admin.isActive }),
    });
    fetchAdmins();
  };

  if (!authorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">관리자 계정을 생성하고 관리합니다.</p>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B64DA] shadow-lg shadow-[#3182F6]/20 transition-all"
        >
          계정 생성
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#3182F6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#3182F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">등록된 관리자 계정이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">이름</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">아이디</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">역할</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">상태</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">계정관리</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">로그</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">생성일</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b border-gray-50 hover:bg-[#3182F6]/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin-accounts/${admin.id}`} className="font-semibold text-[#191F28] hover:text-[#3182F6] transition-colors">
                      {admin.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600">{admin.loginId}</code>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {admin.role === "super" ? (
                      <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">
                        최고 관리자
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[#3182F6]/10 text-[#3182F6]">
                        관리자
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleActive(admin)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        admin.isActive ? "bg-[#3182F6]" : "bg-gray-200"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        admin.isActive ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {admin.canManageAdmins ? (
                      <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[#03B26C]/10 text-[#03B26C]">
                        허용
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">
                        제한
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link href={`/admin-accounts/${admin.id}`} className="font-semibold text-[#3182F6] hover:underline">{admin._count.logs}</Link>
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-gray-500">
                    {new Date(admin.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <Link
                        href={`/admin-accounts/${admin.id}`}
                        className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        상세
                      </Link>
                      <button
                        onClick={() => openEdit(admin)}
                        className="px-3 py-1.5 text-[11px] font-semibold text-[#3182F6] bg-[#3182F6]/10 rounded-lg hover:bg-[#3182F6]/20 transition-colors"
                      >
                        수정
                      </button>
                      {admin.role === "super" ? null : currentUser?.id === admin.id ? null : deleteConfirm === admin.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(admin.id)}
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
                          onClick={() => setDeleteConfirm(admin.id)}
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
                {editId ? "계정 수정" : "계정 생성"}
              </h3>
            </div>
            <div className="p-6 space-y-5">
              {error && (
                <div className="px-4 py-3 bg-[#F04452]/10 border border-[#F04452]/20 rounded-xl text-sm text-[#F04452] font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">이름</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                  placeholder="관리자 이름"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">아이디</label>
                <input
                  type="text"
                  value={form.loginId}
                  onChange={(e) => setForm({ ...form, loginId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                  placeholder="로그인 아이디"
                  disabled={!!editId}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  비밀번호{editId && <span className="text-gray-400 font-normal ml-1">(변경 시에만 입력)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                  placeholder={editId ? "변경하지 않으려면 비워두세요" : "비밀번호"}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">역할</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as "super" | "admin" })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] bg-white transition-all"
                >
                  <option value="admin">관리자</option>
                  <option value="super">최고 관리자</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500">계정관리 접근 허용</label>
                  <p className="text-[11px] text-gray-400 mt-0.5">이 계정이 다른 관리자 계정을 관리할 수 있습니다</p>
                </div>
                <button
                  onClick={() => setForm({ ...form, canManageAdmins: !form.canManageAdmins })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.canManageAdmins ? "bg-[#3182F6]" : "bg-gray-200"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    form.canManageAdmins ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-3">메뉴 권한</label>
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <label className="flex items-center gap-3 pb-3 border-b border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => toggleAllPermissions(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#3182F6] focus:ring-[#3182F6]"
                    />
                    <span className="text-sm font-semibold text-[#191F28]">전체 권한</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {MENU_PATHS.map((menu) => (
                      <label key={menu.value} className="flex items-center gap-3 py-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAllSelected || selectedPaths.includes(menu.value)}
                          onChange={() => togglePermission(menu.value)}
                          className="w-4 h-4 rounded border-gray-300 text-[#3182F6] focus:ring-[#3182F6]"
                        />
                        <span className="text-sm text-gray-600">{menu.label}</span>
                      </label>
                    ))}
                  </div>
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
                disabled={saving || !form.name || (!editId && (!form.loginId || !form.password))}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B64DA] shadow-lg shadow-[#3182F6]/20 disabled:opacity-50 transition-all"
              >
                {saving ? "저장 중..." : editId ? "수정" : "생성"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
