"use client";

import { useEffect, useState, useCallback } from "react";

interface Popup {
  id: number;
  title: string;
  description: string;
  popupType: string;
  imageUrl: string | null;
  htmlContent: string;
  linkUrl: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface PopupForm {
  title: string;
  description: string;
  popupType: string;
  imageUrl: string;
  htmlContent: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const emptyForm: PopupForm = {
  title: "",
  description: "",
  popupType: "image",
  imageUrl: "",
  htmlContent: "",
  linkUrl: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

export default function PopupsPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<PopupForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPopups = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/popups");
    const data = await res.json();
    setPopups(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPopups();
  }, [fetchPopups]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (popup: Popup) => {
    setEditId(popup.id);
    setForm({
      title: popup.title,
      description: popup.description,
      popupType: popup.popupType,
      imageUrl: popup.imageUrl || "",
      htmlContent: popup.htmlContent,
      linkUrl: popup.linkUrl || "",
      startDate: popup.startDate ? popup.startDate.slice(0, 16) : "",
      endDate: popup.endDate ? popup.endDate.slice(0, 16) : "",
      isActive: popup.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      title: form.title,
      description: form.description,
      popupType: form.popupType,
      imageUrl: form.imageUrl || null,
      htmlContent: form.htmlContent,
      linkUrl: form.linkUrl || null,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      isActive: form.isActive,
    };

    if (editId) {
      await fetch(`/api/popups/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/popups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setSaving(false);
    setModalOpen(false);
    fetchPopups();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`/api/popups/${id}`, { method: "DELETE" });
    fetchPopups();
  };

  const toggleActive = async (popup: Popup) => {
    await fetch(`/api/popups/${popup.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !popup.isActive }),
    });
    fetchPopups();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">팝업을 등록하고 관리합니다.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 text-sm font-bold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B64DA] shadow-lg shadow-[#3182F6]/20 transition-all"
        >
          팝업 등록
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : popups.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            등록된 팝업이 없습니다.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs">제목</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs">설명</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs">유형</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs">상태</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs">노출기간</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs">관리</th>
              </tr>
            </thead>
            <tbody>
              {popups.map((popup) => (
                <tr key={popup.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#191F28]">{popup.title}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate">
                    {popup.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      popup.popupType === "image"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-purple-50 text-purple-600"
                    }`}>
                      {popup.popupType === "image" ? "이미지" : "HTML"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => toggleActive(popup)}>
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        popup.isActive
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      }`}>
                        {popup.isActive ? "활성" : "비활성"}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-gray-500">
                    {formatDate(popup.startDate)} ~ {formatDate(popup.endDate)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(popup)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#3182F6] bg-[#3182F6]/10 rounded-lg hover:bg-[#3182F6]/20 transition-all"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(popup.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#F04452] bg-[#F04452]/10 rounded-lg hover:bg-[#F04452]/20 transition-all"
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
              {editId ? "팝업 수정" : "팝업 등록"}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">팝업 제목</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                placeholder="팝업 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">팝업 설명/메모</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all resize-none"
                placeholder="관리용 메모"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">유형</label>
              <div className="flex gap-4">
                {(["image", "html"] as const).map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="popupType"
                      checked={form.popupType === type}
                      onChange={() => setForm({ ...form, popupType: type })}
                      className="accent-[#3182F6]"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {type === "image" ? "이미지" : "HTML"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {form.popupType === "image" ? (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">이미지 URL</label>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                  placeholder="https://example.com/image.jpg"
                />
                {form.imageUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
                    <img src={form.imageUrl} alt="preview" className="w-full max-h-[200px] object-contain bg-gray-50" />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">HTML 코드</label>
                <textarea
                  value={form.htmlContent}
                  onChange={(e) => setForm({ ...form, htmlContent: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all resize-none"
                  placeholder="<div>팝업 HTML 코드</div>"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">링크 URL (선택)</label>
              <input
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">시작일시</label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">종료일시</label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
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
                disabled={saving || !form.title}
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
