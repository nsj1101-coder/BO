"use client";

import { useEffect, useState, useRef } from "react";
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
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  },
  {
    label: "디자인 설정",
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
    children: [
      { label: "메인 페이지", href: "/design/main-page" },
      { label: "서브 페이지", href: "/design/sub-page" },
      { label: "템플릿", href: "/design/templates" },
      { label: "팝업", href: "/popups" },
    ],
  },
  {
    label: "운영 관리",
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    children: [
      { label: "게시판", href: "/boards" },
      { label: "FAQ", href: "/faq" },
      { label: "상담 신청", href: "/consultations" },
      { label: "문의", href: "/inquiries" },
      { label: "예약", href: "/reservations" },
      { label: "계정 관리", href: "/admin-accounts" },
    ],
  },
  {
    label: "회원 관리",
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    children: [
      { label: "가입 설정", href: "/members/settings" },
      { label: "회원 리스트", href: "/members" },
    ],
  },
  {
    label: "설정",
    href: "/settings",
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

// Flatten all menu items for search
const allMenuItems = menuItems.flatMap((m) =>
  m.children
    ? m.children.map((c) => ({ label: c.label, href: c.href, parent: m.label }))
    : [{ label: m.label, href: m.href, parent: "" }]
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ "디자인 설정": true, "운영 관리": true, "회원 관리": true });

  // Spotlight search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setUser)
      .catch(() => router.push("/login"));
  }, [router]);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setSearchQuery("");
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  const searchResults = searchQuery.trim()
    ? allMenuItems.filter((m) =>
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.parent.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allMenuItems;

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FCFBF9" }}>
        <div className="w-8 h-8 border-3 border-[#B8A99A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = (href: string, siblings?: { href: string }[]) => {
    if (pathname === href) return true;
    if (!pathname.startsWith(href + "/")) return false;
    if (siblings) {
      const matches = siblings.filter((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
      const best = matches.sort((a, b) => b.href.length - a.href.length)[0];
      return best?.href === href;
    }
    return true;
  };

  const pageTitle = menuItems.flatMap((m) => (m.children ? m.children : [m])).find((m) => pathname === m.href || pathname.startsWith(m.href + "/"))?.label ?? "";

  return (
    <div className="min-h-screen flex" style={{ background: "#FCFBF9", fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-[240px] flex flex-col fixed h-screen z-30" style={{ background: "#1C1614" }}>
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-lg font-bold tracking-tight" style={{ color: "#FCFBF9", fontFamily: "'Montserrat', sans-serif" }}>SJCMS</h1>
          <p className="text-[10px] mt-0.5" style={{ color: "#6E6560" }}>Admin v0.001</p>
        </div>

        {/* Search trigger */}
        <div className="px-4 mb-3">
          <button
            onClick={() => { setSearchOpen(true); setSearchQuery(""); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all"
            style={{ background: "rgba(255,255,255,0.06)", color: "#8A7E76", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            검색
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "#6E6560" }}>⌘K</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3">
          {/* Home link */}
          <a href="/" target="_blank" className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-lg text-[13px] transition-all" style={{ color: "#8A7E76" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>
            홈페이지
            <svg className="w-2.5 h-2.5 ml-auto" style={{ color: "#504945" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>

          <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.06)" }} />

          {menuItems.map((item) => {
            const visibleChildren = item.children?.filter((c) => hasPermission(c.href));
            if (item.children && (!visibleChildren || visibleChildren.length === 0)) return null;
            if (item.href && !hasPermission(item.href)) return null;

            return item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] mb-0.5 transition-all"
                style={{
                  color: isActive(item.href) ? "#FCFBF9" : "#8A7E76",
                  background: isActive(item.href) ? "rgba(184,169,154,0.15)" : "transparent",
                  fontWeight: isActive(item.href) ? 600 : 400,
                }}
              >
                <span style={{ color: isActive(item.href) ? "#B8A99A" : "#6E6560" }}>{item.icon}</span>
                {item.label}
              </Link>
            ) : (
              <div key={item.label} className="mb-0.5">
                <button
                  onClick={() => setOpenMenus((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-[13px] transition-all"
                  style={{ color: "#8A7E76" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span className="flex items-center gap-2.5">
                    <span style={{ color: "#6E6560" }}>{item.icon}</span>
                    {item.label}
                  </span>
                  <svg className={`w-3 h-3 transition-transform ${openMenus[item.label] ? "rotate-180" : ""}`} style={{ color: "#504945" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openMenus[item.label] && visibleChildren && (
                  <div className="ml-4 mt-0.5 mb-1" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                    {visibleChildren.map((child) => {
                      const active = isActive(child.href, visibleChildren);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block pl-4 pr-3 py-1.5 rounded-r-lg text-[12px] transition-all"
                          style={{
                            color: active ? "#FCFBF9" : "#6E6560",
                            fontWeight: active ? 600 : 400,
                            background: active ? "rgba(184,169,154,0.12)" : "transparent",
                            borderLeft: active ? "2px solid #B8A99A" : "2px solid transparent",
                          }}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: "#B8A99A", color: "#1C1614" }}>
                {user.name[0]}
              </div>
              <div>
                <p className="text-[12px] font-medium" style={{ color: "#FCFBF9" }}>{user.name}</p>
                <p className="text-[10px]" style={{ color: "#6E6560" }}>{user.role === "super" ? "최고 관리자" : "관리자"}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-[11px] transition-colors" style={{ color: "#6E6560" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#B8A99A"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#6E6560"; }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[240px] min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 px-8 py-4" style={{ background: "rgba(252,251,249,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(184,169,154,0.15)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-base font-semibold" style={{ color: "#1C1614", letterSpacing: "-0.3px" }}>{pageTitle}</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSearchOpen(true); setSearchQuery(""); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-all"
                style={{ background: "rgba(184,169,154,0.1)", color: "#8A7E76", border: "1px solid rgba(184,169,154,0.15)" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                검색
                <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: "rgba(184,169,154,0.15)", color: "#B8A99A" }}>⌘K</span>
              </button>
              <span className="text-[12px]" style={{ color: "#B5B0AC" }}>
                {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>

      {/* Spotlight Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setSearchOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(28,22,20,0.4)", backdropFilter: "blur(8px)" }} />
          <div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: "#FCFBF9", boxShadow: "0 24px 80px rgba(28,22,20,0.25), 0 0 0 1px rgba(184,169,154,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(184,169,154,0.15)" }}>
              <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#B8A99A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults.length > 0) {
                    router.push(searchResults[0].href);
                    setSearchOpen(false);
                  }
                }}
                className="flex-1 bg-transparent outline-none text-[15px]"
                style={{ color: "#1C1614" }}
                placeholder="메뉴 검색..."
              />
              <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "rgba(184,169,154,0.15)", color: "#B8A99A" }}>ESC</span>
            </div>
            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto py-2">
              {searchResults.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px]" style={{ color: "#B5B0AC" }}>검색 결과가 없습니다.</div>
              ) : (
                searchResults.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => { router.push(item.href); setSearchOpen(false); }}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
                    style={{ color: "#4A3F3A" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(184,169,154,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#B8A99A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                    <div>
                      <span className="text-[13px] font-medium">{item.label}</span>
                      {item.parent && <span className="text-[11px] ml-2" style={{ color: "#B5B0AC" }}>{item.parent}</span>}
                    </div>
                    <span className="ml-auto text-[11px]" style={{ color: "#B5B0AC" }}>{item.href}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
