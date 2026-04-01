"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Section {
  id: number;
  isFixed: boolean;
  fixPosition: string | null;
  html: string;
  css: string;
  js: string;
}

interface PageData {
  title: string;
  sections: Section[];
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const pageId = searchParams.get("id");
  const [page, setPage] = useState<PageData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = pageId ? `/api/front?id=${pageId}` : "/api/front";
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Page not found");
        return r.json();
      })
      .then(setPage)
      .catch((e) => setError(e.message));
  }, [pageId]);

  useEffect(() => {
    if (!page) return;
    page.sections.forEach((s) => {
      if (s.js) {
        try {
          const fn = new Function(s.js);
          fn();
        } catch (e) {
          console.error("Section JS error:", e);
        }
      }
    });
  }, [page]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">페이지를 찾을 수 없습니다</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {page.sections.map((s) =>
        s.css ? <style key={`css-${s.id}`} dangerouslySetInnerHTML={{ __html: s.css }} /> : null
      )}
      {page.sections.map((s) => (
        <div key={s.id} dangerouslySetInnerHTML={{ __html: s.html }} />
      ))}
    </>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" /></div>}>
      <PreviewContent />
    </Suspense>
  );
}
