"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface MemberField {
  id: number;
  fieldKey: string;
  label: string;
  fieldType: string;
  required: boolean;
  options: string;
  sortOrder: number;
}

interface Member {
  id: number;
  email: string;
  name: string;
  phone: string;
  isActive: boolean;
  extraData: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [fields, setFields] = useState<MemberField[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [memberRes, fieldsRes] = await Promise.all([
      fetch(`/api/members/${id}`),
      fetch("/api/member-fields"),
    ]);
    if (memberRes.ok) {
      const m: Member = await memberRes.json();
      setMember(m);
      setForm({
        name: m.name,
        email: m.email,
        phone: m.phone || "",
        ...m.extraData,
      });
    }
    if (fieldsRes.ok) {
      setFields(await fieldsRes.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!member) return;
    setSaving(true);
    const { name, email, phone, ...extraData } = form;
    const res = await fetch(`/api/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, extraData }),
    });
    if (res.ok) {
      setEditing(false);
      fetchData();
    }
    setSaving(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });

  const fieldKeySet = new Set(fields.map((f) => f.fieldKey));
  const removedExtraKeys = member
    ? Object.keys(member.extraData).filter((k) => !fieldKeySet.has(k))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-7 h-7 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-400">회원을 찾을 수 없습니다.</p>
        <Link href="/members" className="text-sm text-[#3182F6] mt-4 inline-block hover:underline">목록으로</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/members"
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h3 className="text-xl font-bold text-[#191F28]">회원 상세</h3>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-5 py-2.5 bg-[#3182F6] text-white text-sm font-semibold rounded-xl hover:bg-[#1B64DA] transition-colors"
          >
            수정
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); fetchData(); }}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-[#3182F6] text-white text-sm font-semibold rounded-xl hover:bg-[#1B64DA] disabled:opacity-50 transition-colors"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400">가입일</p>
            <p className="text-sm text-gray-600 mt-0.5">{formatDate(member.createdAt)}</p>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${member.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
            {member.isActive ? "활성" : "비활성"}
          </span>
        </div>

        {[
          { key: "name", label: "이름" },
          { key: "email", label: "이메일" },
          { key: "phone", label: "연락처" },
        ].map(({ key, label }) => (
          <div key={key} className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="text-sm font-semibold text-gray-500">{label}</label>
            {editing ? (
              <input
                value={form[key] || ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30 focus:border-[#3182F6] transition-all"
              />
            ) : (
              <p className="text-sm text-[#191F28]">{String((member as unknown as Record<string, unknown>)[key] ?? "-")}</p>
            )}
          </div>
        ))}

        {fields.length > 0 && (
          <>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">추가 필드</p>
            </div>
            {fields.map((field) => (
              <div key={field.fieldKey} className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-sm font-semibold text-gray-500">{field.label}</label>
                {editing ? (
                  field.fieldType === "textarea" ? (
                    <textarea
                      value={form[field.fieldKey] || ""}
                      onChange={(e) => setForm({ ...form, [field.fieldKey]: e.target.value })}
                      rows={3}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30 focus:border-[#3182F6] transition-all resize-none"
                    />
                  ) : field.fieldType === "select" ? (
                    <select
                      value={form[field.fieldKey] || ""}
                      onChange={(e) => setForm({ ...form, [field.fieldKey]: e.target.value })}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30 focus:border-[#3182F6] transition-all"
                    >
                      <option value="">선택</option>
                      {field.options.split(",").map((opt) => (
                        <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form[field.fieldKey] || ""}
                      onChange={(e) => setForm({ ...form, [field.fieldKey]: e.target.value })}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30 focus:border-[#3182F6] transition-all"
                    />
                  )
                ) : (
                  <p className="text-sm text-[#191F28]">{member.extraData[field.fieldKey] || "-"}</p>
                )}
              </div>
            ))}
          </>
        )}

        {removedExtraKeys.length > 0 && (
          <>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">삭제된 필드 (데이터 보존)</p>
            </div>
            {removedExtraKeys.map((key) => (
              <div key={key} className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-sm font-semibold text-gray-400 italic">{key}</label>
                <p className="text-sm text-gray-400 italic">{member.extraData[key] || "-"}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
