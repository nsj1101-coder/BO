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

const SvgIcon = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d={d} /></svg>
);

const menuItems = [
  { label: "대시보드", href: "/dashboard", icon: <SvgIcon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /> },
  { label: "디자인 설정", icon: <SvgIcon d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />, children: [
    { label: "메인 페이지", href: "/design/main-page" },
    { label: "서브 페이지", href: "/design/sub-page" },
    { label: "템플릿", href: "/design/templates" },
    { label: "팝업", href: "/popups" },
  ]},
  { label: "운영 관리", icon: <SvgIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" />, children: [
    { label: "게시판", href: "/boards" },
    { label: "FAQ", href: "/faq" },
    { label: "상담 신청", href: "/consultations" },
    { label: "문의", href: "/inquiries" },
    { label: "예약", href: "/reservations" },
    { label: "계정 관리", href: "/admin-accounts" },
  ]},
  { label: "회원 관리", icon: <SvgIcon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />, children: [
    { label: "가입 설정", href: "/members/settings" },
    { label: "회원 리스트", href: "/members" },
  ]},
  { label: "설정", href: "/settings", icon: <SvgIcon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
];

const allMenuItems = menuItems.flatMap((m) =>
  m.children
    ? m.children.map((c) => ({ label: c.label, href: c.href, parent: m.label }))
    : [{ label: m.label, href: m.href!, parent: "" }]
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ "디자인 설정": true, "운영 관리": true, "회원 관리": true });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then(setUser).catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); setSearchQuery(""); }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => { if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50); }, [searchOpen]);

  const searchResults = searchQuery.trim()
    ? allMenuItems.filter((m) => m.label.includes(searchQuery) || m.parent.includes(searchQuery))
    : allMenuItems;

  const hasPermission = (href: string): boolean => {
    if (!user) return false;
    if (user.role === "super" || user.permissions === "all") return true;
    const perms = user.permissions.split(",").map((p) => p.trim());
    const path = href.replace(/^\//, "");
    if (path === "admin-accounts") return user.role === "super" || user.canManageAdmins;
    return perms.some((p) => path.startsWith(p));
  };

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };

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

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-3 border-[#4332f8] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pageTitle = menuItems.flatMap((m) => (m.children ? m.children : [m])).find((m) => pathname === m.href || pathname.startsWith(m.href + "/"))?.label ?? "";
  const sideW = collapsed ? 65 : 230;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Pretendard', sans-serif", background: "#fff" }}>

      {/* ===== Top Header ===== */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, height: 64, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: -0.5 }}>SJCMS</span>
          <span style={{ fontSize: 11, color: "#aaa", fontWeight: 500 }}>v0.001</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => { setSearchOpen(true); setSearchQuery(""); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 100, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, color: "#999" }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            검색
            <span style={{ fontSize: 10, background: "#f3f4f6", padding: "2px 6px", borderRadius: 4, color: "#aaa" }}>⌘K</span>
          </button>
          <a href="/" target="_blank" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#999", textDecoration: "none" }}>
            홈페이지
            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
          <div style={{ width: 1, height: 20, background: "#e5e7eb" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 100, background: "#4332f8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{user.name[0]}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{user.name}</span>
            <button onClick={handleLogout} style={{ fontSize: 12, color: "#aaa", background: "none", border: "none", cursor: "pointer" }}>로그아웃</button>
          </div>
        </div>
      </header>

      {/* ===== Left Sidebar ===== */}
      <aside style={{ position: "fixed", top: 64, left: 0, width: sideW, height: "calc(100vh - 64px)", background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", padding: "12px 0", zIndex: 40, transition: "width 0.2s ease", overflow: "hidden" }}>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", marginBottom: 8, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#999", whiteSpace: "nowrap" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transition: "transform 0.2s", transform: collapsed ? "rotate(180deg)" : "none" }}>
            <polyline points="10 4 6 8 10 12" />
          </svg>
          {!collapsed && "접기"}
        </button>

        {/* Menu items */}
        <nav style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
          {menuItems.map((item) => {
            const visibleChildren = item.children?.filter((c) => hasPermission(c.href));
            if (item.children && (!visibleChildren || visibleChildren.length === 0)) return null;
            if (item.href && !hasPermission(item.href)) return null;

            if (item.href) {
              const active = isActive(item.href);
              return (
                <Link key={item.label} href={item.href} style={{
                  display: "flex", alignItems: "center", height: 48, padding: collapsed ? "0" : "0 12px", borderRadius: 100,
                  background: active ? "#4332f8" : "transparent",
                  boxShadow: active ? "0 4px 20px rgba(67,50,248,0.2)" : "none",
                  textDecoration: "none", whiteSpace: "nowrap", justifyContent: collapsed ? "center" : "flex-start",
                  transition: "all 0.15s ease",
                }}>
                  <span style={{ width: 36, height: 36, borderRadius: 100, background: active ? "#fff" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: collapsed ? 0 : 12, color: "#999", lineHeight: 0, transition: "margin 0.2s" }}>{item.icon}</span>
                  {!collapsed && <span style={{ fontSize: 15, fontWeight: 600, color: active ? "#fff" : "#333" }}>{item.label}</span>}
                </Link>
              );
            }

            // Group with children
            const hasActiveChild = visibleChildren?.some((c) => isActive(c.href, visibleChildren)) ?? false;
            return (
              <div key={item.label}>
                <button
                  onClick={() => {
                    if (collapsed && visibleChildren && visibleChildren.length > 0) {
                      router.push(visibleChildren[0].href);
                    } else {
                      setOpenMenus((prev) => ({ ...prev, [item.label]: !prev[item.label] }));
                    }
                  }}
                  style={{
                    display: "flex", alignItems: "center", width: "100%", height: 48, padding: collapsed ? "0" : "0 12px",
                    borderRadius: 100, border: "none", cursor: "pointer",
                    background: collapsed && hasActiveChild ? "#4332f8" : "transparent",
                    boxShadow: collapsed && hasActiveChild ? "0 4px 20px rgba(67,50,248,0.2)" : "none",
                    justifyContent: collapsed ? "center" : "flex-start", whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ width: 36, height: 36, borderRadius: 100, background: collapsed && hasActiveChild ? "#fff" : hasActiveChild ? "rgba(67,50,248,0.1)" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: collapsed ? 0 : 12, color: "#999", lineHeight: 0, transition: "margin 0.2s" }}>{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span style={{ fontSize: 15, fontWeight: 600, color: hasActiveChild ? "#4332f8" : "#333", flex: 1, textAlign: "left" }}>{item.label}</span>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#bbb" strokeWidth="1.5" style={{ transition: "transform 0.2s", transform: openMenus[item.label] ? "rotate(180deg)" : "none" }}>
                        <polyline points="4 6 8 10 12 6" />
                      </svg>
                    </>
                  )}
                </button>
                {!collapsed && openMenus[item.label] && visibleChildren && (
                  <div style={{ paddingLeft: 30, marginTop: 2, marginBottom: 4 }}>
                    {visibleChildren.map((child) => {
                      const active = isActive(child.href, visibleChildren);
                      return (
                        <Link key={child.href} href={child.href} style={{
                          display: "flex", alignItems: "center", height: 38, padding: "0 16px", borderRadius: 100,
                          background: active ? "#4332f8" : "transparent",
                          boxShadow: active ? "0 2px 12px rgba(67,50,248,0.15)" : "none",
                          textDecoration: "none", whiteSpace: "nowrap",
                          transition: "all 0.15s ease",
                        }}>
                          <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "#fff" : "#888" }}>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ===== Main Content ===== */}
      <main style={{ marginLeft: sideW, marginTop: 64, minHeight: "calc(100vh - 64px)", transition: "margin-left 0.2s ease" }}>
        <div style={{ padding: "24px 32px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: 0 }}>{pageTitle}</h2>
          <span style={{ fontSize: 12, color: "#bbb" }} suppressHydrationWarning>{new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
        <div style={{ padding: "16px 32px 32px" }}>{children}</div>
      </main>

      {/* ===== Spotlight Search ===== */}
      {searchOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "18vh" }} onClick={() => setSearchOpen(false)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 480, borderRadius: 20, overflow: "hidden", background: "#fff", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid #eee" }}>
              <svg width="18" height="18" fill="none" stroke="#4332f8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && searchResults.length > 0) { router.push(searchResults[0].href); setSearchOpen(false); } }}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: "#333" }} placeholder="메뉴 검색..." />
              <span style={{ fontSize: 11, background: "#f3f4f6", padding: "3px 8px", borderRadius: 6, color: "#aaa" }}>ESC</span>
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto", padding: "8px 0" }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#ccc", fontSize: 14 }}>검색 결과가 없습니다.</div>
              ) : searchResults.map((item) => (
                <button key={item.href} onClick={() => { router.push(item.href); setSearchOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: 14, color: "#333", transition: "background 0.1s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ width: 28, height: 28, borderRadius: 100, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>→</span>
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.label}</span>
                    {item.parent && <span style={{ fontSize: 12, color: "#bbb", marginLeft: 8 }}>{item.parent}</span>}
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#ccc" }}>{item.href}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
