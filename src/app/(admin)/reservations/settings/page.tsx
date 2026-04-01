"use client";

import { useEffect, useState, useCallback } from "react";

interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "radio";
  required: boolean;
  options: string;
}

interface FieldForm {
  key: string;
  label: string;
  type: FieldConfig["type"];
  required: boolean;
  options: string;
}

const emptyForm: FieldForm = { key: "", label: "", type: "text", required: false, options: "" };

const typeLabels: Record<FieldConfig["type"], string> = {
  text: "텍스트", email: "이메일", phone: "전화번호", textarea: "장문",
  select: "선택", checkbox: "체크박스", radio: "라디오",
};

const typeBadgeColors: Record<FieldConfig["type"], string> = {
  text: "bg-gray-100 text-gray-700", email: "bg-blue-50 text-blue-700",
  phone: "bg-green-50 text-green-700", textarea: "bg-purple-50 text-purple-700",
  select: "bg-amber-50 text-amber-700", checkbox: "bg-pink-50 text-pink-700",
  radio: "bg-teal-50 text-teal-700",
};

export default function ReservationSettingsPage() {
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<FieldForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/form-configs/reservation");
    if (res.ok) {
      const data = await res.json();
      let f = data.fields || [];
      if (typeof f === "string") try { f = JSON.parse(f); } catch { f = []; }
      setFields(Array.isArray(f) ? f : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const saveAll = async (updated: FieldConfig[]) => {
    setSaving(true);
    await fetch("/api/form-configs/reservation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: updated }),
    });
    setSaving(false);
  };

  const openCreate = () => {
    setEditIndex(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (index: number) => {
    const f = fields[index];
    setEditIndex(index);
    setForm({ key: f.key, label: f.label, type: f.type, required: f.required, options: f.options || "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.key.trim() || !form.label.trim()) return;
    const field: FieldConfig = { ...form };
    let updated: FieldConfig[];
    if (editIndex !== null) {
      updated = fields.map((f, i) => (i === editIndex ? field : f));
    } else {
      updated = [...fields, field];
    }
    setFields(updated);
    setModalOpen(false);
    await saveAll(updated);
  };

  const handleDelete = async (index: number) => {
    const updated = fields.filter((_, i) => i !== index);
    setFields(updated);
    setDeleteConfirm(null);
    await saveAll(updated);
  };

  const moveField = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= fields.length) return;
    const updated = [...fields];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setFields(updated);
    await saveAll(updated);
  };

  const needsOptions = (type: string) => ["select", "checkbox", "radio"].includes(type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#191F28]">예약 폼 필드 설정</h3>
          <p className="text-sm text-gray-500 mt-1">예약 신청 폼에서 수집할 필드를 관리합니다.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-[#3182F6] text-white text-sm font-semibold rounded-xl hover:bg-[#1B64DA] transition-colors"
        >
          필드 추가
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">등록된 필드가 없습니다.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">순서</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">필드키</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">라벨</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">타입</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">필수</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fields.map((field, index) => (
                <tr key={`${field.key}-${index}`} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveField(index, "up")} disabled={index === 0} className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button onClick={() => moveField(index, "down")} disabled={index === fields.length - 1} className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <span className="text-sm text-gray-400 ml-1">{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{field.key}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#191F28]">{field.label}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${typeBadgeColors[field.type]}`}>{typeLabels[field.type]}</span>
                  </td>
                  <td className="px-6 py-4">
                    {field.required ? (
                      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-md bg-red-50 text-red-600">필수</span>
                    ) : (
                      <span className="text-xs text-gray-400">선택</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(index)} className="px-3 py-1.5 text-xs font-medium text-[#3182F6] bg-[#3182F6]/10 rounded-lg hover:bg-[#3182F6]/20 transition-colors">수정</button>
                      {deleteConfirm === index ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(index)} className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">확인</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">취소</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(index)} className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">삭제</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {saving && (
        <div className="fixed bottom-6 right-6 bg-[#191F28] text-white px-5 py-3 rounded-xl text-sm font-medium shadow-lg">
          저장 중...
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8">
            <h4 className="text-lg font-bold text-[#191F28] mb-6">{editIndex !== null ? "필드 수정" : "필드 추가"}</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">필드 키</label>
                <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="예: preferred_date, service_type" disabled={editIndex !== null} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30 focus:border-[#3182F6] transition-all disabled:bg-gray-50 disabled:text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">라벨</label>
                <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="사용자에게 보여지는 이름" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30 focus:border-[#3182F6] transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">필드 타입</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FieldConfig["type"] })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30 focus:border-[#3182F6] transition-all">
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {needsOptions(form.type) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">옵션 (쉼표 구분)</label>
                  <input value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder="옵션1, 옵션2, 옵션3" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30 focus:border-[#3182F6] transition-all" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setForm({ ...form, required: !form.required })} className={`relative w-11 h-6 rounded-full transition-colors ${form.required ? "bg-[#3182F6]" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.required ? "translate-x-5" : ""}`} />
                </button>
                <span className="text-sm font-medium text-gray-700">필수 항목</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">취소</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-white bg-[#3182F6] rounded-xl hover:bg-[#1B64DA] disabled:opacity-50 transition-colors">{saving ? "저장 중..." : "저장"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
