"use client";

import { useEffect, useState, useCallback } from "react";

interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface FaqForm {
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: FaqForm = {
  question: "",
  answer: "",
  category: "일반",
  sortOrder: 0,
  isActive: true,
};

export default function FaqAdminPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FaqForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/faqs");
    const data = await res.json();
    setFaqs(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, sortOrder: faqs.length });
    setModalOpen(true);
  };

  const openEdit = (faq: Faq) => {
    setEditId(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sortOrder: faq.sortOrder,
      isActive: faq.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      question: form.question,
      answer: form.answer,
      category: form.category,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    };

    if (editId) {
      await fetch(`/api/faqs/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setSaving(false);
    setModalOpen(false);
    fetchFaqs();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`/api/faqs/${id}`, { method: "DELETE" });
    fetchFaqs();
  };

  const toggleActive = async (faq: Faq) => {
    await fetch(`/api/faqs/${faq.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !faq.isActive }),
    });
    fetchFaqs();
  };

  const moveOrder = async (faq: Faq, direction: "up" | "down") => {
    const idx = faqs.findIndex((f) => f.id === faq.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= faqs.length) return;

    const other = faqs[swapIdx];
    await Promise.all([
      fetch(`/api/faqs/${faq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: other.sortOrder }),
      }),
      fetch(`/api/faqs/${other.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: faq.sortOrder }),
      }),
    ]);
    fetchFaqs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">자주 묻는 질문을 등록하고 관리합니다.</p>
        <div className="flex gap-2">
          <a
            href="/user-faq"
            target="_blank"
            className="px-4 py-2.5 text-sm font-bold text-[#191F28] bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            사용자 페이지
          </a>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B64DA] shadow-lg shadow-[#3182F6]/20 transition-all"
          >
            FAQ 등록
          </button>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            등록된 FAQ가 없습니다.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs w-16">순서</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs">질문</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs w-24">카테고리</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs w-24">상태</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs w-20">정렬</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs w-40">관리</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq, idx) => (
                <tr key={faq.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-4 text-center text-gray-400 font-mono text-xs">
                    {faq.sortOrder}
                  </td>
                  <td className="px-6 py-4 font-medium text-[#191F28] max-w-[400px] truncate">
                    {faq.question}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600">
                      {faq.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button onClick={() => toggleActive(faq)}>
                      <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                        faq.isActive
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      }`}>
                        {faq.isActive ? "활성" : "비활성"}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => moveOrder(faq, "up")}
                        disabled={idx === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveOrder(faq, "down")}
                        disabled={idx === faqs.length - 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap" style={{ minWidth: 140 }}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEdit(faq)}
                        className="px-4 py-1.5 text-[11px] font-semibold text-[#3182F6] bg-[#3182F6]/10 rounded-lg hover:bg-[#3182F6]/20 transition-all"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="px-4 py-1.5 text-[11px] font-semibold text-[#F04452] bg-[#F04452]/10 rounded-lg hover:bg-[#F04452]/20 transition-all"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <h3 className="text-lg font-bold text-[#191F28]">
              {editId ? "FAQ 수정" : "FAQ 등록"}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">질문</label>
              <input
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                placeholder="자주 묻는 질문을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">답변</label>
              <textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all resize-none"
                placeholder="답변을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">카테고리</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                  placeholder="일반"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">정렬순서</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="block text-xs font-semibold text-gray-500">활성 상태</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.isActive ? "bg-[#3182F6]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    form.isActive ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.question || !form.answer}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B64DA] shadow-lg shadow-[#3182F6]/20 disabled:opacity-50 transition-all"
              >
                {saving ? "저장 중..." : editId ? "수정" : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
