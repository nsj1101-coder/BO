"use client";

import { useEffect, useState } from "react";

interface Section {
  id: number;
  html: string;
  css: string;
  js: string;
}

interface PageData {
  title: string;
  sections: Section[];
}

interface PopupData {
  id: number;
  title: string;
  popupType: string;
  imageUrl: string | null;
  htmlContent: string;
  linkUrl: string | null;
}

export default function IndexPage() {
  const [page, setPage] = useState<PageData | null>(null);
  const [popups, setPopups] = useState<PopupData[]>([]);
  const [closedPopups, setClosedPopups] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/front").then((r) => r.json()).then(setPage).catch(() => {});
    fetch("/api/popups/active").then((r) => r.json()).then(setPopups).catch(() => {});

    const hidden = localStorage.getItem("closedPopups");
    if (hidden) {
      try {
        const parsed = JSON.parse(hidden);
        const now = Date.now();
        const valid = Object.entries(parsed).filter(([, ts]) => now - (ts as number) < 86400000);
        setClosedPopups(new Set(valid.map(([id]) => Number(id))));
      } catch {}
    }
  }, []);

  const closePopup = (id: number, today?: boolean) => {
    setClosedPopups((prev) => new Set(prev).add(id));
    if (today) {
      const hidden = JSON.parse(localStorage.getItem("closedPopups") || "{}");
      hidden[id] = Date.now();
      localStorage.setItem("closedPopups", JSON.stringify(hidden));
    }
  };

  const activePopups = popups.filter((p) => !closedPopups.has(p.id));

  if (!page) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #3182F6", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" />
      <style>{`body{margin:0;font-family:'Pretendard',-apple-system,sans-serif}`}</style>

      {page.sections.map((s) =>
        s.css ? <style key={`css-${s.id}`} dangerouslySetInnerHTML={{ __html: s.css }} /> : null
      )}
      {page.sections.map((s) => (
        <div key={s.id} dangerouslySetInnerHTML={{ __html: s.html }} />
      ))}

      {/* Popups */}
      {activePopups.map((popup) => (
        <div key={popup.id} style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", maxWidth: 480, width: "90%", boxShadow: "0 24px 80px rgba(0,0,0,0.2)", position: "relative" }}>
            {popup.popupType === "image" && popup.imageUrl ? (
              popup.linkUrl ? (
                <a href={popup.linkUrl}><img src={popup.imageUrl} alt={popup.title} style={{ width: "100%", display: "block" }} /></a>
              ) : (
                <img src={popup.imageUrl} alt={popup.title} style={{ width: "100%", display: "block" }} />
              )
            ) : (
              <div dangerouslySetInnerHTML={{ __html: popup.htmlContent }} />
            )}
            <div style={{ display: "flex", borderTop: "1px solid #f1f1f1" }}>
              <button onClick={() => closePopup(popup.id, true)} style={{ flex: 1, padding: "14px 0", fontSize: 13, color: "#999", background: "none", border: "none", cursor: "pointer", borderRight: "1px solid #f1f1f1" }}>
                오늘 하루 안 보기
              </button>
              <button onClick={() => closePopup(popup.id)} style={{ flex: 1, padding: "14px 0", fontSize: 13, color: "#333", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                닫기
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
