"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface User {
  name: string;
  role: string;
  permissions: string;
  canManageAdmins: boolean;
}

const menuItems = [
  {
    label: "대시보드",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: "디자인 설정",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    children: [
      { label: "메인 페이지 관리", href: "/design/main-page" },
      { label: "서브 페이지 관리", href: "/design/sub-page" },
      { label: "템플릿 관리", href: "/design/templates" },
      { label: "팝업 관리", href: "/popups" },
    ],
  },
  {
    label: "운영 관리",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    children: [
      { label: "게시판 관리", href: "/boards" },
      { label: "FAQ 관리", href: "/faq" },
      { label: "상담 관리", href: "/consultations" },
      { label: "문의 관리", href: "/inquiries" },
      { label: "예약 관리", href: "/reservations" },
      { label: "계정 관리", href: "/admin-accounts" },
    ],
  },
  {
    label: "회원 관리",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    children: [
      { label: "회원가입 설정", href: "/members/settings" },
      { label: "회원 리스트", href: "/members" },
    ],
  },
  {
    label: "설정",
    href: "/settings",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ "디자인 설정": true, "운영 관리": true, "회원 관리": true });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setUser)
      .catch(() => router.push("/login"));
  }, [router]);

  const hasPermission = (href: string): boolean => {
    if (!user) return false;
    if (user.role === "super" || user.permissions === "all") return true;
    const perms = user.permissions.split(",").map((p) => p.trim());
    const path = href.replace(/^\//, "");
    if (path === "admin-accounts") return user.role === "super" || user.canManageAdmins;
    return perms.some((p) => path.startsWith(p));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F6]">
        <div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F2F4F6]">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#191F28] text-white flex flex-col fixed h-screen z-30">
        <div className="px-6 py-6 border-b border-white/10">
          <h1 className="text-xl font-extrabold tracking-tight">SJCMS</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">Admin v0.001</p>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <a href="/" target="_blank" className="flex items-center gap-3 px-6 py-3 mb-1 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
            </svg>
            홈페이지
            <svg className="w-3 h-3 ml-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
          {menuItems.map((item) => {
            // Filter children by permission
            const visibleChildren = item.children?.filter((c) => hasPermission(c.href));
            // Hide parent if no visible children and no direct href
            if (item.children && (!visibleChildren || visibleChildren.length === 0)) return null;
            if (item.href && !hasPermission(item.href)) return null;

            return item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all ${
                  pathname === item.href
                    ? "bg-[#3182F6]/15 text-[#3182F6] border-r-2 border-[#3182F6]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ) : (
              <div key={item.label}>
                <button
                  onClick={() =>
                    setOpenMenus((prev) => ({ ...prev, [item.label]: !prev[item.label] }))
                  }
                  className="flex items-center justify-between w-full px-6 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${openMenus[item.label] ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openMenus[item.label] && visibleChildren && (
                  <div className="ml-6 border-l border-white/10">
                    {visibleChildren.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block pl-6 pr-4 py-2.5 text-[13px] transition-all ${
                          (() => {
                            const matches = visibleChildren.filter((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
                            const best = matches.sort((a, b) => b.href.length - a.href.length)[0];
                            return best?.href === child.href;
                          })()
                            ? "text-[#3182F6] font-semibold"
                            : "text-gray-500 hover:text-white"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-[11px] text-gray-500">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-[#F04452] transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[260px] min-h-screen">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#191F28]">
              {menuItems.flatMap((m) => (m.children ? m.children : [m])).find((m) => pathname.startsWith(m.href))?.label ?? ""}
            </h2>
            <div className="text-xs text-gray-400">
              {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
